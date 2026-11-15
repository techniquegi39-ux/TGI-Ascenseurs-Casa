import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpDown,
  Banknote,
  Download,
  Flame,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { collection, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore'
import InvoiceForm from '../components/InvoiceForm.jsx'
import { db } from '../firebase.js'

const DownloadPdfButton = lazy(() => import('../components/pdf/DownloadPdfButton.jsx'))

const INVOICE_STATUSES = [
  'Brouillon',
  'Validée / Non Payée',
  'Paiement Partiel',
  'Payée',
  'Annulée',
]

function getInvoiceNumber(invoice) {
  return String(
    invoice.numero ||
      invoice.invoiceNumber ||
      (invoice.id ? `FAC-${invoice.id.slice(0, 7).toUpperCase()}` : 'Sans numéro'),
  )
}

function getClientId(invoice) {
  return String(invoice.clientId || '')
}

function getClientName(client) {
  return String(client?.nom || client?.raisonSociale || client?.name || 'Client non renseigné')
}

function getInvoiceClientName(invoice, clientsById) {
  return getClientName(
    clientsById.get(getClientId(invoice)) || {
      nom: invoice.clientName || invoice.client || 'Client non renseigné',
    },
  )
}

function getDateValue(value) {
  if (!value) {
    return null
  }
  if (typeof value?.toDate === 'function') {
    value = value.toDate()
  } else if (typeof value === 'string') {
    value = new Date(value)
  }
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null
}

function formatDate(value) {
  const date = getDateValue(value)
  if (!date) {
    return '—'
  }
  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getDateKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }

  const date = getDateValue(value)
  if (!date) {
    return ''
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function getTodayDateKey() {
  return getDateKey(new Date())
}

function getOptionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function normalizeTaxRate(value) {
  const rate = Number(String(value ?? 0).replace('%', '').trim())
  return Number.isFinite(rate) ? rate : 0
}

function getInvoiceItems(invoice) {
  if (!Array.isArray(invoice.items)) {
    return []
  }

  return invoice.items.map((item) => {
    const quantity = Number(item.quantity ?? item.quantite ?? 0)
    const unitPrice = Number(item.unitPrice ?? item.prixUnitaire ?? item.puHT ?? 0)
    const taxRate = normalizeTaxRate(item.taxRate ?? item.tauxTVA ?? item.tva)
    const explicitHT = getOptionalNumber(item.totalHT ?? item.totalHt)
    const totalHT =
      explicitHT ??
      (Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : 0)
    const explicitTVA = getOptionalNumber(item.totalTVA ?? item.totalTva)
    const totalTVA = explicitTVA ?? totalHT * (taxRate / 100)

    return {
      designation: String(item.designation || item.description || '—'),
      quantity: Number.isFinite(quantity) ? quantity : 0,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      taxRate,
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA,
    }
  })
}

function getInvoiceTotals(invoice) {
  const items = getInvoiceItems(invoice)
  const computed = items.reduce(
    (sum, item) => ({
      totalHT: sum.totalHT + item.totalHT,
      totalTVA: sum.totalTVA + item.totalTVA,
      totalTTC: sum.totalTTC + item.totalTTC,
    }),
    { totalHT: 0, totalTVA: 0, totalTTC: 0 },
  )
  const totalHT = getOptionalNumber(invoice.totalHT ?? invoice.totaux?.totalHT)
  const totalTVA = getOptionalNumber(
    invoice.totalTVA ?? invoice.totaux?.totalTVA ?? invoice.totaux?.totalTva,
  )
  const totalTTC = getOptionalNumber(
    invoice.totalTTC ?? invoice.totaux?.totalTTC ?? invoice.totaux?.totalTtc,
  )

  return {
    totalHT: totalHT ?? computed.totalHT,
    totalTVA: totalTVA ?? computed.totalTVA,
    totalTTC: totalTTC ?? computed.totalTTC,
  }
}

function getAmountPaid(invoice) {
  const amountPaid = getOptionalNumber(invoice.montantPaye ?? invoice.amountPaid)
  return amountPaid ?? 0
}

function getInvoiceStatus(invoice) {
  const workflowStatus = String(invoice.workflowStatus || '').trim()
  const paymentStatus = String(invoice.status || invoice.statut || '').trim()
  const normalizedWorkflow = workflowStatus
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
  const normalizedPayment = paymentStatus
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')

  if (normalizedWorkflow.includes('annul') || normalizedPayment.includes('annul')) {
    return 'Annulée'
  }
  if (normalizedWorkflow.includes('brouillon') || normalizedPayment.includes('brouillon')) {
    return 'Brouillon'
  }
  if (normalizedPayment.includes('non pay')) {
    return 'Validée / Non Payée'
  }
  if (normalizedPayment.includes('partiel')) {
    return 'Paiement Partiel'
  }
  if (normalizedPayment.includes('payee') || normalizedPayment.includes('paid')) {
    return 'Payée'
  }

  const paid = getAmountPaid(invoice)
  const total = getInvoiceTotals(invoice).totalTTC
  if (total > 0 && paid >= total - 0.01) {
    return 'Payée'
  }
  if (paid > 0) {
    return 'Paiement Partiel'
  }
  return 'Validée / Non Payée'
}

function isInvoiceOverdue(invoice) {
  const status = getInvoiceStatus(invoice)
  if (status !== 'Validée / Non Payée' && status !== 'Paiement Partiel') {
    return false
  }

  const dueDate = getDateKey(invoice.dateEcheance || invoice.dueDate)
  return Boolean(dueDate && dueDate < getTodayDateKey())
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MAD`
}

function normalizeSearch(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

function StatusBadge({ status }) {
  const styles = {
    Brouillon: {
      badge: 'bg-slate-100 text-slate-700 ring-slate-500/15',
      dot: 'bg-slate-400',
    },
    'Validée / Non Payée': {
      badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
      dot: 'bg-amber-500',
    },
    'Paiement Partiel': {
      badge: 'bg-sky-50 text-sky-800 ring-sky-600/20',
      dot: 'bg-sky-500',
    },
    Payée: {
      badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
      dot: 'bg-emerald-500',
    },
    Annulée: {
      badge: 'bg-red-50 text-red-800 ring-red-600/20',
      dot: 'bg-red-500',
    },
  }[status] || {
    badge: 'bg-slate-100 text-slate-700 ring-slate-500/15',
    dot: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${styles.dot}`}
        />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${styles.dot}`} />
      </span>
      {status}
    </span>
  )
}

function Toast({ toast, onClose }) {
  if (!toast) {
    return null
  }
  const isError = toast.type === 'error'

  return (
    <div
      className={`fixed right-4 top-4 z-[70] flex max-w-md items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-xl ${
        isError ? 'border-red-200 text-red-800' : 'border-emerald-200 text-emerald-800'
      }`}
      role={isError ? 'alert' : 'status'}
    >
      {isError ? (
        <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <Banknote aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      )}
      <p className="flex-1 text-sm leading-5">{toast.message}</p>
      <button
        aria-label="Fermer la notification"
        className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        onClick={onClose}
        type="button"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}

function getCompanyInfo(settings = {}) {
  const defaults = {
    name: 'TGI ASCENSEURS CASA',
    address: '',
    phone: '',
    email: '',
    ice: '',
    rc: '',
    patente: '',
  }
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(settings).filter(([, value]) => typeof value === 'string'),
    ),
  }
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'dateEcheance', direction: 'asc' })
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [invoiceError, setInvoiceError] = useState('')
  const [clientError, setClientError] = useState('')
  const [modalInvoice, setModalInvoice] = useState(undefined)
  const [exportingId, setExportingId] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'invoices'),
      (snapshot) => {
        setInvoices(
          snapshot.docs.map((invoiceDocument) => ({
            ...invoiceDocument.data(),
            id: invoiceDocument.id,
          })),
        )
        setInvoiceError('')
        setIsLoadingInvoices(false)
      },
      (error) => {
        setInvoiceError(
          error instanceof Error ? error.message : 'Impossible de charger les factures.',
        )
        setIsLoadingInvoices(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'clients'),
      (snapshot) => {
        setClients(
          snapshot.docs.map((clientDocument) => ({
            ...clientDocument.data(),
            id: clientDocument.id,
          })),
        )
        setClientError('')
        setIsLoadingClients(false)
      },
      (error) => {
        setClientError(
          error instanceof Error ? error.message : 'Impossible de charger les clients.',
        )
        setIsLoadingClients(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!toast) {
      return undefined
    }
    const timeoutId = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )

  const filteredInvoices = useMemo(() => {
    const queryText = normalizeSearch(search)
    return invoices
      .filter((invoice) => {
        if (statusFilter !== 'Tous' && getInvoiceStatus(invoice) !== statusFilter) {
          return false
        }
        if (!queryText) {
          return true
        }
        return [
          getInvoiceNumber(invoice),
          getInvoiceClientName(invoice, clientsById),
          invoice.referenceDevis,
        ].some((value) => normalizeSearch(value || '').includes(queryText))
      })
      .sort((first, second) => {
        if (sortConfig.key === 'totalTTC') {
          const difference = getInvoiceTotals(first).totalTTC - getInvoiceTotals(second).totalTTC
          return sortConfig.direction === 'asc' ? difference : -difference
        }

        const firstDate = getDateKey(first.dateEcheance || first.dueDate)
        const secondDate = getDateKey(second.dateEcheance || second.dueDate)
        if (!firstDate || !secondDate) {
          return firstDate ? -1 : secondDate ? 1 : 0
        }

        const order = firstDate.localeCompare(secondDate)
        return sortConfig.direction === 'asc' ? order : -order
      })
  }, [clientsById, invoices, search, sortConfig, statusFilter])

  const invoicePdfColumns = useMemo(
    () => [
      { header: 'N° Facture', accessor: getInvoiceNumber, width: '12%' },
      {
        header: 'Date',
        accessor: (invoice) =>
          formatDate(invoice.dateFacture || invoice.dateEmission || invoice.date),
        width: '12%',
      },
      {
        header: 'Client',
        accessor: (invoice) => getInvoiceClientName(invoice, clientsById),
        width: '22%',
      },
      {
        header: 'Échéance',
        accessor: (invoice) => formatDate(invoice.dateEcheance || invoice.dueDate),
        width: '12%',
      },
      {
        header: 'Total TTC',
        accessor: (invoice) => formatCurrency(getInvoiceTotals(invoice).totalTTC),
        width: '15%',
        align: 'right',
      },
      {
        header: 'Reste à payer',
        accessor: (invoice) =>
          formatCurrency(
            Math.max(0, getInvoiceTotals(invoice).totalTTC - getAmountPaid(invoice)),
          ),
        width: '15%',
        align: 'right',
      },
      { header: 'Statut', accessor: getInvoiceStatus, width: '12%' },
    ],
    [clientsById],
  )

  const invoicePdfTotals = useMemo(
    () =>
      filteredInvoices.reduce(
        (sum, invoice) => {
          const totals = getInvoiceTotals(invoice)
          const paid = getAmountPaid(invoice)
          return {
            totalHT: sum.totalHT + totals.totalHT,
            totalTVA: sum.totalTVA + totals.totalTVA,
            totalTTC: sum.totalTTC + totals.totalTTC,
            amountPaid: sum.amountPaid + paid,
            outstandingBalance:
              sum.outstandingBalance + Math.max(0, totals.totalTTC - paid),
          }
        },
        { totalHT: 0, totalTVA: 0, totalTTC: 0, amountPaid: 0, outstandingBalance: 0 },
      ),
    [filteredInvoices],
  )

  const draftCount = invoices.filter((invoice) => getInvoiceStatus(invoice) === 'Brouillon').length
  const unpaidCount = invoices.filter(
    (invoice) => getInvoiceStatus(invoice) === 'Validée / Non Payée',
  ).length
  const partialCount = invoices.filter(
    (invoice) => getInvoiceStatus(invoice) === 'Paiement Partiel',
  ).length
  const paidCount = invoices.filter((invoice) => getInvoiceStatus(invoice) === 'Payée').length

  function showToast(type, message) {
    setToast({ type, message })
  }

  function handleSort(key) {
    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  function handleSaved(action) {
    setModalInvoice(undefined)
    showToast(
      'success',
      action === 'updated' ? 'La facture a été modifiée.' : 'La facture a été créée.',
    )
  }

  async function handleDelete(invoice) {
    const number = getInvoiceNumber(invoice)
    if (!window.confirm(`Supprimer définitivement la facture « ${number} » ?`)) {
      return
    }
    try {
      await deleteDoc(doc(db, 'invoices', invoice.id))
      showToast('success', 'La facture a été supprimée.')
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `Suppression impossible : ${error.message}`
          : 'Suppression impossible. Veuillez réessayer.',
      )
    }
  }

  async function handleExport(invoice) {
    setExportingId(invoice.id)
    try {
      const settingsSnapshot = await getDoc(doc(db, 'settings', 'company'))
      const companyInfo = getCompanyInfo(
        settingsSnapshot.exists() ? settingsSnapshot.data() : {},
      )
      const client = clientsById.get(getClientId(invoice))
      const totals = getInvoiceTotals(invoice)
      const [{ pdf }, { default: InvoicePdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/pdf/InvoicePdfDocument.jsx'),
      ])
      const documentInvoice = {
        ...invoice,
        number: getInvoiceNumber(invoice),
        totalHT: totals.totalHT,
        totalTVA: totals.totalTVA,
        totalTTC: totals.totalTTC,
        amountPaid: getAmountPaid(invoice),
        clientInfo: {
          ...client,
          nom: getInvoiceClientName(invoice, clientsById),
          adresse: client?.adresse || client?.address || '',
          ice: client?.ice || client?.identifiantFiscal || '',
          telephone: client?.telephone || client?.phone || '',
        },
        companyInfo,
      }
      const blob = await pdf(<InvoicePdfDocument invoice={documentInvoice} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Facture_${getInvoiceNumber(invoice)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast('success', 'La facture PDF a été générée.')
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `Export PDF impossible : ${error.message}`
          : 'Export PDF impossible. Veuillez réessayer.',
      )
    } finally {
      setExportingId('')
    }
  }

  const isLoading = isLoadingInvoices || isLoadingClients

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <Toast onClose={() => setToast(null)} toast={toast} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <Banknote aria-hidden="true" className="h-4 w-4" />
            Cycle commercial
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Factures
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Suivez les échéances, les règlements et les soldes de vos clients.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Suspense
            fallback={
              <span className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-3 text-sm text-slate-500">
                Chargement PDF...
              </span>
            }
          >
            <DownloadPdfButton
              columns={invoicePdfColumns}
              disabled={isLoading}
              documentTitle="Liste des factures"
              data={filteredInvoices}
              totals={invoicePdfTotals}
            />
          </Suspense>
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:w-auto"
            onClick={() => setModalInvoice(null)}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nouvelle facture
          </button>
        </div>
      </header>

      <section aria-label="Synthèse de la trésorerie" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Factures enregistrées</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {invoices.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Brouillons</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-700">{draftCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Non payées</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-700">{unpaidCount}</p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Paiement partiel</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-sky-700">{partialCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Payées</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-700">{paidCount}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">Registre des factures</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredInvoices.length} facture{filteredInvoices.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(15rem,1fr)_13rem] sm:items-center sm:w-[min(100%,36rem)]">
            <label className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Rechercher une facture par numéro ou client"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="N° de facture, client..."
                type="search"
                value={search}
              />
            </label>
            <label>
              <span className="sr-only">Filtrer par statut de paiement</span>
              <select
                aria-label="Filtrer par statut de paiement"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="Tous">Tous les statuts</option>
                {INVOICE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {invoiceError && (
          <div
            className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chargement des factures impossible : {invoiceError}</span>
          </div>
        )}
        {clientError && (
          <div
            className="mx-4 mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chargement des clients impossible : {clientError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12">
            <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin text-blue-700" />
            <p className="mt-3 text-sm text-slate-500">Chargement des factures...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <Banknote aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search || statusFilter !== 'Tous'
                ? 'Aucune facture ne correspond aux filtres'
                : 'Aucune facture pour le moment'}
            </h3>
            <p className="mt-1 max-w-md text-sm leading-5 text-slate-500">
              {search || statusFilter !== 'Tous'
                ? 'Modifiez la recherche ou le filtre pour afficher d’autres factures.'
                : 'Créez une facture pour suivre les règlements de vos clients.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    N° Facture
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </th>
                  <th
                    aria-sort={sortConfig.key === 'dateEcheance'
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : 'none'}
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <button
                      aria-label={`Trier par date d’échéance ${sortConfig.key === 'dateEcheance' && sortConfig.direction === 'asc' ? 'décroissante' : 'croissante'}`}
                      className="inline-flex items-center gap-2 text-left transition hover:text-blue-700 focus:outline-none focus:text-blue-700"
                      onClick={() => handleSort('dateEcheance')}
                      type="button"
                    >
                      Échéance
                      <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th
                    aria-sort={sortConfig.key === 'totalTTC'
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : 'none'}
                    className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <button
                      aria-label={`Trier par total TTC ${sortConfig.key === 'totalTTC' && sortConfig.direction === 'asc' ? 'décroissant' : 'croissant'}`}
                      className="inline-flex items-center gap-2 text-right transition hover:text-blue-700 focus:outline-none focus:text-blue-700"
                      onClick={() => handleSort('totalTTC')}
                      type="button"
                    >
                      Total TTC
                      <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reste à payer
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Statut de paiement
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                  const number = getInvoiceNumber(invoice)
                  const totals = getInvoiceTotals(invoice)
                  const isExporting = exportingId === invoice.id
                  const amountPaid = getAmountPaid(invoice)
                  const remainingAmount = Math.max(0, totals.totalTTC - amountPaid)
                  const status = getInvoiceStatus(invoice)
                  const overdue = isInvoiceOverdue(invoice)

                  return (
                    <tr className="transition hover:bg-slate-50/70" key={invoice.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {number}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(invoice.dateFacture || invoice.dateEmission || invoice.date)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm font-semibold text-slate-900">
                          {getInvoiceClientName(invoice, clientsById)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(invoice.dateEcheance || invoice.dueDate)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(totals.totalTTC)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-slate-700">
                        {formatCurrency(remainingAmount)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2">
                          <StatusBadge status={status} />
                          {overdue && (
                            <Flame
                              aria-label="Paiement en retard"
                              className="h-4 w-4 text-red-600"
                              role="img"
                              title="Paiement en retard"
                            />
                          )}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={`Exporter la facture ${number} en PDF`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-wait disabled:opacity-50"
                            disabled={Boolean(exportingId)}
                            onClick={() => void handleExport(invoice)}
                            title="Exporter la facture en PDF"
                            type="button"
                          >
                            {isExporting ? (
                              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download aria-hidden="true" className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            aria-label={`Modifier la facture ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            onClick={() => setModalInvoice(invoice)}
                            title="Modifier la facture"
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            aria-label={`Supprimer la facture ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                            onClick={() => void handleDelete(invoice)}
                            title="Supprimer la facture"
                            type="button"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalInvoice !== undefined && (
        <InvoiceForm
          invoice={modalInvoice}
          onClose={() => setModalInvoice(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
