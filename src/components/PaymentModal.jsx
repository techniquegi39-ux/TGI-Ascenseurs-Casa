import { useState } from 'react'
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  LoaderCircle,
  Receipt,
  X,
} from 'lucide-react'
import {
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/useAuth.js'

const PAYMENT_METHODS = ['Virement', 'Chèque', 'Espèces', 'Effet/Traite']

function getLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getOptionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function getInvoiceTotalTTC(invoice) {
  const explicitTotal = getOptionalNumber(invoice.totalTTC ?? invoice.totaux?.totalTTC)
  if (explicitTotal !== undefined && explicitTotal >= 0) {
    return explicitTotal
  }

  const items = Array.isArray(invoice.items) ? invoice.items : []
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity ?? item.quantite ?? 0)
    const unitPrice = Number(item.unitPrice ?? item.prixUnitaire ?? item.puHT ?? 0)
    const rate = Number(
      String(item.taxRate ?? item.tauxTVA ?? item.tva ?? 0).replace('%', '').trim(),
    )
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice) || !Number.isFinite(rate)) {
      return sum
    }

    const totalHT = getOptionalNumber(item.totalHT ?? item.totalHt) ?? quantity * unitPrice
    const totalTVA =
      getOptionalNumber(item.totalTVA ?? item.totalTva) ?? totalHT * (rate / 100)
    return sum + totalHT + totalTVA
  }, 0)
}

