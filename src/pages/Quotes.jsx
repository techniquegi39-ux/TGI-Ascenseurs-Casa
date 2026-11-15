import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Download,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { collection, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore'
import QuoteForm from '../components/QuoteForm.jsx'
import { db } from '../firebase.js'

const QUOTE_STATUSES = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé']

function getQuoteNumber(quote) {
  return String(
    quote.numero ||
      quote.quoteNumber ||
      (quote.id ? `DEV-${quote.id.slice(0, 7).toUpperCase()}` : 'Sans numéro'),
  )
}

function getClientId(quote) {
  return String(quote.clientId || '')
}

function getClientName(client) {
  return String(client?.nom || client?.raisonSociale || client?.name || 'Client non renseigné')
}

function getQuoteClientName(quote, clientsById) {
  return getClientName(
    clientsById.get(getClientId(quote)) || {
      nom: quote.clientName || quote.client || 'Client non renseigné',
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

function normalizeTaxRate(value) {
  const rate = Number(String(value ?? 0).replace('%', '').trim())
  return Number.isFinite(rate) ? rate : 0
}

function getOptionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function getNormalizedItems(quote) {
  if (!Array.isArray(quote.items)) {
    return []
  }

  return quote.items.map((item) => {
    const quantity = Number(item.quantity ?? item.quantite ?? 0)
    const unitPrice = Number(item.unitPrice ?? item.prixUnitaire ?? item.puHT ?? 0)
    const taxRate = normalizeTaxRate(item.taxRate ?? item.tauxTVA ?? item.tva)
    const totalHTValue = getOptionalNumber(item.totalHT ?? item.totalHt)
    const totalHT = totalHTValue !== undefined
      ? totalHTValue
      : Number.isFinite(quantity) && Number.isFinite(unitPrice)
        ? quantity * unitPrice
        : 0
    const totalTVAValue = getOptionalNumber(item.totalTVA ?? item.totalTva)
    const totalTVA = totalTVAValue !== undefined
      ? totalTVAValue
      : totalHT * (taxRate / 100)

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

function getQuoteTotals(quote) {
  const items = getNormalizedItems(quote)
  const computed = items.reduce(
    (sum, item) => ({
      totalHT: sum.totalHT + item.totalHT,
      totalTVA: sum.totalTVA + item.totalTVA,
      totalTTC: sum.totalTTC + item.totalTTC,
    }),
    { totalHT: 0, totalTVA: 0, totalTTC: 0 },
  )
  const totalHT = getOptionalNumber(quote.totalHT ?? quote.totaux?.totalHT)
  const totalTVA = getOptionalNumber(
    quote.totalTVA ?? quote.totaux?.totalTVA ?? quote.totaux?.totalTva,
  )
  const totalTTC = getOptionalNumber(
    quote.totalTTC ?? quote.totaux?.totalTTC ?? quote.totaux?.totalTtc,
  )

  return {
    totalHT: totalHT ?? computed.totalHT,
    totalTVA: totalTVA ?? computed.totalTVA,
    totalTTC: totalTTC ?? computed.totalTTC,
  }
}

function getQuoteStatus(quote) {
  const rawStatus = String(quote.status || quote.statut || QUOTE_STATUSES[0]).trim()
  const normalized = rawStatus.toLocaleLowerCase('fr-FR')
  if (normalized.includes('brouillon') || normalized.includes('draft')) {
    return 'Brouillon'
  }
  if (normalized.includes('envoy') || normalized.includes('sent')) {
    return 'Envoyé'
  }
  if (normalized.includes('accept')) {
    return 'Accepté'
  }
  if (normalized.includes('refus') || normalized.includes('rejected')) {
    return 'Refusé'
  }
  return rawStatus
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
    Envoyé: {
      badge: 'bg-blue-50 text-blue-800 ring-blue-600/20',
      dot: 'bg-blue-500',
    },
    Accepté: {
      badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
      dot: 'bg-emerald-500',
    },
    Refusé: {
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
        <FileText aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
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

function getCompanyInfo(settings = {}, defaults = {}) {
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(settings).filter(([, value]) => typeof value === 'string'),
    ),
  }
}

export default function Quotes() {
  const [quotes, setQuotes] = useState([])
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [quoteError, setQuoteError] = useState('')
  const [clientError, setClientError] = useState('')
  const [modalQuote, setModalQuote] = useState(undefined)
  const [exportingId, setExportingId] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'quotes'),
      (snapshot) => {
        setQuotes(
          snapshot.docs.map((quoteDocument) => ({
            ...quoteDocument.data(),
            id: quoteDocument.id,
          })),
        )
        setQuoteError('')
        setIsLoadingQuotes(false)
      },
      (error) => {
        setQuoteError(error instanceof Error ? error.message : 'Impossible de charger les devis.')
        setIsLoadingQuotes(false)
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
        setClientError(error instanceof Error ? error.message : 'Impossible de charger les clients.')
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

  const filteredQuotes = useMemo(() => {
    const queryText = normalizeSearch(search)
    return quotes
      .filter((quote) => {
        if (statusFilter !== 'Tous' && getQuoteStatus(quote) !== statusFilter) {
          return false
        }
        if (!queryText) {
          return true
        }
        return [
          getQuoteNumber(quote),
          getQuoteClientName(quote, clientsById),
          getQuoteStatus(quote),
          quote.notes,
          ...getNormalizedItems(quote).map((item) => item.designation),
        ].some((value) => normalizeSearch(value || '').includes(queryText))
      })
      .sort((first, second) => {
        const firstDate = getDateValue(first.dateEmission || first.date)?.getTime() || 0
        const secondDate = getDateValue(second.dateEmission || second.date)?.getTime() || 0
        return secondDate - firstDate
      })
  }, [clientsById, quotes, search, statusFilter])

  const draftCount = quotes.filter((quote) => getQuoteStatus(quote) === 'Brouillon').length
  const sentCount = quotes.filter((quote) => getQuoteStatus(quote) === 'Envoyé').length
  const acceptedCount = quotes.filter((quote) => getQuoteStatus(quote) === 'Accepté').length

  function showToast(type, message) {
    setToast({ type, message })
  }

  function handleSaved(action) {
    setModalQuote(undefined)
    showToast('success', action === 'updated' ? 'Le devis a été modifié.' : 'Le devis a été créé.')
  }

  async function handleDelete(quote) {
    const number = getQuoteNumber(quote)
    if (!window.confirm(`Supprimer définitivement le devis « ${number} » ?`)) {
      return
    }
    try {
      await deleteDoc(doc(db, 'quotes', quote.id))
      showToast('success', 'Le devis a été supprimé.')
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `Suppression impossible : ${error.message}`
          : 'Suppression impossible. Veuillez réessayer.',
      )
    }
  }

  async function handleExport(quote) {
    setExportingId(quote.id)
    try {
      const settingsSnapshot = await getDoc(doc(db, 'settings', 'company'))
      const { PDF_COMPANY_INFO, generatePremiumPDF } = await import('../utils/pdfEngine.js')
      const companyInfo = getCompanyInfo(
        settingsSnapshot.exists() ? settingsSnapshot.data() : {},
        PDF_COMPANY_INFO,
      )
      const client = clientsById.get(getClientId(quote))
      const items = getNormalizedItems(quote)
      const totals = getQuoteTotals(quote)
      const notes = [
        `Date de validité : ${formatDate(quote.dateValidite || quote.validUntil)}`,
        `Statut : ${getQuoteStatus(quote)}`,
        quote.conditionsPaiement
          ? `Conditions de paiement : ${quote.conditionsPaiement}`
          : '',
        quote.notes || '',
      ]
        .filter(Boolean)
        .join('\n\n')

      await generatePremiumPDF({
        typeDocument: 'Devis',
        numero: getQuoteNumber(quote),
        date: quote.dateEmission || quote.date || new Date(),
        clientInfo: {
          nom: getQuoteClientName(quote, clientsById),
          adresse: String(client?.adresse || client?.address || '—'),
          ice: String(client?.ice || client?.identifiantFiscal || '—'),
        },
        items: items.map((item) => ({
          designation: item.designation,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          totalHT: item.totalHT,
        })),
        totaux: {
          totalHT: totals.totalHT,
          totalTVA: totals.totalTVA,
          totalTTC: totals.totalTTC,
        },
        notes,
        companyInfo,
      })
      showToast('success', 'Le devis PDF a été généré.')
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

  const isLoading = isLoadingQuotes || isLoadingClients

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <Toast onClose={() => setToast(null)} toast={toast} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <FileText aria-hidden="true" className="h-4 w-4" />
            Cycle commercial
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Devis
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Préparez vos offres, suivez leur statut et partagez-les en PDF.
          </p>
        </div>
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:w-auto"
          onClick={() => setModalQuote(null)}
          type="button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Nouveau devis
        </button>
      </header>

      <section aria-label="Synthèse des devis" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Devis enregistrés</p>
            <FileText aria-hidden="true" className="h-4 w-4 text-blue-700" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {quotes.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Brouillons</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-700">{draftCount}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Envoyés</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-blue-800">{sentCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Acceptés</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-700">
            {acceptedCount}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">Registre des devis</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredQuotes.length} devis{filteredQuotes.length === 1 ? '' : ''}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(15rem,1fr)_12rem] sm:items-center sm:w-[min(100%,34rem)]">
            <label className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Rechercher un devis"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="N° de devis, client..."
                type="search"
                value={search}
              />
            </label>
            <label>
              <span className="sr-only">Filtrer par statut</span>
              <select
                aria-label="Filtrer par statut"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="Tous">Tous les statuts</option>
                {QUOTE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {quoteError && (
          <div
            className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chargement des devis impossible : {quoteError}</span>
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
            <p className="mt-3 text-sm text-slate-500">Chargement des devis...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <FileText aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search || statusFilter !== 'Tous'
                ? 'Aucun devis ne correspond aux filtres'
                : 'Aucun devis pour le moment'}
            </h3>
            <p className="mt-1 max-w-md text-sm leading-5 text-slate-500">
              {search || statusFilter !== 'Tous'
                ? 'Modifiez la recherche ou le filtre pour afficher d’autres devis.'
                : 'Créez un devis pour formaliser une offre commerciale.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    N° Devis
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total HT
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total TTC
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Statut
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((quote) => {
                  const number = getQuoteNumber(quote)
                  const totals = getQuoteTotals(quote)
                  const isExporting = exportingId === quote.id

                  return (
                    <tr className="transition hover:bg-slate-50/70" key={quote.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {number}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(quote.dateEmission || quote.date)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm font-semibold text-slate-900">
                          {getQuoteClientName(quote, clientsById)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-slate-700">
                        {formatCurrency(totals.totalHT)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(totals.totalTTC)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={getQuoteStatus(quote)} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={`Exporter le devis ${number} en PDF`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-wait disabled:opacity-50"
                            disabled={Boolean(exportingId)}
                            onClick={() => void handleExport(quote)}
                            title="Exporter le devis en PDF"
                            type="button"
                          >
                            {isExporting ? (
                              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download aria-hidden="true" className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            aria-label={`Modifier le devis ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            onClick={() => setModalQuote(quote)}
                            title="Modifier le devis"
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            aria-label={`Supprimer le devis ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                            onClick={() => void handleDelete(quote)}
                            title="Supprimer le devis"
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

      {modalQuote !== undefined && (
        <QuoteForm
          onClose={() => setModalQuote(undefined)}
          onSaved={handleSaved}
          quote={modalQuote}
        />
      )}
    </div>
  )
}
