import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Banknote,
  CalendarCheck2,
  FileBarChart2,
  LoaderCircle,
  ReceiptText,
} from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import TablePdfExportButton from '../components/TablePdfExportButton.jsx'
import { db } from '../firebase.js'

function toDate(value) {
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

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getInvoiceTotal(invoice) {
  const explicitTotal =
    invoice.totalTTC ??
    invoice.totaux?.totalTTC ??
    invoice.totaux?.totalTtc ??
    invoice.totals?.totalTTC
  if (explicitTotal !== undefined && explicitTotal !== null && explicitTotal !== '') {
    const parsedTotal = Number(explicitTotal)
    return Number.isFinite(parsedTotal) ? Math.max(0, parsedTotal) : 0
  }

  if (!Array.isArray(invoice.items)) {
    return 0
  }

  return invoice.items.reduce((total, item) => {
    const explicitLineTotal = Number(item.totalTTC ?? item.totalTtc)
    if (Number.isFinite(explicitLineTotal) && (item.totalTTC ?? item.totalTtc) !== undefined) {
      return total + Math.max(0, explicitLineTotal)
    }

    const quantity = Number(item.quantity ?? item.quantite ?? 0)
    const unitPrice = Number(item.unitPrice ?? item.prixUnitaire ?? item.puHT ?? 0)
    const taxRate = Number(String(item.taxRate ?? item.tauxTVA ?? item.tva ?? 0).replace('%', ''))
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      return total
    }
    return total + Math.max(0, quantity * unitPrice * (1 + (Number.isFinite(taxRate) ? taxRate : 0) / 100))
  }, 0)
}

function getInvoiceStatus(invoice) {
  return normalizeText(invoice.status || invoice.statut || invoice.workflowStatus)
}

function getAmountPaid(invoice, total) {
  const explicitAmount = invoice.montantPaye ?? invoice.amountPaid
  if (explicitAmount !== undefined && explicitAmount !== null && explicitAmount !== '') {
    const amount = Number(explicitAmount)
    return Number.isFinite(amount) ? Math.min(total, Math.max(0, amount)) : 0
  }
  const status = getInvoiceStatus(invoice)
  return status.includes('payee') && !status.includes('non pay') && !status.includes('partiel')
    ? total
    : 0
}

function isCountableInvoice(invoice) {
  const status = getInvoiceStatus(invoice)
  return !status.includes('annul') && !status.includes('brouillon') && !status.includes('draft')
}

function getInvoiceDate(invoice) {
  return toDate(invoice.dateFacture || invoice.dateEmission || invoice.date || invoice.createdAt)
}

function getInterventionDate(intervention) {
  return toDate(
    intervention.dateIntervention || intervention.dateHeure || intervention.date || intervention.createdAt,
  )
}

