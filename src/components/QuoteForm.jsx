import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileText,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/useAuth.js'

const QUOTE_STATUSES = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé']
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
  const date = dateString
    ? new Date(`${dateString}T12:00:00`)
    : new Date()
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

function getInitialFormData(quote) {
  const today = formatInputDate(new Date())
  const dateEmission = getInputDate(quote?.dateEmission || quote?.date, today)
  const dateValidite = getInputDate(quote?.dateValidite || quote?.validUntil, addDays(dateEmission, 30))
  const sourceItems = Array.isArray(quote?.items) ? quote.items : []

  return {
    clientId: String(quote?.clientId || ''),
    clientName: String(quote?.clientName || ''),
    numero: String(quote?.numero || quote?.quoteNumber || ''),
    dateEmission,
    dateValidite,
    status: String(quote?.status || quote?.statut || 'Brouillon'),
    items: sourceItems.length
      ? sourceItems.map((item) => ({
          id: createLineId(),
          designation: String(item.designation || item.description || ''),
          quantity: String(item.quantity ?? item.quantite ?? 1),
          unitPrice: String(item.unitPrice ?? item.prixUnitaire ?? item.puHT ?? ''),
          taxRate: String(item.taxRate ?? item.tauxTVA ?? item.tva ?? 20).replace('%', ''),
        }))
      : [createEmptyLine()],
    conditionsPaiement: String(quote?.conditionsPaiement || quote?.paymentTerms || ''),
    notes: String(quote?.notes || ''),
  }
}

