import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { collection, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore'
import PurchaseOrderForm from '../components/PurchaseOrderForm.jsx'
import { db } from '../firebase.js'

const PURCHASE_ORDER_STATUSES = [
  'Brouillon',
  'Envoyé au fournisseur',
  'Réceptionné',
  'Annulé',
]

function getOrderNumber(order) {
  return String(
    order.numero ||
      order.orderNumber ||
      (order.id ? `BC-${order.id.slice(0, 7).toUpperCase()}` : 'Sans numéro'),
  )
}

function getSupplierName(order) {
  return String(order.fournisseur || order.supplierName || order.supplier || 'Fournisseur non renseigné')
}

function getExpectedDeliveryDate(order) {
  return (
    order.dateLivraisonPrevue ||
    order.expectedDeliveryDate ||
    order.expectedDelivery ||
    order.deliveryDate
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

function normalizeTaxRate(value) {
  const rate = Number(String(value ?? 0).replace('%', '').trim())
  return Number.isFinite(rate) ? rate : 0
}

function getOrderItems(order) {
  if (!Array.isArray(order.items)) {
    return []
  }

  return order.items.map((item) => {
    const quantity = Number(item.quantity ?? item.quantite ?? 0)
    const unitPrice = Number(
      item.unitPrice ?? item.prixUnitaireAchatHT ?? item.prixUnitaire ?? item.puHT ?? 0,
    )
    const taxRate = normalizeTaxRate(item.taxRate ?? item.tauxTVA ?? item.tva)
    const totalHT =
      getOptionalNumber(item.totalHT ?? item.totalHt) ??
      (Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : 0)
    const totalTVA =
      getOptionalNumber(item.totalTVA ?? item.totalTva) ?? totalHT * (taxRate / 100)

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

function getOrderTotals(order) {
  const items = getOrderItems(order)
  const computed = items.reduce(
    (sum, item) => ({
      totalHT: sum.totalHT + item.totalHT,
      totalTVA: sum.totalTVA + item.totalTVA,
      totalTTC: sum.totalTTC + item.totalTTC,
    }),
    { totalHT: 0, totalTVA: 0, totalTTC: 0 },
  )
  const totalHT = getOptionalNumber(order.totalHT ?? order.totaux?.totalHT)
  const totalTVA = getOptionalNumber(
    order.totalTVA ?? order.totaux?.totalTVA ?? order.totaux?.totalTva,
  )
  const totalTTC = getOptionalNumber(
    order.totalTTC ?? order.totaux?.totalTTC ?? order.totaux?.totalTtc,
  )

  return {
    totalHT: totalHT ?? computed.totalHT,
    totalTVA: totalTVA ?? computed.totalTVA,
    totalTTC: totalTTC ?? computed.totalTTC,
  }
}

function getOrderStatus(order) {
  const rawStatus = String(order.status || order.statut || PURCHASE_ORDER_STATUSES[0]).trim()
  const normalized = rawStatus
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')

  if (normalized.includes('brouillon') || normalized.includes('draft')) {
    return 'Brouillon'
  }
  if (normalized.includes('annul') || normalized.includes('cancel')) {
    return 'Annulé'
  }
  if (
    normalized.includes('attente') ||
    normalized.includes('pending') ||
    normalized.includes('awaiting') ||
    normalized.includes('non reception') ||
    normalized.includes('receptionner') ||
    normalized.includes('en cours de reception') ||
    normalized.includes('reception en cours')
  ) {
    return 'Envoyé au fournisseur'
  }
  if (normalized.includes('envoy') || normalized.includes('sent')) {
    return 'Envoyé au fournisseur'
  }
  if (normalized.includes('reception') || normalized.includes('received')) {
    return 'Réceptionné'
  }
  return rawStatus
}

function isAwaitingReceipt(order) {
  const status = normalizeSearch(getOrderStatus(order))
  return [
    'envoy',
    'attente',
    'pending',
    'sent',
    'awaiting',
    'en cours',
    'transit',
  ].some((term) => status.includes(term))
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MAD`
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-MA')
    .trim()
}

function SortableHeader({ field, label, sortBy, sortDirection, onSort, alignRight = false }) {
  const isActive = sortBy === field

  return (
    <th
      aria-sort={isActive ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        alignRight ? 'text-right' : 'text-left'
      }`}
    >
      <button
        className={`inline-flex items-center gap-1.5 transition hover:text-blue-800 ${
          alignRight ? 'justify-end' : ''
        }`}
        onClick={() => onSort(field)}
        type="button"
      >
        {label}
        <ArrowUpDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`}
        />
      </button>
    </th>
  )
}

function StatusBadge({ status }) {
  const styles = {
    Brouillon: {
      badge: 'bg-slate-100 text-slate-700 ring-slate-500/15',
      dot: 'bg-slate-400',
    },
    'Envoyé au fournisseur': {
      badge: 'bg-blue-50 text-blue-800 ring-blue-600/20',
      dot: 'bg-blue-500',
    },
    Réceptionné: {
      badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
      dot: 'bg-emerald-500',
    },
    Annulé: {
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
        <ShoppingCart aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
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

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [sortBy, setSortBy] = useState('orderDate')
  const [sortDirection, setSortDirection] = useState('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [orderError, setOrderError] = useState('')
  const [modalOrder, setModalOrder] = useState(undefined)
  const [exportingId, setExportingId] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'purchase_orders'),
      (snapshot) => {
        setPurchaseOrders(
          snapshot.docs.map((orderDocument) => ({
            ...orderDocument.data(),
            id: orderDocument.id,
          })),
        )
        setOrderError('')
        setIsLoading(false)
      },
      (error) => {
        setOrderError(
          error instanceof Error ? error.message : 'Impossible de charger les bons de commande.',
        )
        setIsLoading(false)
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

  const filteredOrders = useMemo(() => {
    const queryText = normalizeSearch(search)
    return purchaseOrders
      .filter((order) => {
        if (statusFilter !== 'Tous' && getOrderStatus(order) !== statusFilter) {
          return false
        }
        if (!queryText) {
          return true
        }
        return [getOrderNumber(order), getSupplierName(order)].some((value) =>
          normalizeSearch(value).includes(queryText),
        )
      })
      .sort((first, second) => {
        const direction = sortDirection === 'asc' ? 1 : -1
        let comparison

        if (sortBy === 'totalTTC') {
          comparison = getOrderTotals(first).totalTTC - getOrderTotals(second).totalTTC
        } else if (sortBy === 'deliveryDate') {
          const firstDate = getDateValue(getExpectedDeliveryDate(first))?.getTime() || 0
          const secondDate = getDateValue(getExpectedDeliveryDate(second))?.getTime() || 0
          comparison = firstDate - secondDate
        } else {
          const firstDate = getDateValue(
            first.dateCommande || first.orderDate || first.date,
          )?.getTime() || 0
          const secondDate = getDateValue(
            second.dateCommande || second.orderDate || second.date,
          )?.getTime() || 0
          comparison = firstDate - secondDate
        }

        if (comparison === 0) {
          comparison = getOrderNumber(first).localeCompare(getOrderNumber(second), 'fr', {
            sensitivity: 'base',
          })
        }
        return comparison * direction
      })
  }, [purchaseOrders, search, sortBy, sortDirection, statusFilter])

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const draftCount = purchaseOrders.filter(
    (order) => getOrderStatus(order) === 'Brouillon',
  ).length
  const sentCount = purchaseOrders.filter(
    (order) => getOrderStatus(order) === 'Envoyé au fournisseur',
  ).length
  const receivedCount = purchaseOrders.filter(
    (order) => getOrderStatus(order) === 'Réceptionné',
  ).length

  function showToast(type, message) {
    setToast({ type, message })
  }

  function handleSort(field) {
    if (sortBy === field) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(field)
    setSortDirection(field === 'orderDate' ? 'desc' : 'asc')
  }

  function handleSaved(action) {
    setModalOrder(undefined)
    showToast(
      'success',
      action === 'updated'
        ? 'Le bon de commande a été modifié.'
        : 'Le bon de commande a été créé.',
    )
  }

  async function handleDelete(order) {
    const number = getOrderNumber(order)
    if (!window.confirm(`Supprimer définitivement le bon de commande « ${number} » ?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'purchase_orders', order.id))
      showToast('success', 'Le bon de commande a été supprimé.')
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `Suppression impossible : ${error.message}`
          : 'Suppression impossible. Veuillez réessayer.',
      )
    }
  }

  async function handleExport(order) {
    setExportingId(order.id)

    try {
      const settingsSnapshot = await getDoc(doc(db, 'settings', 'company'))
      const { PDF_COMPANY_INFO, generatePremiumPDF } = await import('../utils/pdfEngine.js')
      const companyInfo = getCompanyInfo(
        settingsSnapshot.exists() ? settingsSnapshot.data() : {},
        PDF_COMPANY_INFO,
      )
      const items = getOrderItems(order)
      const totals = getOrderTotals(order)
      const notes = [
        `Date de livraison espérée : ${formatDate(
          order.dateLivraisonPrevue || order.expectedDeliveryDate,
        )}`,
        `Statut : ${getOrderStatus(order)}`,
        order.instructionsLivraison || order.deliveryInstructions
          ? `Instructions de livraison : ${order.instructionsLivraison || order.deliveryInstructions}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n')

      await generatePremiumPDF({
        typeDocument: 'BON DE COMMANDE',
        numero: getOrderNumber(order),
        date: order.dateCommande || order.orderDate || order.date || new Date(),
        clientInfo: {
          nom: getSupplierName(order),
          adresse: String(order.adresseFournisseur || order.supplierAddress || '—'),
          ice: String(order.iceFournisseur || order.supplierIce || '—'),
        },
        items: items.map((item) => ({
          designation: item.designation,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tva: item.taxRate,
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
      showToast('success', 'Le bon de commande PDF a été généré.')
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

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <Toast onClose={() => setToast(null)} toast={toast} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <ShoppingCart aria-hidden="true" className="h-4 w-4" />
            Logistique & approvisionnement
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Bons de Commande
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Préparez les commandes fournisseurs et exportez les bons au format PDF.
          </p>
        </div>
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:w-auto"
          onClick={() => setModalOrder(null)}
          type="button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Nouveau bon de commande
        </button>
      </header>

      <section
        aria-label="Synthèse des bons de commande"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Bons enregistrés</p>
            <ShoppingCart aria-hidden="true" className="h-4 w-4 text-blue-700" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {purchaseOrders.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Brouillons</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-700">{draftCount}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Envoyés au fournisseur</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-blue-800">{sentCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Réceptionnés</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-700">
            {receivedCount}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">Registre des commandes</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredOrders.length} bon{filteredOrders.length === 1 ? '' : 's'} affiché
              {filteredOrders.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(15rem,1fr)_12rem] sm:items-center sm:w-[min(100%,34rem)]">
            <label className="relative block">
              <span className="sr-only">Rechercher un bon de commande ou un fournisseur</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="N° BC, fournisseur..."
                type="search"
                value={search}
              />
            </label>
            <label>
              <span className="sr-only">Filtrer les bons de commande par statut</span>
              <select
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="Tous">Tous les statuts</option>
                {PURCHASE_ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {orderError && (
          <div
            className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chargement des bons de commande impossible : {orderError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12">
            <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin text-blue-700" />
            <p className="mt-3 text-sm text-slate-500">Chargement des bons de commande...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <ShoppingCart aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search || statusFilter !== 'Tous'
                ? 'Aucun bon de commande ne correspond aux filtres'
                : 'Aucun bon de commande pour le moment'}
            </h3>
            <p className="mt-1 max-w-md text-sm leading-5 text-slate-500">
              {search || statusFilter !== 'Tous'
                ? 'Modifiez la recherche ou le filtre pour afficher d’autres commandes.'
                : 'Créez un bon de commande pour préparer un réapprovisionnement fournisseur.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    N° BC
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fournisseur
                  </th>
                  <SortableHeader
                    field="deliveryDate"
                    label="Livraison prévue"
                    onSort={handleSort}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                  />
                  <SortableHeader
                    alignRight
                    field="totalTTC"
                    label="Total TTC"
                    onSort={handleSort}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                  />
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Statut
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const number = getOrderNumber(order)
                  const totals = getOrderTotals(order)
                  const isExporting = exportingId === order.id
                  const expectedDeliveryDate = getExpectedDeliveryDate(order)
                  const deliveryDay = getDateValue(expectedDeliveryDate)
                  const isSupplierLate =
                    isAwaitingReceipt(order) &&
                    deliveryDay !== null &&
                    new Date(
                      deliveryDay.getFullYear(),
                      deliveryDay.getMonth(),
                      deliveryDay.getDate(),
                    ).getTime() < todayStart.getTime()

                  return (
                    <tr className="transition hover:bg-slate-50/70" key={order.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {number}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(order.dateCommande || order.orderDate || order.date)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm font-semibold text-slate-900">
                          {getSupplierName(order)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          {formatDate(expectedDeliveryDate)}
                          {isSupplierLate && (
                            <span
                              aria-label="Retard fournisseur : date de livraison dépassée"
                              className="inline-flex text-red-600"
                              title="Retard fournisseur : la date de livraison espérée est dépassée."
                            >
                              <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(totals.totalTTC)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={getOrderStatus(order)} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={`Exporter le bon de commande ${number} en PDF`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-wait disabled:opacity-50"
                            disabled={Boolean(exportingId)}
                            onClick={() => void handleExport(order)}
                            title="Exporter le bon de commande en PDF"
                            type="button"
                          >
                            {isExporting ? (
                              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download aria-hidden="true" className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            aria-label={`Modifier le bon de commande ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            onClick={() => setModalOrder(order)}
                            title="Modifier le bon de commande"
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            aria-label={`Supprimer le bon de commande ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                            onClick={() => void handleDelete(order)}
                            title="Supprimer le bon de commande"
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

      {modalOrder !== undefined && (
        <PurchaseOrderForm
          onClose={() => setModalOrder(undefined)}
          onSaved={handleSaved}
          purchaseOrder={modalOrder}
        />
      )}
    </div>
  )
}