function getCurrentPaid(invoice, totalTTC) {
  const savedAmount = getOptionalNumber(invoice.montantPaye ?? invoice.amountPaid)
  if (savedAmount !== undefined) {
    return Math.max(0, savedAmount)
  }

  const status = String(invoice.status || invoice.statut || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
  if (status.includes('payee') && !status.includes('non pay')) {
    return totalTTC
  }
  return 0
}

function getWorkflow(invoice) {
  const status = String(
    invoice.workflowStatus || invoice.status || invoice.statut || '',
  )
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')

  if (status.includes('annul')) {
    return 'Annulée'
  }
  if (status.includes('brouillon') || status.includes('draft')) {
    return 'Brouillon'
  }
  return 'Validée'
}

function roundAmount(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MAD`
}

function FieldError({ id, message }) {
  if (!message) {
    return null
  }
  return (
    <p className="mt-1.5 text-xs text-red-700" id={id}>
      {message}
    </p>
  )
}

export default function PaymentModal({
  invoice,
  clientName,
  outstandingBalance,
  onClose,
  onSaved,
}) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState({
    paymentDate: getLocalDateString(new Date()),
    amount: '',
    paymentMethod: PAYMENT_METHODS[0],
    reference: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => {
      if (!previous[name]) {
        return previous
      }
      const nextErrors = { ...previous }
      delete nextErrors[name]
      return nextErrors
    })
    setFormError('')
  }

  function validate() {
    const nextErrors = {}
    const amount = Number(formData.amount)

    if (!formData.paymentDate || Number.isNaN(new Date(`${formData.paymentDate}T12:00:00`).getTime())) {
      nextErrors.paymentDate = 'Saisissez une date de paiement valide.'
    }
    if (formData.amount.trim() === '' || !Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = 'Le montant reçu doit être supérieur à zéro.'
    } else if (Math.abs(amount - roundAmount(amount)) > 0.000001) {
      nextErrors.amount = 'Saisissez un montant avec au maximum deux décimales.'
    } else if (amount > outstandingBalance + 0.000001) {
      nextErrors.amount = 'Le montant ne peut pas dépasser le reste à payer.'
    }
    if (!PAYMENT_METHODS.includes(formData.paymentMethod)) {
      nextErrors.paymentMethod = 'Sélectionnez un mode de règlement valide.'
    }
    if (formData.reference.trim().length > 120) {
      nextErrors.reference = 'La référence ne doit pas dépasser 120 caractères.'
    }
    if (formData.notes.trim().length > 2000) {
      nextErrors.notes = 'Les notes ne doivent pas dépasser 2 000 caractères.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!validate()) {
      return
    }

    const paymentAmount = roundAmount(Number(formData.amount))
    const paymentDate = new Date(`${formData.paymentDate}T12:00:00`)
    setIsSaving(true)

    try {
      const invoiceRef = doc(db, 'invoices', invoice.id)
      const paymentResult = await runTransaction(db, async (transaction) => {
        const invoiceSnapshot = await transaction.get(invoiceRef)
        if (!invoiceSnapshot.exists()) {
          throw new Error('Cette facture n’existe plus.')
        }

        const currentInvoice = invoiceSnapshot.data()
        const workflowStatus = getWorkflow(currentInvoice)
        if (workflowStatus === 'Annulée') {
          throw new Error('Une facture annulée ne peut pas recevoir de paiement.')
        }
        if (workflowStatus === 'Brouillon') {
          throw new Error('Validez la facture avant d’enregistrer un paiement.')
        }

        const totalTTC = getInvoiceTotalTTC(currentInvoice)
        if (!Number.isFinite(totalTTC) || totalTTC <= 0) {
          throw new Error('Le total TTC de cette facture est invalide.')
        }

        const previousPaid = getCurrentPaid(currentInvoice, totalTTC)
        const currentBalance = Math.max(0, roundAmount(totalTTC - previousPaid))
        if (currentBalance <= 0) {
          throw new Error('Cette facture est déjà intégralement réglée.')
        }
        if (paymentAmount > currentBalance + 0.000001) {
          throw new Error(
            `Le reste à payer a changé. Le montant maximal est ${formatCurrency(currentBalance)}.`,
          )
        }

        const newAmountPaid = roundAmount(previousPaid + paymentAmount)
        const newStatus =
          newAmountPaid >= totalTTC - 0.000001 ? 'Payée' : 'Paiement Partiel'
        const paymentHistory = Array.isArray(currentInvoice.paymentHistory)
          ? currentInvoice.paymentHistory
          : []
        const paymentRecord = {
          datePaiement: Timestamp.fromDate(paymentDate),
          amount: paymentAmount,
          montant: paymentAmount,
          paymentMethod: formData.paymentMethod,
          reference: formData.reference.trim(),
          notes: formData.notes.trim(),
          recordedAt: Timestamp.now(),
          recordedBy: currentUser?.uid || null,
        }

        transaction.update(invoiceRef, {
          montantPaye: newAmountPaid,
          amountPaid: newAmountPaid,
          status: newStatus,
          workflowStatus: currentInvoice.workflowStatus || 'Validée',
          paymentHistory: [...paymentHistory, paymentRecord],
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null,
        })

        return {
          amountPaid: newAmountPaid,
          remainingBalance: Math.max(0, roundAmount(totalTTC - newAmountPaid)),
          status: newStatus,
        }
      })

      onSaved?.(paymentResult)
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Le paiement n’a pas pu être enregistré. Veuillez réessayer.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape' && !isSaving) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onKeyDown={handleDialogKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <section
        aria-labelledby="payment-modal-title"
        aria-modal="true"
        className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Banknote aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Suivi de trésorerie
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900" id="payment-modal-title">
                Ajouter un paiement
              </h2>
            </div>
          </div>
          <button
            aria-label="Fermer le formulaire de paiement"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
          <div className="overflow-y-auto px-5 py-6 sm:px-7">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                    Facture
                  </p>
                  <p className="mt-1 truncate font-mono text-sm font-bold text-slate-900">
                    {invoice.numero || invoice.invoiceNumber || `FAC-${invoice.id.slice(0, 7).toUpperCase()}`}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-600">{clientName}</p>
                </div>
                <Receipt aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-700" />
              </div>
              <div className="mt-4 border-t border-blue-200 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reste à payer
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-blue-900 sm:text-3xl">
                  {formatCurrency(outstandingBalance)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="payment-date"
                >
                  Date du paiement
                </label>
                <div className="relative">
                  <CalendarDays
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    aria-describedby={errors.paymentDate ? 'payment-date-error' : undefined}
                    aria-invalid={Boolean(errors.paymentDate)}
                    className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                      errors.paymentDate
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                    }`}
                    disabled={isSaving}
                    id="payment-date"
                    name="paymentDate"
                    onChange={handleChange}
                    type="date"
                    value={formData.paymentDate}
                  />
                </div>
                <FieldError id="payment-date-error" message={errors.paymentDate} />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="payment-amount"
                >
                  Montant reçu (MAD)
                </label>
                <input
                  aria-describedby={errors.amount ? 'payment-amount-error' : undefined}
                  aria-invalid={Boolean(errors.amount)}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.amount
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                  }`}
                  disabled={isSaving}
                  id="payment-amount"
                  max={outstandingBalance}
                  min="0.01"
                  name="amount"
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={formData.amount}
                />
                <FieldError id="payment-amount-error" message={errors.amount} />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="payment-method"
                >
                  Mode de règlement
                </label>
                <select
                  aria-describedby={errors.paymentMethod ? 'payment-method-error' : undefined}
                  aria-invalid={Boolean(errors.paymentMethod)}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.paymentMethod
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                  }`}
                  disabled={isSaving}
                  id="payment-method"
                  name="paymentMethod"
                  onChange={handleChange}
                  value={formData.paymentMethod}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <FieldError id="payment-method-error" message={errors.paymentMethod} />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="payment-reference"
                >
                  Référence de la transaction
                </label>
                <input
                  aria-describedby={errors.reference ? 'payment-reference-error' : undefined}
                  aria-invalid={Boolean(errors.reference)}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.reference
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                  }`}
                  disabled={isSaving}
                  id="payment-reference"
                  name="reference"
                  onChange={handleChange}
                  placeholder="N° de chèque, référence de virement..."
                  value={formData.reference}
                />
                <FieldError id="payment-reference-error" message={errors.reference} />
              </div>

              <div className="sm:col-span-2">
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="payment-notes"
                >
                  Notes (optionnel)
                </label>
                <textarea
                  aria-describedby={errors.notes ? 'payment-notes-error' : undefined}
                  aria-invalid={Boolean(errors.notes)}
                  className={`min-h-24 w-full resize-y rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.notes
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                  }`}
                  disabled={isSaving}
                  id="payment-notes"
                  name="notes"
                  onChange={handleChange}
                  placeholder="Informations complémentaires sur le règlement..."
                  rows={3}
                  value={formData.notes}
                />
                <FieldError id="payment-notes-error" message={errors.notes} />
              </div>
            </div>

            {formError && (
              <div
                className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
                role="alert"
              >
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Annuler
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving || outstandingBalance <= 0}
              type="submit"
            >
              {isSaving ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Banknote aria-hidden="true" className="h-4 w-4" />
              )}
              {isSaving ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
