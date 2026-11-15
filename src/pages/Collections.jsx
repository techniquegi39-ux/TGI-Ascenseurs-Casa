import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  LoaderCircle,
  Search,
  X,
} from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import PaymentModal from '../components/PaymentModal.jsx'
import { db } from '../firebase.js'

const COLLECTION_FILTERS = [
  { value: 'open', label: 'Impayées et paiements partiels' },
  { value: 'all', label: 'Toutes les factures' },
  { value: 'unpaid', label: 'Validées / non payées' },
  { value: 'partial', label: 'Paiement partiel' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'paid', label: 'Payées' },
  { value: 'cancelled', label: 'Annulées' },
]

function getInvoiceNumber(invoice) {
  return String(
    invoice.numero ||
      invoice.invoiceNumber ||
      (invoice.id ? `FAC-${invoice.id.slice(0, 7).toUpperCase()}` : 'Sans numéro'),
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

function getOptionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function getInvoiceTotalTTC(invoice) {
  const explicitTotal = getOptionalNumber(
    invoice.totalTTC ?? invoice.totaux?.totalTTC ?? invoice.totaux?.totalTtc,
  )
  if (explicitTotal !== undefined && explicitTotal >= 0) {
    return explicitTotal
  }

  const items = Array.isArray(invoice.items) ? invoice.items : []
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity ?? item.quantite ?? 0)
    const unitPrice = Number(item.unitPrice ?? item.prixUnitaire ?? item.puHT ?? 0)
    const taxRate = Number(
      String(item.taxRate ?? item.tauxTVA ?? item.tva ?? 0).replace('%', '').trim(),
    )
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice) || !Number.isFinite(taxRate)) {
      return sum
    }

    const totalHT = getOptionalNumber(item.totalHT ?? item.totalHt) ?? quantity * unitPrice
    const totalTVA =
      getOptionalNumber(item.totalTVA ?? item.totalTva) ?? totalHT * (taxRate / 100)
    return sum + totalHT + totalTVA
  }, 0)
}

function getAmountPaid(invoice, totalTTC) {
  const savedAmount = getOptionalNumber(invoice.montantPaye ?? invoice.amountPaid)
  if (savedAmount !== undefined) {
    return Math.max(0, savedAmount)
  }

  const status = normalizeSearch(invoice.status || invoice.statut || '')
  return status.includes('payee') && !status.includes('non pay') ? totalTTC : 0
}

