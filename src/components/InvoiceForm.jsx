import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Banknote,
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

const INVOICE_WORKFLOW_STATUSES = ['Brouillon', 'Validée', 'Annulée']
const PAYMENT_TERMS = [
  'À réception',
  '30 jours fin de mois',
  '50% à la commande, 50% à la livraison',
]
const PAYMENT_METHODS = ['Virement bancaire', 'Chèque', 'Traite', 'Espèces']
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

function getWorkflowStatus(invoice) {
  const status = String(
    invoice?.workflowStatus || invoice?.status || invoice?.statut || 'Brouillon',
  ).toLocaleLowerCase('fr-FR')
  if (status.includes('annul')) {
    return 'Annulée'
  }
  if (status.includes('brouillon') || status.includes('draft')) {
    return 'Brouillon'
  }
  return 'Validée'
}

function getStoredTotalTTC(invoice) {
  const explicitTotal = Number(invoice?.totalTTC ?? invoice?.totaux?.totalTTC)
  if (Number.isFinite(explicitTotal) && explicitTotal >= 0) {
    return explicitTotal
  }

  const items = Array.isArray(invoice?.items) ? invoice.items : []
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity ?? item.quantite ?? 0)
    const unitPrice = Number(item.unitPrice ?? item.prixUnitaire ?? item.puHT ?? 0)
    const rate = Number(String(item.taxRate ?? item.tauxTVA ?? item.tva ?? 0).replace('%', ''))
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice) || !Number.isFinite(rate)) {
      return sum
    }

    const totalHT = Number(item.totalHT ?? quantity * unitPrice)
    const totalTVA = Number(item.totalTVA ?? totalHT * (rate / 100))
    return sum + totalHT + totalTVA
  }, 0)
}

