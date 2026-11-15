import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const INVOICE_COLORS = ['#4682b4', '#f59e0b']

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      {label && <p className="mb-1 text-xs font-semibold text-slate-700">{label}</p>}
      {payload.map((entry) => (
        <p className="text-xs text-slate-600" key={entry.dataKey || entry.name}>
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color || entry.payload?.fill || '#4682b4' }}
          />
          {entry.name}: <strong className="font-semibold text-slate-900">{entry.value}</strong>
        </p>
      ))}
    </div>
  )
}

function InvoiceChart({ data, invoiceCount }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Statut des factures</h2>
          <p className="mt-1 text-xs text-slate-500">
            Factures soldées comparées aux montants à recouvrer
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
          to="/invoices"
        >
          Voir les factures
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-4 h-[280px] w-full">
        {invoiceCount === 0 ? (
          <div className="grid h-full place-items-center text-sm text-slate-400">
            Aucune facture à représenter
          </div>
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="value" name="Factures" radius={[8, 8, 0, 0]} maxBarSize={76}>
                {data.map((entry, index) => (
                  <Cell fill={INVOICE_COLORS[index]} key={entry.name} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {data.map((entry, index) => (
          <span className="inline-flex items-center gap-2" key={entry.name}>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: INVOICE_COLORS[index] }}
            />
            {entry.name}{' '}
            <strong className="font-semibold text-slate-800">{entry.value}</strong>
          </span>
        ))}
      </div>
    </article>
  )
}

function InterventionChart({ data, interventionTotal }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Répartition des interventions</h2>
          <p className="mt-1 text-xs text-slate-500">Vue d’ensemble par état d’avancement</p>
        </div>
        <Link
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
          to="/interventions"
        >
          Ouvrir le suivi
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="relative mt-3 h-[280px] w-full">
        {interventionTotal === 0 ? (
          <div className="grid h-full place-items-center text-sm text-slate-400">
            Aucune intervention à représenter
          </div>
        ) : (
          <>
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={66}
                  nameKey="name"
                  outerRadius={102}
                  paddingAngle={3}
                  stroke="white"
                  strokeWidth={3}
                >
                  {data.map((entry) => (
                    <Cell fill={entry.fill} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  align="center"
                  iconType="circle"
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 bottom-8 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{interventionTotal}</span>
              <span className="text-[11px] text-slate-500">interventions</span>
            </div>
          </>
        )}
      </div>
    </article>
  )
}

export default function DashboardCharts({
  invoiceChartData,
  invoiceCount,
  interventionChartData,
  interventionTotal,
}) {
  return (
    <>
      <InvoiceChart data={invoiceChartData} invoiceCount={invoiceCount} />
      <InterventionChart data={interventionChartData} interventionTotal={interventionTotal} />
    </>
  )
}
