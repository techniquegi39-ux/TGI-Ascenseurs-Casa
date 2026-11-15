import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  ArrowRight,
  CircleDollarSign,
  FileText,
  PackageMinus,
  TrendingUp,
  Wallet,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../context/useAuth.js'
import { db } from '../firebase.js'

const DashboardCharts = lazy(() => import('../components/DashboardCharts.jsx'))

const INVOICE_OPEN_STATUSES = ['Validée / Non Payée', 'Paiement Partiel']
const INTERVENTION_STATUS_COLORS = {
  Terminée: '#10b981',
  'En cours': '#f59e0b',
  Planifiée: '#4682b4',
  Annulée: '#ef4444',
}

function getOptionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

function getInvoiceTotals(invoice) {
  const savedTotal = getOptionalNumber(
    invoice.totalTTC ?? invoice.totaux?.totalTTC ?? invoice.totaux?.totalTtc,
  )
  if (savedTotal !== undefined && savedTotal >= 0) {
    return { totalTTC: savedTotal }
  }

  const items = Array.isArray(invoice.items) ? invoice.items : []
  const totalTTC = items.reduce((sum, item) => {
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
  return { totalTTC }
}

function getAmountPaid(invoice) {
  const amountPaid = getOptionalNumber(invoice.amountPaid ?? invoice.montantPaye)
  return amountPaid === undefined ? 0 : Math.max(0, amountPaid)
}

function getInvoiceStatus(invoice) {
  const workflowStatus = normalizeText(invoice.workflowStatus)
  const paymentStatus = normalizeText(invoice.status || invoice.statut)

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

  const totalTTC = getInvoiceTotals(invoice).totalTTC
  const amountPaid = getAmountPaid(invoice)
  if (totalTTC > 0 && amountPaid >= totalTTC - 0.01) {
    return 'Payée'
  }
  if (amountPaid > 0) {
    return 'Paiement Partiel'
  }
  return 'Validée / Non Payée'
}

function getInterventionStatus(intervention) {
  const status = normalizeText(intervention.status || intervention.statut || 'Planifiée')
  if (status.includes('planifi')) {
    return 'Planifiée'
  }
  if (status.includes('cours') || status.includes('progress')) {
    return 'En cours'
  }
  if (status.includes('termin') || status.includes('compl')) {
    return 'Terminée'
  }
  if (status.includes('annul')) {
    return 'Annulée'
  }
  return String(intervention.status || intervention.statut || 'Planifiée')
}

function getInventoryStatus(item) {
  const rawQuantity = item.quantite ?? item.quantiteActuelle ?? item.quantity
  const rawThreshold = item.seuilAlerte ?? item.alertThreshold
  const quantity = getOptionalNumber(rawQuantity)
  const threshold = getOptionalNumber(rawThreshold)

  if (quantity === 0) {
    return 'Rupture de Stock'
  }
  if (
    quantity !== undefined &&
    threshold !== undefined &&
    quantity > 0 &&
    threshold >= 0 &&
    quantity <= threshold
  ) {
    return 'Stock Faible'
  }
  return 'En Stock'
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

function formatCurrency(value) {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MAD`
}

function formatDate(value) {
  const date = getDateValue(value)
  if (!date) {
    return 'Date non renseignée'
  }
  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value) {
  const date = getDateValue(value)
  if (!date) {
    return 'Date à confirmer'
  }
  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getInvoiceNumber(invoice) {
  return String(
    invoice.numero ||
      invoice.invoiceNumber ||
      (invoice.id ? `FAC-${invoice.id.slice(0, 7).toUpperCase()}` : 'Facture'),
  )
}

function getInvoiceClientName(invoice) {
  return String(invoice.clientName || invoice.client || 'Client non renseigné')
}

function getInterventionClientName(intervention) {
  return String(intervention.clientName || intervention.client || 'Client non renseigné')
}

function getInterventionDate(intervention) {
  return intervention.dateIntervention || intervention.dateHeure || intervention.date
}

function KpiCard({ label, value, detail, icon: Icon, tone }) {
  const tones = {
    blue: {
      icon: 'bg-blue-100 text-blue-800',
      glow: 'from-blue-100/80 via-white/0 to-transparent',
      border: 'hover:border-blue-200',
    },
    amber: {
      icon: 'bg-amber-100 text-amber-800',
      glow: 'from-amber-100/80 via-white/0 to-transparent',
      border: 'hover:border-amber-200',
    },
    indigo: {
      icon: 'bg-indigo-100 text-indigo-800',
      glow: 'from-indigo-100/80 via-white/0 to-transparent',
      border: 'hover:border-indigo-200',
    },
    rose: {
      icon: 'bg-rose-100 text-rose-800',
      glow: 'from-rose-100/80 via-white/0 to-transparent',
      border: 'hover:border-rose-200',
    },
  }[tone]

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm shadow-slate-900/5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${tones.border}`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tones.glow} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.7rem]">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tones.icon}`}>
          <Icon aria-hidden="true" className="h-6 w-6" />
        </span>
      </div>
    </article>
  )
}