function getInvoiceStatus(invoice, totalTTC, amountPaid) {
  const workflowStatus = normalizeSearch(invoice.workflowStatus || '')
  const paymentStatus = normalizeSearch(invoice.status || invoice.statut || '')

  if (workflowStatus.includes('annul') || paymentStatus.includes('annul')) {
    return 'Annulée'
  }
  if (workflowStatus.includes('brouillon') || paymentStatus.includes('brouillon')) {
    return 'Brouillon'
  }
  if (paymentStatus.includes('non pay')) {
    return 'Validée / Non Payée'
  }
  if (paymentStatus.includes('partiel')) {
    return 'Paiement Partiel'
  }
  if (paymentStatus.includes('payee') || paymentStatus.includes('paid')) {
    return 'Payée'
  }
  if (totalTTC > 0 && amountPaid >= totalTTC - 0.01) {
    return 'Payée'
  }
  if (amountPaid > 0) {
    return 'Paiement Partiel'
  }
  return 'Validée / Non Payée'
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MAD`
}

function getClientName(invoice, clientsById) {
  const client = clientsById.get(String(invoice.clientId || ''))
  return String(
    client?.nom ||
      client?.raisonSociale ||
      client?.name ||
      invoice.clientName ||
      invoice.client ||
      'Client non renseigné',
  )
}

function getInvoiceRow(invoice, clientsById) {
  const totalTTC = getInvoiceTotalTTC(invoice)
  const amountPaid = getAmountPaid(invoice, totalTTC)
  return {
    ...invoice,
    number: getInvoiceNumber(invoice),
    clientName: getClientName(invoice, clientsById),
    totalTTC,
    amountPaid,
    outstandingBalance: Math.max(0, Math.round((totalTTC - amountPaid + Number.EPSILON) * 100) / 100),
    status: getInvoiceStatus(invoice, totalTTC, amountPaid),
  }
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

function SummaryCard({ label, value, detail, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
    </article>
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
        <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
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

export default function Collections() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('open')
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [invoiceError, setInvoiceError] = useState('')
  const [clientError, setClientError] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [toast, setToast] = useState(null)
  const [todayStart] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.getTime()
  })

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

  const invoiceRows = useMemo(
    () => invoices.map((invoice) => getInvoiceRow(invoice, clientsById)),
    [clientsById, invoices],
  )

  const filteredInvoices = useMemo(() => {
    const queryText = normalizeSearch(search)
    const clientQuery = normalizeSearch(clientSearch)
    return invoiceRows
      .filter((invoice) => {
        if (statusFilter === 'open' && !['Validée / Non Payée', 'Paiement Partiel'].includes(invoice.status)) {
          return false
        }
        if (statusFilter === 'unpaid' && invoice.status !== 'Validée / Non Payée') {
          return false
        }
        if (statusFilter === 'partial' && invoice.status !== 'Paiement Partiel') {
          return false
        }
        if (statusFilter === 'draft' && invoice.status !== 'Brouillon') {
          return false
        }
        if (statusFilter === 'paid' && invoice.status !== 'Payée') {
          return false
        }
        if (statusFilter === 'cancelled' && invoice.status !== 'Annulée') {
          return false
        }
        if (queryText && !normalizeSearch(invoice.number).includes(queryText)) {
          return false
        }
        return !clientQuery || normalizeSearch(invoice.clientName).includes(clientQuery)
      })
      .sort((first, second) => {
        const firstDate = getDateValue(
          first.dateFacture || first.dateEmission || first.date,
        )?.getTime() || 0
        const secondDate = getDateValue(
          second.dateFacture || second.dateEmission || second.date,
        )?.getTime() || 0
        return secondDate - firstDate
      })
  }, [clientSearch, invoiceRows, search, statusFilter])

  const openInvoices = invoiceRows.filter((invoice) =>
    ['Validée / Non Payée', 'Paiement Partiel'].includes(invoice.status),
  )
  const totalOutstanding = openInvoices.reduce(
    (sum, invoice) => sum + invoice.outstandingBalance,
    0,
  )
  const partialCount = openInvoices.filter((invoice) => invoice.status === 'Paiement Partiel').length
  const overdueInvoices = openInvoices.filter((invoice) => {
    const dueDate = getDateValue(invoice.dateEcheance || invoice.dueDate)
    if (!dueDate || invoice.outstandingBalance <= 0 || !todayStart) {
      return false
    }
    const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime()
    return dueDay < todayStart
  })

  function showToast(type, message) {
    setToast({ type, message })
  }

  function handlePaymentSaved() {
    const invoiceNumber = selectedInvoice ? getInvoiceNumber(selectedInvoice) : 'La facture'
    setSelectedInvoice(null)
    showToast('success', `Paiement enregistré pour ${invoiceNumber}.`)
  }

  const isInitialLoading = isLoadingInvoices || (isLoadingClients && clients.length === 0)

  return (
    <div className="space-y-6">
      <Toast onClose={() => setToast(null)} toast={toast} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Cycle financier
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Recouvrement
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Suivez les règlements, les soldes clients et les échéances de vos factures.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
          <CreditCard aria-hidden="true" className="h-4 w-4" />
          {openInvoices.length} facture{openInvoices.length !== 1 ? 's' : ''} à suivre
        </div>
      </div>

      {invoiceError && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Le chargement des factures a échoué.</p>
            <p className="mt-1 break-words">{invoiceError}</p>
          </div>
        </div>
      )}
      {clientError && (
        <div
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Les noms des clients n’ont pas pu être chargés.</p>
            <p className="mt-1 break-words">{clientError}</p>
          </div>
        </div>
      )}

      <section aria-label="Indicateurs de recouvrement" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          detail={`${openInvoices.length} facture${openInvoices.length !== 1 ? 's' : ''} non soldée${openInvoices.length !== 1 ? 's' : ''}`}
          icon={Banknote}
          label="Reste total à recouvrer"
          tone="blue"
          value={formatCurrency(totalOutstanding)}
        />
        <SummaryCard
          detail={`${partialCount} règlement${partialCount !== 1 ? 's' : ''} déjà reçu${partialCount !== 1 ? 's' : ''}`}
          icon={CreditCard}
          label="Paiements partiels"
          tone="sky"
          value={String(partialCount)}
        />
        <SummaryCard
          detail="Selon la date d’échéance enregistrée"
          icon={Clock3}
          label="Factures en retard"
          tone="amber"
          value={String(overdueInvoices.length)}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-slate-900">Suivi des règlements</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredInvoices.length} résultat{filteredInvoices.length !== 1 ? 's' : ''}
              {statusFilter === 'open' ? ' · factures ouvertes par défaut' : ''}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(170px,1fr)_minmax(170px,1fr)_230px]">
            <label className="relative block">
              <span className="sr-only">Rechercher par numéro de facture</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="N° facture..."
                type="search"
                value={search}
              />
            </label>
            <label className="relative block">
              <span className="sr-only">Rechercher rapidement par client</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setClientSearch(event.target.value)}
                placeholder="Nom du client..."
                type="search"
                value={clientSearch}
              />
            </label>
            <label>
              <span className="sr-only">Filtrer les factures par statut</span>
              <select
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                {COLLECTION_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {isInitialLoading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center">
            <LoaderCircle aria-hidden="true" className="h-7 w-7 animate-spin text-blue-700" />
            <p className="text-sm text-slate-500">Chargement des factures...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <Banknote aria-hidden="true" className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {invoiceError ? 'Les factures sont indisponibles' : 'Aucune facture à afficher'}
            </h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
              {invoiceError
                ? 'Vérifiez votre connexion ou vos autorisations Firestore, puis réessayez.'
                : search || clientSearch
                  ? 'Aucune facture ne correspond à votre recherche.'
                  : statusFilter === 'open'
                    ? 'Aucune facture validée en attente de règlement ou avec un paiement partiel.'
                    : 'Aucune facture ne correspond à ce filtre.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">N° Facture</th>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5 text-right">Total TTC</th>
                  <th className="px-5 py-3.5 text-right">Progression</th>
                  <th className="px-5 py-3.5 text-right">Reste à payer</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                  const canReceivePayment = [
                    'Validée / Non Payée',
                    'Paiement Partiel',
                  ].includes(invoice.status)
                  const dueDate = getDateValue(invoice.dateEcheance || invoice.dueDate)
                  const isOverdue =
                    canReceivePayment &&
                    dueDate &&
                    invoice.outstandingBalance > 0 &&
                    todayStart > 0 &&
                    new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime() <
                      todayStart
                  const paidPercent =
                    invoice.totalTTC > 0
                      ? Math.min(100, Math.max(0, (invoice.amountPaid / invoice.totalTTC) * 100))
                      : 0
                  const progressColor =
                    paidPercent >= 100
                      ? 'bg-emerald-500'
                      : paidPercent > 0
                        ? 'bg-blue-600'
                        : 'bg-slate-300'

                  return (
                    <tr className="transition hover:bg-slate-50/80" key={invoice.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="font-mono text-sm font-semibold text-slate-900">
                          {invoice.number}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Échéance : {formatDate(invoice.dateEcheance || invoice.dueDate)}
                        </div>
                      </td>
                      <td className="max-w-[230px] px-5 py-4">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {invoice.clientName}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm tabular-nums text-slate-700">
                        {formatCurrency(invoice.totalTTC)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <div
                            aria-label={`Montant payé : ${paidPercent.toFixed(0)} %`}
                            aria-valuemax={100}
                            aria-valuemin={0}
                            aria-valuenow={paidPercent}
                            className="h-2.5 w-28 overflow-hidden rounded-full bg-slate-100"
                            role="progressbar"
                          >
                            <div
                              className={`h-full rounded-full transition-[width] duration-500 ${progressColor}`}
                              style={{ width: `${paidPercent}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-700">
                            {paidPercent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            invoice.outstandingBalance > 0 ? 'text-slate-900' : 'text-emerald-700'
                          }`}
                        >
                          {formatCurrency(invoice.outstandingBalance)}
                        </span>
                        {isOverdue && (
                          <span className="mt-1 block text-[11px] font-medium text-red-700">
                            Échéance dépassée
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        {canReceivePayment ? (
                          <button
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-800 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20"
                            onClick={() => setSelectedInvoice(invoice)}
                            type="button"
                          >
                            <Banknote aria-hidden="true" className="h-4 w-4" />
                            Ajouter un paiement
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedInvoice && (
        <PaymentModal
          clientName={selectedInvoice.clientName}
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSaved={handlePaymentSaved}
          outstandingBalance={selectedInvoice.outstandingBalance}
        />
      )}
    </div>
  )
}