function isCompleted(intervention) {
  const status = normalizeText(intervention.status || intervention.statut)
  return status.includes('termin') || status.includes('compl')
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MAD`
}

function getMonthlyData(invoices, now) {
  const months = []
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('fr-MA', { month: 'short', year: '2-digit' }).format(date),
      factures: 0,
      impayes: 0,
    })
  }

  const monthByKey = new Map(months.map((month) => [month.key, month]))
  for (const invoice of invoices) {
    if (!isCountableInvoice(invoice)) {
      continue
    }
    const date = getInvoiceDate(invoice)
    if (!date) {
      continue
    }
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const month = monthByKey.get(key)
    if (!month) {
      continue
    }
    const total = getInvoiceTotal(invoice)
    month.factures += total
    month.impayes += Math.max(0, total - getAmountPaid(invoice, total))
  }

  return months
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat('fr-MA', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function MetricCard({ label, value, detail, icon: Icon, tone }) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-800 ring-blue-700/10',
    amber: 'bg-amber-50 text-amber-800 ring-amber-700/10',
    emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-700/10',
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${toneClasses[tone]}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}

export default function Reports() {
  const [invoices, setInvoices] = useState([])
  const [interventions, setInterventions] = useState([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [interventionsLoading, setInterventionsLoading] = useState(true)
  const [error, setError] = useState('')
  const [now] = useState(() => new Date())

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
        setInvoicesLoading(false)
      },
      (snapshotError) => {
        console.error('Erreur lors du chargement des factures pour les rapports :', snapshotError)
        setError((current) =>
          current || (snapshotError instanceof Error ? snapshotError.message : 'Factures indisponibles.'),
        )
        setInvoicesLoading(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'interventions'),
      (snapshot) => {
        setInterventions(
          snapshot.docs.map((interventionDocument) => ({
            ...interventionDocument.data(),
            id: interventionDocument.id,
          })),
        )
        setInterventionsLoading(false)
      },
      (snapshotError) => {
        console.error('Erreur lors du chargement des interventions pour les rapports :', snapshotError)
        setError((current) =>
          current ||
          (snapshotError instanceof Error
            ? snapshotError.message
            : 'Interventions indisponibles.'),
        )
        setInterventionsLoading(false)
      },
    )
    return unsubscribe
  }, [])

  const report = useMemo(() => {
    const countableInvoices = invoices.filter(isCountableInvoice)
    const totalInvoiced = countableInvoices.reduce(
      (total, invoice) => total + getInvoiceTotal(invoice),
      0,
    )
    const totalOutstanding = countableInvoices.reduce((total, invoice) => {
      const invoiceTotal = getInvoiceTotal(invoice)
      return total + Math.max(0, invoiceTotal - getAmountPaid(invoice, invoiceTotal))
    }, 0)
    const completedThisMonth = interventions.filter((intervention) => {
      const date = getInterventionDate(intervention)
      return (
        isCompleted(intervention) &&
        date &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      )
    }).length

    return {
      totalInvoiced,
      totalOutstanding,
      completedThisMonth,
      monthly: getMonthlyData(invoices, now),
    }
  }, [invoices, interventions, now])

  const exportRows = [
    { indicateur: 'Chiffre d’affaires facturé (TTC)', valeur: formatCurrency(report.totalInvoiced) },
    { indicateur: 'Reste à payer', valeur: formatCurrency(report.totalOutstanding) },
    { indicateur: 'Interventions terminées ce mois', valeur: String(report.completedThisMonth) },
    ...report.monthly.map((month) => ({
      indicateur: `Facturation ${month.label}`,
      valeur: `${formatCurrency(month.factures)} · impayés ${formatCurrency(month.impayes)}`,
    })),
  ]

  const isLoading = invoicesLoading || interventionsLoading
  const exportColumns = [
    { label: 'Indicateur', value: (row) => row.indicateur },
    { label: 'Valeur', value: (row) => row.valeur },
  ]

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <FileBarChart2 aria-hidden="true" className="h-4 w-4" />
            Pilotage
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Rapports &amp; pilotage
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Suivez la facturation, les impayés et l’activité technique.
          </p>
        </div>
        <TablePdfExportButton
          columns={exportColumns}
          disabled={isLoading || Boolean(error)}
          filename="Rapport-global-TGI"
          label="Générer le rapport global (PDF)"
          rows={exportRows}
          title="Rapport global de pilotage"
        />
      </header>

      {error && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <LoaderCircle aria-hidden="true" className="h-9 w-9 animate-spin text-blue-700" />
          <p className="mt-3 text-sm text-slate-500">Calcul des indicateurs...</p>
        </div>
      ) : (
        <>
          <section aria-label="Indicateurs clés" className="grid gap-4 md:grid-cols-3">
            <MetricCard
              detail="Factures émises, hors brouillons et annulations"
              icon={ReceiptText}
              label="Chiffre d’affaires facturé (TTC)"
              tone="blue"
              value={formatCurrency(report.totalInvoiced)}
            />
            <MetricCard
              detail="Montants facturés restant à encaisser"
              icon={Banknote}
              label="Total des impayés"
              tone="amber"
              value={formatCurrency(report.totalOutstanding)}
            />
            <MetricCard
              detail={new Intl.DateTimeFormat('fr-MA', { month: 'long', year: 'numeric' }).format(now)}
              icon={CalendarCheck2}
              label="Interventions réalisées ce mois"
              tone="emerald"
              value={String(report.completedThisMonth)}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-semibold text-slate-900">Tendance de facturation</h2>
              <p className="mt-1 text-sm text-slate-500">
                Factures et reste à payer sur les six derniers mois.
              </p>
            </div>
            <div className="h-80 w-full" role="img" aria-label="Graphique de facturation des six derniers mois">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.monthly} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    axisLine={false}
                    tickFormatter={formatCompactCurrency}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(Number(value)), name]}
                    contentStyle={{
                      borderRadius: '12px',
                      borderColor: '#cbd5e1',
                      boxShadow: '0 12px 30px rgba(15, 23, 42, .12)',
                    }}
                  />
                  <Bar dataKey="factures" fill="#2563eb" name="Facturation TTC" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="impayes" fill="#f59e0b" name="Impayés" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