function PanelSkeleton({ className = '' }) {
  return (
    <div
      aria-label="Chargement des données"
      className={`animate-pulse rounded-2xl border border-slate-200 bg-white p-5 ${className}`}
      role="status"
    >
      <span className="sr-only">Chargement...</span>
      <div className="h-4 w-40 rounded bg-slate-200" />
      <div className="mt-5 h-64 rounded-xl bg-slate-100" />
    </div>
  )
}

function ListSkeleton() {
  return (
    <div aria-label="Chargement de la liste" className="animate-pulse space-y-3" role="status">
      <span className="sr-only">Chargement...</span>
      {[0, 1, 2, 3].map((item) => (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3" key={item}>
          <div className="min-w-0 flex-1">
            <div className="h-3 w-28 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-40 max-w-full rounded bg-slate-100" />
          </div>
          <div className="h-4 w-20 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  )
}

function DashboardStatusPill({ status }) {
  const classes = {
    'Validée / Non Payée': 'bg-amber-50 text-amber-800',
    'Paiement Partiel': 'bg-sky-50 text-sky-800',
    Planifiée: 'bg-blue-50 text-blue-800',
    'En cours': 'bg-amber-50 text-amber-800',
  }[status] || 'bg-slate-100 text-slate-700'

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${classes}`}>
      {status}
    </span>
  )
}

export default function Dashboard() {
  const { userData, currentUser } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [interventions, setInterventions] = useState([])
  const [contracts, setContracts] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState({
    invoices: true,
    interventions: true,
    contracts: true,
    inventory: true,
  })
  const [errors, setErrors] = useState({})
  const [todayStart] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.getTime()
  })

  useEffect(() => {
    function subscribe(collectionName, key, setValue) {
      return onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          setValue(
            snapshot.docs.map((document) => ({
              ...document.data(),
              id: document.id,
            })),
          )
          setLoading((previous) => ({ ...previous, [key]: false }))
          setErrors((previous) => {
            if (!previous[key]) {
              return previous
            }
            const nextErrors = { ...previous }
            delete nextErrors[key]
            return nextErrors
          })
        },
        (error) => {
          setErrors((previous) => ({
            ...previous,
            [key]:
              error instanceof Error ? error.message : `Impossible de charger ${collectionName}.`,
          }))
          setLoading((previous) => ({ ...previous, [key]: false }))
        },
      )
    }

    const unsubscribers = [
      subscribe('invoices', 'invoices', setInvoices),
      subscribe('interventions', 'interventions', setInterventions),
      subscribe('contracts', 'contracts', setContracts),
      subscribe('inventory', 'inventory', setInventory),
    ]

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [])

  const invoiceStats = useMemo(() => {
    const paidAmount = invoices.reduce((sum, invoice) => sum + getAmountPaid(invoice), 0)
    const openInvoices = invoices
      .filter((invoice) => INVOICE_OPEN_STATUSES.includes(getInvoiceStatus(invoice)))
      .map((invoice) => {
        const totalTTC = getInvoiceTotals(invoice).totalTTC
        const amountPaid = getAmountPaid(invoice)
        return {
          ...invoice,
          status: getInvoiceStatus(invoice),
          totalTTC,
          amountPaid,
          outstandingBalance: Math.max(0, totalTTC - amountPaid),
        }
      })
    const outstandingAmount = openInvoices.reduce(
      (sum, invoice) => sum + invoice.outstandingBalance,
      0,
    )
    const paidCount = invoices.filter(
      (invoice) => getInvoiceStatus(invoice) === 'Payée',
    ).length

    return {
      paidAmount,
      openInvoices,
      outstandingAmount,
      paidCount,
    }
  }, [invoices])

  const activeInterventions = useMemo(
    () =>
      interventions.filter((intervention) =>
        ['Planifiée', 'En cours'].includes(getInterventionStatus(intervention)),
      ),
    [interventions],
  )

  const inventoryAlerts = useMemo(
    () =>
      inventory.filter((item) =>
        ['Rupture de Stock', 'Stock Faible'].includes(getInventoryStatus(item)),
      ),
    [inventory],
  )

  const invoiceChartData = useMemo(
    () => [
      {
        name: 'Payées',
        value: invoiceStats.paidCount,
      },
      {
        name: 'À recouvrer',
        value: invoiceStats.openInvoices.length,
      },
    ],
    [invoiceStats],
  )

  const interventionChartData = useMemo(() => {
    const statusCounts = new Map(
      ['Terminée', 'En cours', 'Planifiée', 'Annulée'].map((status) => [status, 0]),
    )
    for (const intervention of interventions) {
      const status = getInterventionStatus(intervention)
      if (statusCounts.has(status)) {
        statusCounts.set(status, statusCounts.get(status) + 1)
      }
    }
    return [...statusCounts].map(([name, value]) => ({
      name,
      value,
      fill: INTERVENTION_STATUS_COLORS[name],
    }))
  }, [interventions])

  const latestUnpaidInvoices = useMemo(
    () =>
      [...invoiceStats.openInvoices]
        .sort((first, second) => {
          const firstDate = getDateValue(
            first.dateFacture || first.dateEmission || first.date,
          )?.getTime() || 0
          const secondDate = getDateValue(
            second.dateFacture || second.dateEmission || second.date,
          )?.getTime() || 0
          return secondDate - firstDate
        })
        .slice(0, 5),
    [invoiceStats.openInvoices],
  )

  const upcomingInterventions = useMemo(
    () =>
      interventions
        .filter((intervention) => {
          if (getInterventionStatus(intervention) !== 'Planifiée') {
            return false
          }
          const date = getDateValue(
            intervention.dateIntervention || intervention.dateHeure || intervention.date,
          )
          return date !== null && date.getTime() >= todayStart
        })
        .sort((first, second) => {
          const firstDate = getDateValue(
            first.dateIntervention || first.dateHeure || first.date,
          )?.getTime() || 0
          const secondDate = getDateValue(
            second.dateIntervention || second.dateHeure || second.date,
          )?.getTime() || 0
          return firstDate - secondDate
        })
        .slice(0, 5),
    [interventions, todayStart],
  )

  const greetingName =
    userData?.nom || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Directeur'
  const isLoadingKpis = loading.invoices || loading.interventions || loading.inventory
  const isLoadingInvoices = loading.invoices
  const isLoadingInterventions = loading.interventions
  const interventionTotal = interventionChartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-4">
      <header className="relative overflow-hidden rounded-2xl border border-blue-900/10 bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 px-5 py-6 text-white shadow-lg shadow-blue-950/10 sm:px-7 sm:py-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[28px] border-white/[0.04]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 right-40 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              Centre de contrôle · TGI Manager Pro
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Bonjour {greetingName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">
              Voici la situation de votre activité : trésorerie, interventions et disponibilité du stock.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-blue-50 backdrop-blur">
              <FileText aria-hidden="true" className="h-3.5 w-3.5" />
              {loading.contracts ? 'Contrats…' : `${contracts.length} contrat${contracts.length === 1 ? '' : 's'} suivi${contracts.length === 1 ? '' : 's'}`}
            </span>
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-blue-900 transition hover:bg-blue-50"
              to="/collections"
            >
              Ouvrir le recouvrement
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {Object.keys(errors).length > 0 && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">Certaines données n’ont pas pu être actualisées.</p>
            <ul className="mt-1 space-y-1">
              {Object.entries(errors).map(([collectionName, error]) => (
                <li className="break-words" key={collectionName}>
                  <span className="font-medium">{collectionName} :</span> {error}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoadingKpis ? (
          [0, 1, 2, 3].map((item) => (
            <div
              aria-label="Chargement de l’indicateur"
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white/80 p-5"
              key={item}
              role="status"
            >
              <span className="sr-only">Chargement...</span>
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-5 h-7 w-40 rounded bg-slate-100" />
              <div className="mt-3 h-3 w-28 rounded bg-slate-100" />
            </div>
          ))
        ) : (
          <>
            <KpiCard
              detail="Montants payés enregistrés sur les factures"
              icon={TrendingUp}
              label="Chiffre d’affaires encaissé"
              tone="blue"
              value={formatCurrency(invoiceStats.paidAmount)}
            />
            <KpiCard
              detail="Factures validées, impayées ou en paiement partiel"
              icon={AlertCircle}
              label="Reste à recouvrer"
              tone="amber"
              value={formatCurrency(invoiceStats.outstandingAmount)}
            />
            <KpiCard
              detail={`${activeInterventions.filter((item) => getInterventionStatus(item) === 'Planifiée').length} planifiée(s) · ${activeInterventions.filter((item) => getInterventionStatus(item) === 'En cours').length} en cours`}
              icon={Wrench}
              label="Interventions actives"
              tone="indigo"
              value={String(activeInterventions.length)}
            />
            <KpiCard
              detail="Articles au seuil minimum ou en rupture"
              icon={PackageMinus}
              label="Alertes stock"
              tone="rose"
              value={String(inventoryAlerts.length)}
            />
          </>
        )}
      </section>

      <section aria-label="Analyses" className="grid gap-5 xl:grid-cols-2">
        {loading.invoices || loading.interventions ? (
          <>
            <PanelSkeleton />
            <PanelSkeleton />
          </>
        ) : (
          <Suspense
            fallback={
              <>
                <PanelSkeleton />
                <PanelSkeleton />
              </>
            }
          >
            <DashboardCharts
              invoiceChartData={invoiceChartData}
              invoiceCount={invoices.length}
              interventionChartData={interventionChartData}
              interventionTotal={interventionTotal}
            />
          </Suspense>
        )}
      </section>

      <section aria-label="Actions rapides" className="grid gap-5 xl:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
                <Wallet aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Dernières factures impayées
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {invoiceStats.openInvoices.length} facture(s) à suivre
                </p>
              </div>
            </div>
            <Link
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
              to="/collections"
            >
              Tout voir
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5 p-4 sm:p-5">
            {isLoadingInvoices ? (
              <ListSkeleton />
            ) : latestUnpaidInvoices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <CircleDollarSign aria-hidden="true" className="mx-auto h-7 w-7 text-emerald-500" />
                <p className="mt-2 text-sm font-medium text-slate-700">Aucune facture à recouvrer</p>
                <p className="mt-1 text-xs text-slate-500">Les paiements en attente apparaîtront ici.</p>
              </div>
            ) : (
              latestUnpaidInvoices.map((invoice) => (
                <Link
                  className="flex items-center justify-between gap-3 rounded-xl border border-transparent bg-slate-50/80 p-3 transition hover:border-blue-100 hover:bg-blue-50/50"
                  key={invoice.id}
                  to="/collections"
                >
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {getInvoiceNumber(invoice)}
                      </span>
                      <DashboardStatusPill status={invoice.status} />
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {getInvoiceClientName(invoice)} · Échéance {formatDate(invoice.dateEcheance || invoice.dueDate)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums text-slate-900">
                      {formatCurrency(invoice.outstandingBalance)}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                      Recouvrer
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <CalendarClock aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Prochaines interventions</h2>
                <p className="mt-0.5 text-xs text-slate-500">Interventions planifiées à venir</p>
              </div>
            </div>
            <Link
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
              to="/interventions"
            >
              Tout voir
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5 p-4 sm:p-5">
            {isLoadingInterventions ? (
              <ListSkeleton />
            ) : upcomingInterventions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <CalendarDays aria-hidden="true" className="mx-auto h-7 w-7 text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Aucune intervention planifiée à venir
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Les prochaines interventions apparaîtront ici.
                </p>
              </div>
            ) : (
              upcomingInterventions.map((intervention) => (
                <Link
                  className="flex items-center justify-between gap-3 rounded-xl border border-transparent bg-slate-50/80 p-3 transition hover:border-blue-100 hover:bg-blue-50/50"
                  key={intervention.id}
                  to="/interventions"
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-blue-700 shadow-sm">
                      <Wrench aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-slate-900">
                        {intervention.numero || intervention.reference || 'Intervention'}
                        {intervention.type ? ` · ${intervention.type}` : ''}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        {getInterventionClientName(intervention)}
                        {intervention.technicien ? ` · ${intervention.technicien}` : ''}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-semibold text-slate-800">
                      {formatDateTime(getInterventionDate(intervention))}
                    </span>
                    <span className="mt-1 block">
                      <DashboardStatusPill status="Planifiée" />
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