function getInitialFormData(invoice) {
  const today = formatInputDate(new Date())
  const dateFacture = getInputDate(invoice?.dateFacture || invoice?.dateEmission || invoice?.date, today)
  const dateEcheance = getInputDate(
    invoice?.dateEcheance || invoice?.dueDate,
    addDays(dateFacture, 30),
  )
  const sourceItems = Array.isArray(invoice?.items) ? invoice.items : []
  const existingStatus = String(invoice?.status || invoice?.statut || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
  const storedAmountPaid =
    invoice?.montantPaye ??
    invoice?.amountPaid ??
    (existingStatus.includes('payee') && !existingStatus.includes('non pay')
      ? getStoredTotalTTC(invoice)
      : 0)

  return {
    clientId: String(invoice?.clientId || ''),
    clientName: String(invoice?.clientName || ''),
    numero: String(invoice?.numero || invoice?.invoiceNumber || ''),
    referenceDevis: String(invoice?.referenceDevis || invoice?.quoteReference || ''),
    dateFacture,
    dateEcheance,
    workflowStatus: getWorkflowStatus(invoice),
    montantPaye: String(storedAmountPaid),
    paymentMethod: String(
      invoice?.paymentMethod ||
        invoice?.modeReglement ||
        (invoice ? '' : PAYMENT_METHODS[0]),
    ),
    rib: String(invoice?.rib || ''),
    items: sourceItems.length
      ? sourceItems.map((item) => ({
          id: createLineId(),
          designation: String(item.designation || item.description || ''),
          quantity: String(item.quantity ?? item.quantite ?? 1),
          unitPrice: String(item.unitPrice ?? item.prixUnitaire ?? item.puHT ?? ''),
          taxRate: String(item.taxRate ?? item.tauxTVA ?? item.tva ?? 20).replace('%', ''),
        }))
      : [createEmptyLine()],
    conditionsReglement: String(
      invoice?.conditionsReglement ||
        invoice?.paymentTerms ||
        (invoice ? '' : PAYMENT_TERMS[0]),
    ),
    conditionsParticulieres: String(
      invoice?.conditionsParticulieres || invoice?.specialConditions || '',
    ),
    notes: String(invoice?.notes || ''),
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
    Number.isFinite(quantity) &&
    Number.isFinite(unitPrice) &&
    Number.isFinite(rawTotalHT)
      ? roundAmount(rawTotalHT)
      : 0
  const rawTotalTVA = totalHT * (taxRate / 100)
  const totalTVA =
    Number.isFinite(taxRate) && taxRate >= 0 && Number.isFinite(rawTotalTVA)
      ? roundAmount(rawTotalTVA)
      : 0
  const rawTotalTTC = totalHT + totalTVA

  return {
    totalHT,
    totalTVA,
    totalTTC: Number.isFinite(rawTotalTTC) ? roundAmount(rawTotalTTC) : 0,
  }
}

function getInvoiceLineErrors(line, index) {
  const lineError = {}
  const quantity = Number(line.quantity)
  const unitPrice = Number(line.unitPrice)
  const taxRate = Number(line.taxRate)
  const designation = line.designation.trim()
  const totalHT = quantity * unitPrice
  const totalTVA = totalHT * (taxRate / 100)
  const totalTTC = totalHT + totalTVA

  if (!designation) {
    lineError.designation = `La désignation de la ligne ${index + 1} est obligatoire.`
  } else if (designation.length > 180) {
    lineError.designation = 'La désignation ne doit pas dépasser 180 caractères.'
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    lineError.quantity = 'La quantité doit être supérieure à zéro.'
  }
  if (line.unitPrice.trim() === '' || !Number.isFinite(unitPrice) || unitPrice < 0) {
    lineError.unitPrice = 'Saisissez un prix unitaire HT positif ou nul.'
  }
  if (
    Number.isFinite(quantity) &&
    Number.isFinite(unitPrice) &&
    Number.isFinite(taxRate) &&
    (!Number.isFinite(totalHT) || !Number.isFinite(totalTVA) || !Number.isFinite(totalTTC))
  ) {
    lineError.unitPrice = 'Le total de la ligne est trop élevé.'
  }
  if (!VAT_RATES.includes(taxRate)) {
    lineError.taxRate = 'Sélectionnez un taux de TVA valide.'
  }

  return lineError
}

function getPaymentStatus(workflowStatus, amountPaid, totalTTC) {
  if (workflowStatus === 'Annulée') {
    return 'Annulée'
  }
  if (workflowStatus === 'Brouillon') {
    return 'Brouillon'
  }
  if (totalTTC > 0 && amountPaid >= totalTTC) {
    return 'Payée'
  }
  if (amountPaid > 0) {
    return 'Paiement Partiel'
  }
  return 'Validée / Non Payée'
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
  step,
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
        step={step}
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

function InvoiceTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'general', label: 'Infos générales', icon: FileText },
    { id: 'items', label: 'Lignes de facturation', icon: Calculator },
    { id: 'payment', label: 'Paiement & totaux', icon: Banknote },
  ]

  return (
    <div
      aria-label="Sections de la facture"
      className="grid grid-cols-3 gap-1 border-b border-slate-200 px-4 sm:px-7"
      role="tablist"
    >
      {tabs.map(({ id, label, icon: Icon }, index) => {
        const isActive = activeTab === id
        return (
          <button
            aria-label={`Étape ${index + 1} : ${label}`}
            aria-controls={`invoice-panel-${id}`}
            aria-selected={isActive}
            className={`relative flex min-h-14 items-center justify-center gap-2 px-2 py-3 text-center text-xs font-semibold transition sm:min-h-16 sm:text-sm ${
              isActive ? 'text-blue-800' : 'text-slate-500 hover:text-slate-800'
            }`}
            id={`invoice-tab-${id}`}
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

export default function InvoiceForm({ invoice = null, onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState(() => getInitialFormData(invoice))
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
  const amountPaid = Number(formData.montantPaye)
  const normalizedAmountPaid = Number.isFinite(amountPaid) ? amountPaid : 0
  const paymentStatus = getPaymentStatus(
    formData.workflowStatus,
    normalizedAmountPaid,
    totals.totalTTC,
  )
  const allItemsValid =
    formData.items.length > 0 &&
    formData.items.every((item, index) => Object.keys(getInvoiceLineErrors(item, index)).length === 0)
  const hasValidDateRange =
    Boolean(formData.dateFacture) &&
    Boolean(formData.dateEcheance) &&
    formData.dateEcheance >= formData.dateFacture

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
      ...(name === 'dateFacture' && !invoice
        ? { dateEcheance: addDays(value, 30) }
        : {}),
    }))
    setErrors((previous) => {
      const nextErrors = { ...previous }
      delete nextErrors[name]

      if (name === 'dateFacture' || name === 'dateEcheance') {
        const nextInvoiceDate = name === 'dateFacture' ? value : formData.dateFacture
        const nextDueDate =
          name === 'dateEcheance'
            ? value
            : name === 'dateFacture' && !invoice
              ? addDays(value, 30)
              : formData.dateEcheance

        if (!nextInvoiceDate) {
          nextErrors.dateFacture = 'La date de facturation est obligatoire.'
        } else {
          delete nextErrors.dateFacture
        }

        if (!nextDueDate) {
          nextErrors.dateEcheance = 'La date d’échéance est obligatoire.'
        } else if (nextInvoiceDate && nextDueDate < nextInvoiceDate) {
          nextErrors.dateEcheance =
            'La date d’échéance doit être supérieure ou égale à la date de facturation.'
        } else {
          delete nextErrors.dateEcheance
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
    setErrors((previous) => (previous.items ? { ...previous, items: null } : previous))
    setFormError('')
  }

  function addLine() {
    setFormData((previous) => ({
      ...previous,
      items: [...previous.items, createEmptyLine()],
    }))
    setErrors((previous) => ({ ...previous, items: null }))
  }

  function removeLine(lineId) {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.filter((line) => line.id !== lineId),
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
    if (
      formData.referenceDevis.trim() &&
      !/^[\p{L}\d][\p{L}\d._/-]{1,49}$/u.test(formData.referenceDevis.trim())
    ) {
      nextErrors.referenceDevis = 'La référence du devis contient des caractères non valides.'
    }
    if (!formData.dateFacture) {
      nextErrors.dateFacture = 'La date de facturation est obligatoire.'
    }
    if (!formData.dateEcheance) {
      nextErrors.dateEcheance = 'La date d’échéance est obligatoire.'
    } else if (formData.dateFacture && formData.dateEcheance < formData.dateFacture) {
      nextErrors.dateEcheance =
        'La date d’échéance doit être supérieure ou égale à la date de facturation.'
    }
    if (!INVOICE_WORKFLOW_STATUSES.includes(formData.workflowStatus)) {
      nextErrors.workflowStatus = 'Sélectionnez un état de facture valide.'
    }
    if (formData.paymentMethod.trim().length > 80) {
      nextErrors.paymentMethod = 'Le mode de paiement ne doit pas dépasser 80 caractères.'
    }
    if (formData.conditionsReglement.trim().length > 3000) {
      nextErrors.conditionsReglement =
        'Les conditions de règlement ne doivent pas dépasser 3 000 caractères.'
    }
    if (formData.conditionsParticulieres.trim().length > 5000) {
      nextErrors.conditionsParticulieres =
        'Les conditions particulières ne doivent pas dépasser 5 000 caractères.'
    }

    const itemErrors = formData.items.map(getInvoiceLineErrors)

    if (formData.items.length === 0) {
      nextErrors.items = [{ designation: 'Ajoutez au moins une ligne à la facture.' }]
    } else if (itemErrors.some((lineError) => Object.keys(lineError).length > 0)) {
      nextErrors.items = itemErrors
    }

    const paidAmount = Number(formData.montantPaye)
    if (
      formData.montantPaye.trim() === '' ||
      !Number.isFinite(paidAmount) ||
      paidAmount < 0
    ) {
      nextErrors.montantPaye = 'Le montant payé doit être un nombre positif ou nul.'
    } else if (paidAmount > totals.totalTTC + 0.01) {
      nextErrors.montantPaye = 'Le montant payé ne peut pas dépasser le total TTC.'
    }
    if (formData.rib.trim().length > 100) {
      nextErrors.rib = 'Le RIB ne doit pas dépasser 100 caractères.'
    }
    if (formData.notes.trim().length > 5000) {
      nextErrors.notes = 'Les notes ne doivent pas dépasser 5 000 caractères.'
    }

    setErrors(nextErrors)
    if (
      nextErrors.clientId ||
      nextErrors.numero ||
      nextErrors.referenceDevis ||
      nextErrors.dateFacture ||
      nextErrors.dateEcheance
    ) {
      setActiveTab('general')
    } else if (nextErrors.items) {
      setActiveTab('items')
    } else if (
      nextErrors.montantPaye ||
      nextErrors.workflowStatus ||
      nextErrors.paymentMethod ||
      nextErrors.conditionsReglement ||
      nextErrors.conditionsParticulieres ||
      nextErrors.rib ||
      nextErrors.notes
    ) {
      setActiveTab('payment')
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
      setFormError('Rechargez la liste des clients avant d’enregistrer la facture.')
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

    const savedItems = formData.items.map((item) => ({
      designation: item.designation.trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate),
      ...getLineTotals(item),
    }))
    const payload = {
      clientId: selectedClient.id,
      clientName: getClientName(selectedClient),
      numero:
        formData.numero.trim().toLocaleUpperCase('fr-FR') ||
        invoice?.numero ||
        invoice?.invoiceNumber ||
        '',
      referenceDevis: formData.referenceDevis.trim().toLocaleUpperCase('fr-FR'),
      dateFacture: formData.dateFacture,
      dateEcheance: formData.dateEcheance,
      workflowStatus: formData.workflowStatus,
      status: getPaymentStatus(formData.workflowStatus, normalizedAmountPaid, totals.totalTTC),
      montantPaye: roundAmount(normalizedAmountPaid),
      paymentMethod: formData.paymentMethod,
      rib: formData.rib.trim(),
      items: savedItems,
      totalHT: totals.totalHT,
      totalTVA: totals.totalTVA,
      totalTTC: totals.totalTTC,
      conditionsReglement: formData.conditionsReglement.trim(),
      conditionsParticulieres: formData.conditionsParticulieres.trim(),
      notes: formData.notes.trim(),
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || null,
    }

    setIsSaving(true)
    let savedAction
    try {
      if (invoice?.id) {
        await updateDoc(doc(db, 'invoices', invoice.id), payload)
        savedAction = 'updated'
      } else {
        const invoiceDocument = doc(collection(db, 'invoices'))
        const invoiceNumber =
          payload.numero ||
          `FAC-${new Date(`${formData.dateFacture}T12:00:00`).getFullYear()}-${invoiceDocument.id
            .slice(0, 6)
            .toUpperCase()}`
        await setDoc(invoiceDocument, {
          ...payload,
          numero: invoiceNumber,
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
        aria-labelledby="invoice-form-title"
        aria-modal="true"
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Banknote aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Cycle commercial
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900" id="invoice-form-title">
                {invoice ? 'Modifier la facture' : 'Nouvelle facture'}
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

        <InvoiceTabs activeTab={activeTab} onChange={setActiveTab} />

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            <section
              aria-labelledby="invoice-tab-general"
              className={activeTab === 'general' ? 'space-y-5' : 'hidden'}
              id="invoice-panel-general"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="invoice-client">
                    Client
                    <span aria-hidden="true" className="ml-1 text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <UserRound
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      aria-describedby={errors.clientId ? 'invoice-client-error' : undefined}
                      aria-invalid={Boolean(errors.clientId)}
                      className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                        errors.clientId
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                      }`}
                      disabled={isSaving || isLoadingClients || clients.length === 0}
                      id="invoice-client"
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
                    <p className="mt-1.5 text-xs text-red-700" id="invoice-client-error">
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
                  id="invoice-number"
                  label="N° de facture (optionnel)"
                  name="numero"
                  onChange={handleChange}
                  placeholder="Généré automatiquement si laissé vide"
                  value={formData.numero}
                  disabled={isSaving}
                />
                <TextField
                  error={errors.referenceDevis}
                  id="invoice-quote-reference"
                  label="Référence du devis associé"
                  name="referenceDevis"
                  onChange={handleChange}
                  placeholder="DEV-2026-001"
                  value={formData.referenceDevis}
                  disabled={isSaving}
                />
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="invoice-workflow-status"
                  >
                    État de la facture
                  </label>
                  <select
                    aria-describedby={
                      errors.workflowStatus ? 'invoice-workflow-status-error' : undefined
                    }
                    aria-invalid={Boolean(errors.workflowStatus)}
                    className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                      errors.workflowStatus
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                    }`}
                    disabled={isSaving}
                    id="invoice-workflow-status"
                    name="workflowStatus"
                    onChange={handleChange}
                    value={formData.workflowStatus}
                  >
                    {INVOICE_WORKFLOW_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {errors.workflowStatus && (
                    <p className="mt-1.5 text-xs text-red-700" id="invoice-workflow-status-error">
                      {errors.workflowStatus}
                    </p>
                  )}
                </div>
                <TextField
                  error={errors.dateFacture}
                  id="invoice-date"
                  label="Date de facturation"
                  name="dateFacture"
                  onChange={handleChange}
                  required
                  type="date"
                  value={formData.dateFacture}
                  disabled={isSaving}
                />
                <TextField
                  error={errors.dateEcheance}
                  id="invoice-due-date"
                  label="Date d’échéance"
                  name="dateEcheance"
                  onChange={handleChange}
                  required
                  min={formData.dateFacture || undefined}
                  type="date"
                  value={formData.dateEcheance}
                  disabled={isSaving}
                />
              </div>
            </section>

            <section
              aria-labelledby="invoice-tab-items"
              className={activeTab === 'items' ? 'space-y-5' : 'hidden'}
              id="invoice-panel-items"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Lignes de facturation</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Les montants HT, TVA et TTC sont calculés automatiquement.
                  </p>
                </div>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 sm:self-auto"
                  disabled={isSaving}
                  onClick={addLine}
                  type="button"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Ajouter une ligne
                </button>
              </div>

              {!allItemsValid && (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {formData.items.length === 0
                    ? 'Ajoutez au moins une ligne à la facture.'
                    : 'Corrigez chaque ligne : désignation requise, quantité supérieure à zéro, prix HT nul ou positif et taux de TVA valide.'}
                </p>
              )}

              <div className="space-y-3">
                {formData.items.map((item, index) => {
                  const itemError = getInvoiceLineErrors(item, index)
                  const calculated = lineTotals[index]
                  return (
                    <article
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                      key={item.id}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-slate-700">Ligne {index + 1}</h4>
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
                            htmlFor={`invoice-line-${item.id}-designation`}
                          >
                            Désignation
                          </label>
                          <input
                            aria-describedby={
                              itemError.designation ? `invoice-line-${item.id}-error` : undefined
                            }
                            aria-invalid={Boolean(itemError.designation)}
                            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                              itemError.designation
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                            }`}
                            disabled={isSaving}
                            id={`invoice-line-${item.id}-designation`}
                            onChange={(event) =>
                              handleLineChange(item.id, 'designation', event.target.value)
                            }
                            placeholder="Désignation de l’article ou du service"
                            value={item.designation}
                          />
                          {itemError.designation && (
                            <p
                              className="mt-1 text-xs text-red-700"
                              id={`invoice-line-${item.id}-error`}
                            >
                              {itemError.designation}
                            </p>
                          )}
                        </div>
                        {[
                          {
                            key: 'quantity',
                            label: 'Quantité',
                            type: 'number',
                            min: '0.01',
                            step: '0.01',
                            placeholder: '1',
                          },
                          {
                            key: 'unitPrice',
                            label: 'PU HT',
                            type: 'number',
                            min: '0',
                            step: '0.01',
                            placeholder: '0.00',
                          },
                        ].map((field) => (
                          <div className="sm:col-span-2" key={field.key}>
                            <label
                              className="mb-1.5 block text-xs font-medium text-slate-600"
                              htmlFor={`invoice-line-${item.id}-${field.key}`}
                            >
                              {field.label}
                            </label>
                            <input
                              aria-describedby={
                                itemError[field.key]
                                  ? `invoice-line-${item.id}-${field.key}-error`
                                  : undefined
                              }
                              aria-invalid={Boolean(itemError[field.key])}
                              className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                                itemError[field.key]
                                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                              }`}
                              disabled={isSaving}
                              id={`invoice-line-${item.id}-${field.key}`}
                              min={field.min}
                              onChange={(event) =>
                                handleLineChange(item.id, field.key, event.target.value)
                              }
                              placeholder={field.placeholder}
                              step={field.step}
                              type={field.type}
                              value={item[field.key]}
                            />
                            {itemError[field.key] && (
                              <p
                                className="mt-1 text-xs text-red-700"
                                id={`invoice-line-${item.id}-${field.key}-error`}
                              >
                                {itemError[field.key]}
                              </p>
                            )}
                          </div>
                        ))}
                        <div className="sm:col-span-2">
                          <label
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                            htmlFor={`invoice-line-${item.id}-tax`}
                          >
                            Taux TVA
                          </label>
                          <select
                            aria-describedby={
                              itemError.taxRate
                                ? `invoice-line-${item.id}-tax-error`
                                : undefined
                            }
                            aria-invalid={Boolean(itemError.taxRate)}
                            className={`h-10 w-full rounded-lg border bg-white px-2 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                              itemError.taxRate
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                            }`}
                            disabled={isSaving}
                            id={`invoice-line-${item.id}-tax`}
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
                          {itemError.taxRate && (
                            <p
                              className="mt-1 text-xs text-red-700"
                              id={`invoice-line-${item.id}-tax-error`}
                            >
                              {itemError.taxRate}
                            </p>
                          )}
                        </div>
                        <div className="sm:col-span-6">
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
              aria-labelledby="invoice-tab-payment"
              className={activeTab === 'payment' ? 'space-y-5' : 'hidden'}
              id="invoice-panel-payment"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        className="mb-2 block text-sm font-medium text-slate-700"
                        htmlFor="invoice-workflow-status-payment"
                      >
                        État de validation
                      </label>
                      <select
                        aria-describedby={
                          errors.workflowStatus ? 'invoice-workflow-status-payment-error' : undefined
                        }
                        aria-invalid={Boolean(errors.workflowStatus)}
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                        disabled={isSaving}
                        id="invoice-workflow-status-payment"
                        name="workflowStatus"
                        onChange={handleChange}
                        value={formData.workflowStatus}
                      >
                        {INVOICE_WORKFLOW_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {errors.workflowStatus && (
                        <p
                          className="mt-1.5 text-xs text-red-700"
                          id="invoice-workflow-status-payment-error"
                        >
                          {errors.workflowStatus}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        className="mb-2 block text-sm font-medium text-slate-700"
                        htmlFor="invoice-payment-method"
                      >
                        Mode de paiement
                      </label>
                      <select
                        aria-describedby={
                          errors.paymentMethod ? 'invoice-payment-method-error' : undefined
                        }
                        aria-invalid={Boolean(errors.paymentMethod)}
                        className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                          errors.paymentMethod
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                        }`}
                        disabled={isSaving}
                        id="invoice-payment-method"
                        name="paymentMethod"
                        onChange={handleChange}
                        value={formData.paymentMethod}
                      >
                        <option value="">Non renseigné</option>
                        {formData.paymentMethod &&
                          !PAYMENT_METHODS.includes(formData.paymentMethod) && (
                            <option value={formData.paymentMethod}>
                              {formData.paymentMethod}
                            </option>
                          )}
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                      {errors.paymentMethod && (
                        <p className="mt-1.5 text-xs text-red-700" id="invoice-payment-method-error">
                          {errors.paymentMethod}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        className="mb-2 block text-sm font-medium text-slate-700"
                        htmlFor="invoice-payment-terms"
                      >
                        Conditions de règlement
                      </label>
                      <select
                        aria-describedby={
                          errors.conditionsReglement
                            ? 'invoice-payment-terms-error'
                            : undefined
                        }
                        aria-invalid={Boolean(errors.conditionsReglement)}
                        className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                          errors.conditionsReglement
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                        }`}
                        disabled={isSaving}
                        id="invoice-payment-terms"
                        name="conditionsReglement"
                        onChange={handleChange}
                        value={formData.conditionsReglement}
                      >
                        <option value="">Non renseignées</option>
                        {formData.conditionsReglement &&
                          !PAYMENT_TERMS.includes(formData.conditionsReglement) && (
                            <option value={formData.conditionsReglement}>
                              {formData.conditionsReglement}
                            </option>
                          )}
                        {PAYMENT_TERMS.map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </select>
                      {errors.conditionsReglement && (
                        <p
                          className="mt-1.5 text-xs text-red-700"
                          id="invoice-payment-terms-error"
                        >
                          {errors.conditionsReglement}
                        </p>
                      )}
                    </div>
                    <TextField
                      error={errors.montantPaye}
                      id="invoice-amount-paid"
                      label="Montant déjà payé (MAD)"
                      name="montantPaye"
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      type="number"
                      value={formData.montantPaye}
                      disabled={isSaving}
                    />
                    <TextField
                      error={errors.rib}
                      id="invoice-rib"
                      label="RIB (repris dans le PDF)"
                      name="rib"
                      onChange={handleChange}
                      placeholder="RIB de l’entreprise"
                      value={formData.rib}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-slate-700"
                      htmlFor="invoice-special-conditions"
                    >
                      Conditions particulières
                    </label>
                    <textarea
                      aria-describedby={
                        errors.conditionsParticulieres
                          ? 'invoice-special-conditions-error'
                          : undefined
                      }
                      aria-invalid={Boolean(errors.conditionsParticulieres)}
                      className={`min-h-28 w-full resize-y rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        errors.conditionsParticulieres
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                      }`}
                      disabled={isSaving}
                      id="invoice-special-conditions"
                      maxLength={5000}
                      name="conditionsParticulieres"
                      onChange={handleChange}
                      placeholder="Ex. TVA exonérée selon l’article..."
                      rows={4}
                      value={formData.conditionsParticulieres}
                    />
                    {errors.conditionsParticulieres && (
                      <p
                        className="mt-1.5 text-xs text-red-700"
                        id="invoice-special-conditions-error"
                      >
                        {errors.conditionsParticulieres}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="invoice-notes">
                      Notes et informations de règlement
                    </label>
                    <textarea
                      aria-describedby={errors.notes ? 'invoice-notes-error' : undefined}
                      aria-invalid={Boolean(errors.notes)}
                      className={`min-h-28 w-full resize-y rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        errors.notes
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                      }`}
                      disabled={isSaving}
                      id="invoice-notes"
                      name="notes"
                      onChange={handleChange}
                      placeholder="Instructions de virement, conditions particulières..."
                      rows={4}
                      value={formData.notes}
                    />
                    {errors.notes && (
                      <p className="mt-1.5 text-xs text-red-700" id="invoice-notes-error">
                        {errors.notes}
                      </p>
                    )}
                  </div>
                </div>

                <aside className="h-fit rounded-xl border border-blue-100 bg-blue-50/70 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                    <Calculator aria-hidden="true" className="h-4 w-4" />
                    Récapitulatif facture
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
                    <div className="flex items-center justify-between gap-4 border-t border-blue-200 pt-3">
                      <dt className="font-semibold text-slate-800">Total TTC</dt>
                      <dd className="text-lg font-bold text-blue-900">{formatCurrency(totals.totalTTC)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-600">
                      <dt>Déjà payé</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatCurrency(normalizedAmountPaid)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-blue-200 pt-3">
                      <dt className="font-semibold text-slate-800">Statut de paiement</dt>
                      <dd className="text-right text-xs font-bold text-blue-900">{paymentStatus}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-600">
                      <dt>Reste à payer</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatCurrency(Math.max(0, totals.totalTTC - normalizedAmountPaid))}
                      </dd>
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
                onClick={() => setActiveTab(activeTab === 'payment' ? 'items' : 'general')}
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                Précédent
              </button>
              {activeTab !== 'payment' && (
                <button
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving}
                  onClick={() =>
                    setActiveTab(activeTab === 'general' ? 'items' : 'payment')
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
                  !allItemsValid ||
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
                  : invoice
                    ? 'Enregistrer les modifications'
                    : 'Créer la facture'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
