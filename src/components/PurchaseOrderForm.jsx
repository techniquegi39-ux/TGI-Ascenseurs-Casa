import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  LoaderCircle,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/useAuth.js'

const PURCHASE_ORDER_STATUSES = [
  'Brouillon',
  'Envoyé au fournisseur',
  'Réceptionné',
  'Annulé',
]
const VAT_RATES = [0, 14, 20]

function createLineId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createEmptyLine() {
  return {
    id: createLineId(),
    designation: '',
    quantity: '1',
    unitPrice: '',
    taxRate: '20',
  }
}

function formatInputDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(dateString, days) {
  const date = dateString ? new Date(`${dateString}T12:00:00`) : new Date()
  date.setDate(date.getDate() + days)
  return formatInputDate(date)
}

function getInputDate(value, fallback = '') {
  if (!value) {
    return fallback
  }
  if (typeof value?.toDate === 'function') {
    return formatInputDate(value.toDate())
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatInputDate(value)
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }
  return fallback
}

function getInitialFormData(order) {
  const today = formatInputDate(new Date())
  const dateCommande = getInputDate(
    order?.dateCommande || order?.orderDate || order?.date,
    today,
  )
  const dateLivraisonPrevue = getInputDate(
    order?.dateLivraisonPrevue || order?.expectedDeliveryDate,
    addDays(dateCommande, 7),
  )
  const sourceItems = Array.isArray(order?.items) ? order.items : []

  return {
    fournisseur: String(order?.fournisseur || order?.supplierName || order?.supplier || ''),
    dateCommande,
    dateLivraisonPrevue,
    status: String(order?.status || order?.statut || PURCHASE_ORDER_STATUSES[0]),
    items: sourceItems.length
      ? sourceItems.map((item) => ({
          id: createLineId(),
          designation: String(item.designation || item.description || ''),
          quantity: String(item.quantity ?? item.quantite ?? 1),
          unitPrice: String(
            item.unitPrice ?? item.prixUnitaireAchatHT ?? item.prixUnitaire ?? item.puHT ?? '',
          ),
          taxRate: String(item.taxRate ?? item.tauxTVA ?? item.tva ?? 20).replace('%', ''),
        }))
      : [createEmptyLine()],
    instructionsLivraison: String(
      order?.instructionsLivraison || order?.deliveryInstructions || '',
    ),
  }
}