function roundAmount(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function getLineTotals(line) {
  const quantity = Number(line.quantity)
  const unitPrice = Number(line.unitPrice)
  const taxRate = Number(line.taxRate)
  const rawTotalHT = quantity * unitPrice
  const totalHT =
    Number.isFinite(quantity) && Number.isFinite(unitPrice) && Number.isFinite(rawTotalHT)
      ? roundAmount(rawTotalHT)
      : 0
  const totalTVA =
    Number.isFinite(taxRate) && taxRate >= 0
      ? roundAmount(totalHT * (taxRate / 100))
      : 0

  return {
    totalHT,
    totalTVA,
    totalTTC: roundAmount(totalHT + totalTVA),
  }
}

function isValidQuoteLine(line) {
  const quantity = Number(line.quantity)
  const unitPrice = Number(line.unitPrice)
  const taxRate = Number(line.taxRate)
  const designation = line.designation.trim()
  const lineTotalHT = quantity * unitPrice

  return (
    designation.length > 0 &&
    designation.length <= 180 &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    line.unitPrice.trim() !== '' &&
    Number.isFinite(unitPrice) &&
    unitPrice >= 0 &&
    Number.isFinite(lineTotalHT) &&
    VAT_RATES.includes(taxRate)
  )
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MAD`
}

function getClientName(client) {
  return String(client.nom || client.raisonSociale || client.name || 'Client sans nom')
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
        className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
        }`}
        disabled={disabled}
        id={id}
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

function QuoteTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'general', label: 'Infos générales', icon: FileText },
    { id: 'items', label: 'Tarification', icon: Calculator },
    { id: 'conditions', label: 'Totaux & conditions', icon: UserRound },
  ]

  return (
    <div
      aria-label="Sections du devis"
      className="grid grid-cols-3 gap-1 border-b border-slate-200 px-4 sm:px-7"
      role="tablist"
    >
      {tabs.map(({ id, label, icon: Icon }, index) => {
        const isActive = activeTab === id
        return (
          <button
            aria-label={`Étape ${index + 1} : ${label}`}
            aria-controls={`quote-panel-${id}`}
            aria-selected={isActive}
            className={`relative flex min-h-14 items-center justify-center gap-2 px-2 py-3 text-center text-xs font-semibold transition sm:min-h-16 sm:text-sm ${
              isActive ? 'text-blue-800' : 'text-slate-500 hover:text-slate-800'
            }`}
            id={`quote-tab-${id}`}
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

export default function QuoteForm({ quote = null, onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState(() => getInitialFormData(quote))
  const [clients, setClients] = useState([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [clientLoadError, setClientLoadError] = useState('')
  const [clientReloadKey, setClientReloadKey] = useState(0)
  const [activeTab, setActiveTab] = useState('general')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadClients() {
      setIsLoadingClients(true)
      setClientLoadError('')
      try {
        const snapshot = await getDocs(collection(db, 'clients'))
        if (isMounted) {
          setClients(
            snapshot.docs
              .map((clientDocument) => ({
                ...clientDocument.data(),
                id: clientDocument.id,
              }))
              .sort((first, second) =>
                getClientName(first).localeCompare(getClientName(second), 'fr', {
                  sensitivity: 'base',
                }),
              ),
          )
        }
      } catch (error) {
        if (isMounted) {
          setClientLoadError(
            error instanceof Error ? error.message : 'Impossible de charger les clients.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingClients(false)
        }
      }
    }

    void loadClients()
    return () => {
      isMounted = false
    }
  }, [clientReloadKey])

  const lineTotals = useMemo(
    () =>
      formData.items.map((item) => ({
        ...getLineTotals(item),
      })),
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
  const hasValidItem = formData.items.some(isValidQuoteLine)
  const hasValidDateRange =
    Boolean(formData.dateEmission) &&
    Boolean(formData.dateValidite) &&
    formData.dateValidite >= formData.dateEmission

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'clientId'
        ? {
            clientName: value
              ? getClientName(clients.find((client) => client.id === value) || {})
              : '',
          }
        : {}),
      ...(name === 'dateEmission' && !quote
        ? { dateValidite: addDays(value, 30) }
        : {}),
    }))
    setErrors((previous) => {
      const nextErrors = { ...previous }
      delete nextErrors[name]

      if (name === 'dateEmission' || name === 'dateValidite') {
        const nextDateEmission = name === 'dateEmission' ? value : formData.dateEmission
        const nextDateValidite =
          name === 'dateValidite'
            ? value
            : name === 'dateEmission' && !quote
              ? addDays(value, 30)
              : formData.dateValidite

        if (!nextDateEmission) {
          nextErrors.dateEmission = 'La date d’émission est obligatoire.'
        } else {
          delete nextErrors.dateEmission
        }

        if (!nextDateValidite) {
          nextErrors.dateValidite = 'La date de validité est obligatoire.'
        } else if (nextDateEmission && nextDateValidite < nextDateEmission) {
          nextErrors.dateValidite =
            'La date de validité doit être supérieure ou égale à la date d’émission.'
        } else {
          delete nextErrors.dateValidite
        }
      }

      return nextErrors
    })
    setFormError('')
  }

  function handleLineChange(lineId, field, value) {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.map((item) =>
        item.id === lineId ? { ...item, [field]: value } : item,
      ),
    }))
    setErrors((previous) => {
      if (!previous.items) {
        return previous
      }
      return { ...previous, items: null }
    })
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
    setErrors((previous) => ({ ...previous, items: null }))
  }

  function validate() {
    const nextErrors = {}
    if (!clients.some((client) => client.id === formData.clientId)) {
      nextErrors.clientId = 'Sélectionnez un client valide.'
    }
    if (
      formData.numero.trim() &&
      !/^[\p{L}\d][\p{L}\d._/-]{2,49}$/u.test(formData.numero.trim())
    ) {
      nextErrors.numero = 'Utilisez 3 à 50 caractères (lettres, chiffres, point, tiret ou slash).'
    }
    if (!QUOTE_STATUSES.includes(formData.status)) {
      nextErrors.status = 'Sélectionnez un statut valide.'
    }
    if (!formData.dateEmission) {
      nextErrors.dateEmission = 'La date d’émission est obligatoire.'
    }
    if (!formData.dateValidite) {
      nextErrors.dateValidite = 'La date de validité est obligatoire.'
    } else if (formData.dateEmission && formData.dateValidite < formData.dateEmission) {
      nextErrors.dateValidite =
        'La date de validité doit être supérieure ou égale à la date d’émission.'
    }

    const itemErrors = formData.items.map((item, index) => {
      const lineError = {}
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unitPrice)
      const taxRate = Number(item.taxRate)

      if (!item.designation.trim()) {
        lineError.designation = `La désignation de la ligne ${index + 1} est obligatoire.`
      } else if (item.designation.trim().length > 180) {
        lineError.designation = 'La désignation ne doit pas dépasser 180 caractères.'
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        lineError.quantity = 'La quantité doit être supérieure à zéro.'
      }
      if (item.unitPrice.trim() === '' || !Number.isFinite(unitPrice) || unitPrice < 0) {
        lineError.unitPrice = 'Saisissez un prix unitaire HT positif ou nul.'
      }
      if (Number.isFinite(quantity) && Number.isFinite(unitPrice) && !Number.isFinite(quantity * unitPrice)) {
        lineError.unitPrice = 'Le total de la ligne est trop élevé.'
      }
      if (!VAT_RATES.includes(taxRate)) {
        lineError.taxRate = 'Sélectionnez un taux de TVA valide.'
      }
      return lineError
    })

    if (formData.items.length === 0) {
      nextErrors.items = [{ designation: 'Ajoutez au moins une ligne au devis.' }]
    } else if (itemErrors.some((lineError) => Object.keys(lineError).length > 0)) {
      nextErrors.items = itemErrors
    }
    if (formData.conditionsPaiement.trim().length > 3000) {
      nextErrors.conditionsPaiement = 'Les conditions ne doivent pas dépasser 3 000 caractères.'
    }
    if (formData.notes.trim().length > 5000) {
      nextErrors.notes = 'Les notes ne doivent pas dépasser 5 000 caractères.'
    }

    setErrors(nextErrors)
    if (
      nextErrors.clientId ||
      nextErrors.numero ||
      nextErrors.dateEmission ||
      nextErrors.dateValidite ||
      nextErrors.status
    ) {
      setActiveTab('general')
    } else if (nextErrors.items) {
      setActiveTab('items')
    } else if (nextErrors.conditionsPaiement || nextErrors.notes) {
      setActiveTab('conditions')
    }
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    if (isLoadingClients) {
      setFormError('Attendez la fin du chargement des clients avant d’enregistrer.')
      return
    }
    if (clientLoadError) {
      setFormError('Rechargez la liste des clients avant d’enregistrer le devis.')
      return
    }
    if (!validate()) {
      return
    }

    const selectedClient = clients.find((client) => client.id === formData.clientId)
    if (!selectedClient) {
      setFormError('Le client sélectionné est introuvable. Rechargez la liste puis réessayez.')
      setActiveTab('general')
      return
    }

    const savedItems = formData.items.map((item) => {
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unitPrice)
      const taxRate = Number(item.taxRate)
      const calculated = getLineTotals(item)
      return {
        designation: item.designation.trim(),
        quantity,
        unitPrice,
        taxRate,
        totalHT: calculated.totalHT,
        totalTVA: calculated.totalTVA,
        totalTTC: calculated.totalTTC,
      }
    })
    const payload = {
      clientId: selectedClient.id,
      clientName: getClientName(selectedClient),
      numero:
        formData.numero.trim().toLocaleUpperCase('fr-FR') ||
        quote?.numero ||
        quote?.quoteNumber ||
        '',
      dateEmission: formData.dateEmission,
      dateValidite: formData.dateValidite,
      status: formData.status,
      items: savedItems,
      totalHT: totals.totalHT,
      totalTVA: totals.totalTVA,
      totalTTC: totals.totalTTC,
      conditionsPaiement: formData.conditionsPaiement.trim(),
      notes: formData.notes.trim(),
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || null,
    }

    setIsSaving(true)
    let savedAction
    try {
      if (quote?.id) {
        await updateDoc(doc(db, 'quotes', quote.id), payload)
        savedAction = 'updated'
      } else {
        const quoteDocument = doc(collection(db, 'quotes'))
        const quoteNumber =
          payload.numero ||
          `DEV-${new Date(`${formData.dateEmission}T12:00:00`).getFullYear()}-${quoteDocument.id
            .slice(0, 6)
            .toUpperCase()}`
        await setDoc(quoteDocument, {
          ...payload,
          numero: quoteNumber,
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
        aria-labelledby="quote-form-title"
        aria-modal="true"
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <FileText aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Cycle commercial
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900" id="quote-form-title">
                {quote ? 'Modifier le devis' : 'Nouveau devis'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Les champs marqués d’un astérisque sont obligatoires.
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

        <QuoteTabs activeTab={activeTab} onChange={setActiveTab} />

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            <section
              aria-labelledby="quote-tab-general"
              className={activeTab === 'general' ? 'space-y-5' : 'hidden'}
              id="quote-panel-general"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="quote-client">
                    Client
                    <span aria-hidden="true" className="ml-1 text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <UserRound
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      aria-describedby={errors.clientId ? 'quote-client-error' : undefined}
                      aria-invalid={Boolean(errors.clientId)}
                      className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                        errors.clientId
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                      }`}
                      disabled={isSaving || isLoadingClients || clients.length === 0}
                      id="quote-client"
                      name="clientId"
                      onChange={handleChange}
                      value={formData.clientId}
                    >
                      <option value="">
                        {isLoadingClients
                          ? 'Chargement des clients...'
                          : clients.length
                            ? 'Sélectionnez un client'
                            : 'Aucun client disponible'}
                      </option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {getClientName(client)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.clientId && (
                    <p className="mt-1.5 text-xs text-red-700" id="quote-client-error">
                      {errors.clientId}
                    </p>
                  )}
                  {isLoadingClients && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                      Chargement de la liste des clients
                    </p>
                  )}
                  {clientLoadError && (
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                      <span className="min-w-0 break-words">{clientLoadError}</span>
                      <button
                        className="inline-flex shrink-0 items-center gap-1 font-semibold"
                        onClick={() => setClientReloadKey((key) => key + 1)}
                        type="button"
                      >
                        <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                        Réessayer
                      </button>
                    </div>
                  )}
                </div>
                <TextField
                  error={errors.numero}
                  id="quote-number"
                  label="N° de devis (optionnel)"
                  name="numero"
                  onChange={handleChange}
                  placeholder="Généré automatiquement si laissé vide"
                  value={formData.numero}
                  disabled={isSaving}
                />
                <TextField
                  error={errors.dateEmission}
                  id="quote-issue-date"
                  label="Date d’émission"
                  name="dateEmission"
                  onChange={handleChange}
                  required
                  type="date"
                  value={formData.dateEmission}
                  disabled={isSaving}
                />
                <TextField
                  error={errors.dateValidite}
                  id="quote-validity-date"
                  label="Date de validité"
                  name="dateValidite"
                  onChange={handleChange}
                  required
                  min={formData.dateEmission || undefined}
                  type="date"
                  value={formData.dateValidite}
                  disabled={isSaving}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="quote-status">
                    Statut
                  </label>
                  <select
                    aria-describedby={errors.status ? 'quote-status-error' : undefined}
                    aria-invalid={Boolean(errors.status)}
                    className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                      errors.status
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                    }`}
                    disabled={isSaving}
                    id="quote-status"
                    name="status"
                    onChange={handleChange}
                    value={formData.status}
                  >
                    {QUOTE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="mt-1.5 text-xs text-red-700" id="quote-status-error">
                      {errors.status}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section
              aria-labelledby="quote-tab-items"
              className={activeTab === 'items' ? 'space-y-5' : 'hidden'}
              id="quote-panel-items"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Lignes de tarification</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Saisissez les prestations et articles compris dans le devis.
                  </p>
                </div>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 sm:self-auto"
                  onClick={addLine}
                  type="button"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Ajouter une ligne
                </button>
              </div>

              {firstItemError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                  {Object.values(firstItemError)[0]}
                </p>
              )}
              {!hasValidItem && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                  Ajoutez au moins une ligne avec une désignation, une quantité valide et un prix HT valide.
                </p>
              )}

              <div className="space-y-3">
                {formData.items.map((item, index) => {
                  const itemError = Array.isArray(errors.items) ? errors.items[index] || {} : {}
                  const calculated = lineTotals[index]
                  return (
                    <article
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                      key={item.id}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-slate-700">
                          Ligne {index + 1}
                        </h4>
                        <button
                          aria-label={`Supprimer la ligne ${index + 1}`}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={isSaving}
                          onClick={() => removeLine(item.id)}
                          title="Supprimer la ligne"
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-12">
                        <div className="sm:col-span-12">
                          <label
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                            htmlFor={`quote-line-${item.id}-designation`}
                          >
                            Désignation
                          </label>
                          <input
                            aria-describedby={
                              itemError.designation ? `quote-line-${item.id}-error` : undefined
                            }
                            aria-invalid={Boolean(itemError.designation)}
                            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                              itemError.designation
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                            }`}
                            disabled={isSaving}
                            id={`quote-line-${item.id}-designation`}
                            onChange={(event) =>
                              handleLineChange(item.id, 'designation', event.target.value)
                            }
                            placeholder="Ex. Moteur de traction ou Main d’œuvre"
                            value={item.designation}
                          />
                          {itemError.designation && (
                            <p
                              className="mt-1 text-xs text-red-700"
                              id={`quote-line-${item.id}-error`}
                            >
                              {itemError.designation}
                            </p>
                          )}
                        </div>
                        <div className="sm:col-span-2">
                          <label
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                            htmlFor={`quote-line-${item.id}-quantity`}
                          >
                            Quantité
                          </label>
                          <input
                            aria-invalid={Boolean(itemError.quantity)}
                            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                              itemError.quantity
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                            }`}
                            disabled={isSaving}
                            id={`quote-line-${item.id}-quantity`}
                            min="0.01"
                            onChange={(event) =>
                              handleLineChange(item.id, 'quantity', event.target.value)
                            }
                            step="0.01"
                            type="number"
                            value={item.quantity}
                          />
                          {itemError.quantity && (
                            <p className="mt-1 text-xs text-red-700">{itemError.quantity}</p>
                          )}
                        </div>
                        <div className="sm:col-span-3">
                          <label
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                            htmlFor={`quote-line-${item.id}-unit-price`}
                          >
                            Prix unitaire HT
                          </label>
                          <input
                            aria-invalid={Boolean(itemError.unitPrice)}
                            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                              itemError.unitPrice
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                            }`}
                            disabled={isSaving}
                            id={`quote-line-${item.id}-unit-price`}
                            min="0"
                            onChange={(event) =>
                              handleLineChange(item.id, 'unitPrice', event.target.value)
                            }
                            placeholder="0.00"
                            step="0.01"
                            type="number"
                            value={item.unitPrice}
                          />
                          {itemError.unitPrice && (
                            <p className="mt-1 text-xs text-red-700">{itemError.unitPrice}</p>
                          )}
                        </div>
                        <div className="sm:col-span-2">
                          <label
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                            htmlFor={`quote-line-${item.id}-tax`}
                          >
                            Taux TVA
                          </label>
                          <select
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            disabled={isSaving}
                            id={`quote-line-${item.id}-tax`}
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
                        </div>
                        <div className="sm:col-span-5">
                          <span className="mb-1.5 block text-xs font-medium text-slate-600">
                            Total HT / TTC
                          </span>
                          <div className="flex h-10 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs">
                            <span className="truncate font-semibold text-slate-700">
                              {formatCurrency(calculated.totalHT)} HT
                            </span>
                            <span className="truncate font-bold text-blue-800">
                              {formatCurrency(calculated.totalTTC)} TTC
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <section
              aria-labelledby="quote-tab-conditions"
              className={activeTab === 'conditions' ? 'space-y-5' : 'hidden'}
              id="quote-panel-conditions"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-5">
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-slate-700"
                      htmlFor="quote-payment-terms"
                    >
                      Conditions de paiement
                    </label>
                    <textarea
                      aria-describedby={
                        errors.conditionsPaiement ? 'quote-payment-terms-error' : undefined
                      }
                      aria-invalid={Boolean(errors.conditionsPaiement)}
                      className={`min-h-28 w-full resize-y rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        errors.conditionsPaiement
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                      }`}
                      disabled={isSaving}
                      id="quote-payment-terms"
                      name="conditionsPaiement"
                      onChange={handleChange}
                      placeholder="Ex. Avance de 50 % à la commande, solde à la livraison."
                      rows={4}
                      value={formData.conditionsPaiement}
                    />
                    {errors.conditionsPaiement && (
                      <p className="mt-1.5 text-xs text-red-700" id="quote-payment-terms-error">
                        {errors.conditionsPaiement}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-slate-700"
                      htmlFor="quote-notes"
                    >
                      Notes complémentaires
                    </label>
                    <textarea
                      aria-describedby={errors.notes ? 'quote-notes-error' : undefined}
                      aria-invalid={Boolean(errors.notes)}
                      className={`min-h-28 w-full resize-y rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        errors.notes
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                      }`}
                      disabled={isSaving}
                      id="quote-notes"
                      name="notes"
                      onChange={handleChange}
                      placeholder="Détails, délais ou informations utiles au client..."
                      rows={4}
                      value={formData.notes}
                    />
                    {errors.notes && (
                      <p className="mt-1.5 text-xs text-red-700" id="quote-notes-error">
                        {errors.notes}
                      </p>
                    )}
                  </div>
                </div>

                <aside className="h-fit rounded-xl border border-blue-100 bg-blue-50/70 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                    <Calculator aria-hidden="true" className="h-4 w-4" />
                    Récapitulatif du devis
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4 text-slate-600">
                      <dt>Total HT</dt>
                      <dd className="font-semibold text-slate-900">{formatCurrency(totals.totalHT)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-600">
                      <dt>Total TVA</dt>
                      <dd className="font-semibold text-slate-900">{formatCurrency(totals.totalTVA)}</dd>
                    </div>
                    <div className="border-t border-blue-200 pt-3">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="font-semibold text-slate-800">Total TTC</dt>
                        <dd className="text-lg font-bold text-blue-900">
                          {formatCurrency(totals.totalTTC)}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </aside>
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
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200/70 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={activeTab === 'general' || isSaving}
                onClick={() =>
                  setActiveTab(activeTab === 'conditions' ? 'items' : 'general')
                }
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                Précédent
              </button>
              {activeTab !== 'conditions' && (
                <button
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving}
                  onClick={() =>
                    setActiveTab(activeTab === 'general' ? 'items' : 'conditions')
                  }
                  type="button"
                >
                  Suivant
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                disabled={
                  isSaving ||
                  isLoadingClients ||
                  clients.length === 0 ||
                  !hasValidItem ||
                  !hasValidDateRange
                }
                type="submit"
              >
                {isSaving ? (
                  <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText aria-hidden="true" className="h-4 w-4" />
                )}
                {isSaving
                  ? 'Enregistrement...'
                  : quote
                    ? 'Enregistrer les modifications'
                    : 'Créer le devis'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