function roundAmount(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function getLineTotals(line) {
  const quantity = Number(line.quantity)
  const unitPrice = Number(line.unitPrice)
  const taxRate = Number(line.taxRate)
  const totalHT =
    Number.isFinite(quantity) && Number.isFinite(unitPrice)
      ? roundAmount(quantity * unitPrice)
      : 0
  const totalTVA =
    Number.isFinite(taxRate) && taxRate >= 0
      ? roundAmount(totalHT * (taxRate / 100))
      : 0

  return { totalHT, totalTVA, totalTTC: roundAmount(totalHT + totalTVA) }
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MAD`
}

function getPurchaseOrderValidationErrors(formData) {
  const nextErrors = {}
  const supplier = formData.fournisseur.trim()

  if (!supplier) {
    nextErrors.fournisseur = 'Le nom du fournisseur est obligatoire.'
  } else if (supplier.length > 180) {
    nextErrors.fournisseur = 'Le nom du fournisseur ne doit pas dépasser 180 caractères.'
  }
  if (formData.dateCommande === '') {
    nextErrors.dateCommande = 'La date de commande est obligatoire.'
  }
  if (!formData.dateLivraisonPrevue) {
    nextErrors.dateLivraisonPrevue = 'La date de livraison espérée est obligatoire.'
  } else if (
    formData.dateCommande &&
    formData.dateLivraisonPrevue < formData.dateCommande
  ) {
    nextErrors.dateLivraisonPrevue =
      'La livraison espérée ne peut pas précéder la date de commande.'
  }
  if (!PURCHASE_ORDER_STATUSES.includes(formData.status)) {
    nextErrors.status = 'Sélectionnez un statut valide.'
  }

  const lineErrors = formData.items.map((item, index) => {
    const lineError = {}
    const quantity = Number(item.quantity)
    const unitPrice = Number(item.unitPrice)
    const taxRate = Number(item.taxRate)

    if (!item.designation.trim()) {
      lineError.designation = `La désignation de la ligne ${index + 1} est obligatoire.`
    } else if (item.designation.trim().length > 180) {
      lineError.designation = 'La désignation ne doit pas dépasser 180 caractères.'
    }
    if (
      item.quantity.trim() === '' ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > 1000000
    ) {
      lineError.quantity = 'La quantité doit être supérieure à zéro.'
    }
    if (
      item.unitPrice.trim() === '' ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      Math.abs(unitPrice - roundAmount(unitPrice)) > 0.000001
    ) {
      lineError.unitPrice = 'Saisissez un prix unitaire HT valide (2 décimales maximum).'
    }
    if (!VAT_RATES.includes(taxRate)) {
      lineError.taxRate = 'Sélectionnez un taux de TVA valide.'
    }
    return lineError
  })

  if (formData.items.length === 0) {
    nextErrors.items = [{ designation: 'Ajoutez au moins une ligne de commande.' }]
  } else if (lineErrors.some((lineError) => Object.keys(lineError).length > 0)) {
    nextErrors.items = lineErrors
  }
  if (formData.instructionsLivraison.trim().length > 3000) {
    nextErrors.instructionsLivraison =
      'Les instructions ne doivent pas dépasser 3 000 caractères.'
  }

  return nextErrors
}

function TextField({
  id,
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  required = false,
  disabled = false,
  min,
  max,
  autoComplete,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </label>
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
        }`}
        disabled={disabled}
        id={id}
        max={max}
        min={min}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-700" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

function PurchaseOrderTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'general', label: 'Infos générales', icon: FileText },
    { id: 'items', label: 'Lignes de commande', icon: ShoppingCart },
    { id: 'instructions', label: 'Totaux & instructions', icon: Truck },
  ]

  return (
    <div
      aria-label="Sections du bon de commande"
      className="grid grid-cols-3 gap-1 border-b border-slate-200 px-4 sm:px-7"
      role="tablist"
    >
      {tabs.map(({ id, label, icon: Icon }, index) => {
        const isActive = activeTab === id
        return (
          <button
            aria-controls={`purchase-order-panel-${id}`}
            aria-label={`Étape ${index + 1} : ${label}`}
            aria-selected={isActive}
            className={`relative flex min-h-14 items-center justify-center gap-2 px-2 py-3 text-center text-xs font-semibold transition sm:min-h-16 sm:text-sm ${
              isActive ? 'text-blue-800' : 'text-slate-500 hover:text-slate-800'
            }`}
            id={`purchase-order-tab-${id}`}
            key={id}
            onClick={() => onChange(id)}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{index + 1}</span>
            {isActive && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-700" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function PurchaseOrderForm({ purchaseOrder = null, onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState(() => getInitialFormData(purchaseOrder))
  const [activeTab, setActiveTab] = useState('general')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const errors = useMemo(() => getPurchaseOrderValidationErrors(formData), [formData])
  const lineTotals = useMemo(
    () => formData.items.map((item) => getLineTotals(item)),
    [formData.items],
  )
  const totals = useMemo(
    () =>
      lineTotals.reduce(
        (sum, line) => ({
          totalHT: roundAmount(sum.totalHT + line.totalHT),
          totalTVA: roundAmount(sum.totalTVA + line.totalTVA),
          totalTTC: roundAmount(sum.totalTTC + line.totalTTC),
        }),
        { totalHT: 0, totalTVA: 0, totalTTC: 0 },
      ),
    [lineTotals],
  )

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'dateCommande' && !purchaseOrder
        ? { dateLivraisonPrevue: addDays(value, 7) }
        : {}),
    }))
    setFormError('')
  }

  function handleLineChange(lineId, field, value) {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.map((item) =>
        item.id === lineId ? { ...item, [field]: value } : item,
      ),
    }))
    setFormError('')
  }

  function addLine() {
    setFormData((previous) => ({ ...previous, items: [...previous.items, createEmptyLine()] }))
    setActiveTab('items')
  }

  function removeLine(lineId) {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.filter((item) => item.id !== lineId),
    }))
  }

  function validate() {
    if (errors.fournisseur || errors.dateCommande || errors.dateLivraisonPrevue || errors.status) {
      setActiveTab('general')
    } else if (errors.items) {
      setActiveTab('items')
    } else if (errors.instructionsLivraison) {
      setActiveTab('instructions')
    }
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    if (!validate()) {
      return
    }

    const savedItems = formData.items.map((item) => {
      const lineTotal = getLineTotals(item)
      return {
        designation: item.designation.trim(),
        quantity: Number(item.quantity),
        unitPrice: roundAmount(Number(item.unitPrice)),
        taxRate: Number(item.taxRate),
        totalHT: lineTotal.totalHT,
        totalTVA: lineTotal.totalTVA,
        totalTTC: lineTotal.totalTTC,
      }
    })
    const payload = {
      fournisseur: formData.fournisseur.trim(),
      dateCommande: formData.dateCommande,
      dateLivraisonPrevue: formData.dateLivraisonPrevue,
      status: formData.status,
      items: savedItems,
      totalHT: totals.totalHT,
      totalTVA: totals.totalTVA,
      totalTTC: totals.totalTTC,
      instructionsLivraison: formData.instructionsLivraison.trim(),
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || null,
    }

    setIsSaving(true)
    let savedAction
    try {
      if (purchaseOrder?.id) {
        const orderNumber =
          purchaseOrder.numero ||
          purchaseOrder.orderNumber ||
          `BC-${new Date(`${formData.dateCommande}T12:00:00`).getFullYear()}-${purchaseOrder.id
            .slice(0, 6)
            .toUpperCase()}`
        await updateDoc(doc(db, 'purchase_orders', purchaseOrder.id), {
          ...payload,
          numero: orderNumber,
        })
        savedAction = 'updated'
      } else {
        const orderDocument = doc(collection(db, 'purchase_orders'))
        const orderNumber = `BC-${new Date(`${formData.dateCommande}T12:00:00`)
          .getFullYear()}-${orderDocument.id.slice(0, 6).toUpperCase()}`
        await setDoc(orderDocument, {
          ...payload,
          numero: orderNumber,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || null,
        })
        savedAction = 'created'
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? `Enregistrement impossible : ${error.message}`
          : 'Enregistrement impossible. Veuillez réessayer.',
      )
    } finally {
      setIsSaving(false)
    }

    if (savedAction) {
      onSaved?.(savedAction)
    }
  }

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape' && !isSaving) {
      onClose()
    }
  }

  const firstItemError = Array.isArray(errors.items)
    ? errors.items.find((lineError) => Object.keys(lineError).length > 0)
    : null
  const generatedNumber = purchaseOrder?.numero || purchaseOrder?.orderNumber

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onKeyDown={handleDialogKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <section
        aria-labelledby="purchase-order-form-title"
        aria-modal="true"
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <ShoppingCart aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Approvisionnement
              </p>
              <h2
                className="mt-1 text-lg font-semibold text-slate-900"
                id="purchase-order-form-title"
              >
                {purchaseOrder ? 'Modifier le bon de commande' : 'Nouveau bon de commande'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {generatedNumber || 'Le numéro BC sera généré à l’enregistrement.'}
              </p>
            </div>
          </div>
          <button
            aria-label="Fermer le formulaire"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <PurchaseOrderTabs activeTab={activeTab} onChange={setActiveTab} />

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            <section
              aria-labelledby="purchase-order-tab-general"
              className={activeTab === 'general' ? 'space-y-5' : 'hidden'}
              id="purchase-order-panel-general"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    autoComplete="organization"
                    error={errors.fournisseur}
                    id="purchase-order-supplier"
                    label="Nom du fournisseur"
                    name="fournisseur"
                    onChange={handleChange}
                    placeholder="Nom de l’entreprise fournisseur"
                    required
                    value={formData.fournisseur}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="purchase-order-number"
                  >
                    N° de BC
                  </label>
                  <input
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-mono text-slate-600"
                    id="purchase-order-number"
                    readOnly
                    value={generatedNumber || 'Généré à l’enregistrement'}
                  />
                </div>
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="purchase-order-status"
                  >
                    Statut
                  </label>
                  <select
                    aria-describedby={errors.status ? 'purchase-order-status-error' : undefined}
                    aria-invalid={Boolean(errors.status)}
                    className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                      errors.status
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                    }`}
                    disabled={isSaving}
                    id="purchase-order-status"
                    name="status"
                    onChange={handleChange}
                    value={formData.status}
                  >
                    {PURCHASE_ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="mt-1.5 text-xs text-red-700" id="purchase-order-status-error">
                      {errors.status}
                    </p>
                  )}
                </div>
                <TextField
                  error={errors.dateCommande}
                  id="purchase-order-date"
                  label="Date de commande"
                  name="dateCommande"
                  onChange={handleChange}
                  required
                  type="date"
                  value={formData.dateCommande}
                  disabled={isSaving}
                />
                <TextField
                  error={errors.dateLivraisonPrevue}
                  id="purchase-order-delivery-date"
                  label="Date de livraison espérée"
                  name="dateLivraisonPrevue"
                  min={formData.dateCommande}
                  onChange={handleChange}
                  required
                  type="date"
                  value={formData.dateLivraisonPrevue}
                  disabled={isSaving}
                />
              </div>
            </section>

            <section
              aria-labelledby="purchase-order-tab-items"
              className={activeTab === 'items' ? 'space-y-4' : 'hidden'}
              id="purchase-order-panel-items"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">Articles à commander</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Les montants HT et TVA sont calculés automatiquement.
                  </p>
                </div>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                  onClick={addLine}
                  type="button"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Ajouter une ligne
                </button>
              </div>

              {firstItemError && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{firstItemError.designation || firstItemError.quantity || firstItemError.unitPrice || firstItemError.taxRate}</span>
                </div>
              )}

              <div className="space-y-3">
                {formData.items.map((item, index) => {
                  const lineTotal = lineTotals[index]
                  const lineError = Array.isArray(errors.items) ? errors.items[index] || {} : {}
                  return (
                    <article
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                      key={item.id}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Ligne {index + 1}
                        </p>
                        <button
                          aria-label={`Supprimer la ligne ${index + 1}`}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isSaving}
                          onClick={() => removeLine(item.id)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(190px,2fr)_minmax(90px,0.8fr)_minmax(140px,1.2fr)_minmax(105px,0.8fr)]">
                        <div>
                          <label
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                            htmlFor={`purchase-order-item-designation-${item.id}`}
                          >
                            Désignation
                          </label>
                          <input
                            aria-describedby={
                              lineError.designation
                                ? `purchase-order-item-designation-error-${item.id}`
                                : undefined
                            }
                            aria-invalid={Boolean(lineError.designation)}
                            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-4 ${
                              lineError.designation
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                            }`}
                            disabled={isSaving}
                            id={`purchase-order-item-designation-${item.id}`}
                            onChange={(event) =>
                              handleLineChange(item.id, 'designation', event.target.value)
                            }
                            placeholder="Ex. Carte mère ascenseur"
                            value={item.designation}
                          />
                          {lineError.designation && (
                            <p
                              className="mt-1 text-xs text-red-700"
                              id={`purchase-order-item-designation-error-${item.id}`}
                            >
                              {lineError.designation}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                            htmlFor={`purchase-order-item-quantity-${item.id}`}
                          >
                            Quantité
                          </label>
                          <input
                            aria-describedby={
                              lineError.quantity
                                ? `purchase-order-item-quantity-error-${item.id}`
                                : undefined
                            }
                            aria-invalid={Boolean(lineError.quantity)}
                            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-4 ${
                              lineError.quantity
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                            }`}
                            disabled={isSaving}
                            id={`purchase-order-item-quantity-${item.id}`}
                            min="0.001"
                            onChange={(event) =>
                              handleLineChange(item.id, 'quantity', event.target.value)
                            }
                            step="0.001"
                            type="number"
                            value={item.quantity}
                          />
                          {lineError.quantity && (
                            <p
                              className="mt-1 text-xs text-red-700"
                              id={`purchase-order-item-quantity-error-${item.id}`}
                            >
                              {lineError.quantity}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                            htmlFor={`purchase-order-item-unit-price-${item.id}`}
                          >
                            PU achat HT (MAD)
                          </label>
                          <input
                            aria-describedby={
                              lineError.unitPrice
                                ? `purchase-order-item-unit-price-error-${item.id}`
                                : undefined
                            }
                            aria-invalid={Boolean(lineError.unitPrice)}
                            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-4 ${
                              lineError.unitPrice
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                            }`}
                            disabled={isSaving}
                            id={`purchase-order-item-unit-price-${item.id}`}
                            min="0"
                            onChange={(event) =>
                              handleLineChange(item.id, 'unitPrice', event.target.value)
                            }
                            placeholder="0.00"
                            step="0.01"
                            type="number"
                            value={item.unitPrice}
                          />
                          {lineError.unitPrice && (
                            <p
                              className="mt-1 text-xs text-red-700"
                              id={`purchase-order-item-unit-price-error-${item.id}`}
                            >
                              {lineError.unitPrice}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                            htmlFor={`purchase-order-item-tax-${item.id}`}
                          >
                            Taux TVA
                          </label>
                          <select
                            aria-describedby={
                              lineError.taxRate
                                ? `purchase-order-item-tax-error-${item.id}`
                                : undefined
                            }
                            aria-invalid={Boolean(lineError.taxRate)}
                            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-4 ${
                              lineError.taxRate
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                            }`}
                            disabled={isSaving}
                            id={`purchase-order-item-tax-${item.id}`}
                            onChange={(event) =>
                              handleLineChange(item.id, 'taxRate', event.target.value)
                            }
                            value={item.taxRate}
                          >
                            {VAT_RATES.map((rate) => (
                              <option key={rate} value={rate}>
                                {rate} %
                              </option>
                            ))}
                          </select>
                          {lineError.taxRate && (
                            <p
                              className="mt-1 text-xs text-red-700"
                              id={`purchase-order-item-tax-error-${item.id}`}
                            >
                              {lineError.taxRate}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs">
                        <span className="text-slate-500">
                          Total HT :{' '}
                          <strong className="font-semibold text-slate-800">
                            {formatCurrency(lineTotal.totalHT)}
                          </strong>
                        </span>
                        <span className="text-slate-500">
                          Total TTC :{' '}
                          <strong className="font-semibold text-blue-800">
                            {formatCurrency(lineTotal.totalTTC)}
                          </strong>
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <section
              aria-labelledby="purchase-order-tab-instructions"
              className={activeTab === 'instructions' ? 'space-y-5' : 'hidden'}
              id="purchase-order-panel-instructions"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
                <h3 className="font-semibold text-slate-900">Récapitulatif financier</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4 text-slate-600">
                    <span>Total HT</span>
                    <span className="font-medium tabular-nums text-slate-900">
                      {formatCurrency(totals.totalHT)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-slate-600">
                    <span>Total TVA</span>
                    <span className="font-medium tabular-nums text-slate-900">
                      {formatCurrency(totals.totalTVA)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-blue-200 pt-3 text-base font-semibold text-slate-900">
                    <span>Total TTC</span>
                    <span className="tabular-nums text-blue-900">
                      {formatCurrency(totals.totalTTC)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="purchase-order-instructions"
                >
                  Instructions de livraison
                </label>
                <textarea
                  aria-describedby={
                    errors.instructionsLivraison
                      ? 'purchase-order-instructions-error'
                      : undefined
                  }
                  aria-invalid={Boolean(errors.instructionsLivraison)}
                  className={`min-h-32 w-full resize-y rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                    errors.instructionsLivraison
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                  }`}
                  disabled={isSaving}
                  id="purchase-order-instructions"
                  name="instructionsLivraison"
                  onChange={handleChange}
                  placeholder="Ex. Livrer au dépôt principal avant 10h..."
                  rows={4}
                  value={formData.instructionsLivraison}
                />
                {errors.instructionsLivraison && (
                  <p
                    className="mt-1.5 text-xs text-red-700"
                    id="purchase-order-instructions-error"
                  >
                    {errors.instructionsLivraison}
                  </p>
                )}
              </div>
            </section>

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

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving || activeTab === 'general'}
              onClick={() =>
                setActiveTab(activeTab === 'instructions' ? 'items' : 'general')
              }
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              Précédent
            </button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              {activeTab !== 'instructions' ? (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                  onClick={() =>
                    setActiveTab(activeTab === 'general' ? 'items' : 'instructions')
                  }
                  type="button"
                >
                  Suivant
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving || Object.keys(errors).length > 0}
                  type="submit"
                >
                  {isSaving ? (
                    <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart aria-hidden="true" className="h-4 w-4" />
                  )}
                  {isSaving ? 'Enregistrement...' : 'Enregistrer le bon'}
                </button>
              )}
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
