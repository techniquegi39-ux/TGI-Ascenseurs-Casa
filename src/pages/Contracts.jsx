import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpDown,
  Download,
  Eye,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { collection, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore'
import ContractForm from '../components/ContractForm.jsx'
import TablePdfExportButton from '../components/TablePdfExportButton.jsx'
import { db } from '../firebase.js'

function getContractNumber(contract) {
  return String(contract.number || contract.numero || contract.contractNumber || 'Sans numéro')
}

function getClientName(client) {
  return String(client?.nom || client?.raisonSociale || client?.name || 'Client non renseigné')
}

function getContractClientId(contract) {
  return String(contract.clientId || '')
}

function getContractClientName(contract, clientsById) {
  return getClientName(clientsById.get(getContractClientId(contract)) || {
    nom: contract.clientName || contract.client || 'Client non renseigné',
  })
}

function getDateValue(value) {
  if (!value) {
    return ''
  }
  if (typeof value?.toDate === 'function') {
    return value.toDate()
  }
  return value
}

function getDateString(value) {
  const dateValue = getDateValue(value)
  if (typeof dateValue === 'string') {
    return /^\d{4}-\d{2}-\d{2}/.test(dateValue) ? dateValue.slice(0, 10) : ''
  }
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
    return ''
  }

  const year = dateValue.getFullYear()
  const month = String(dateValue.getMonth() + 1).padStart(2, '0')
  const day = String(dateValue.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(value) {
  const dateString = getDateString(value)
  if (!dateString) {
    return '—'
  }

  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getContractStatus(contract) {
  const rawStatus = String(contract.status || contract.statut || '').trim()
  const normalizedStatus = rawStatus.toLocaleLowerCase('fr-FR')
  const endDate = getDateString(contract.dateFin || contract.endDate)
  const today = getDateString(new Date())

  if (endDate && endDate < today) {
    return 'Expiré'
  }
  if (normalizedStatus.includes('résili') || normalizedStatus.includes('resili')) {
    return 'Résilié'
  }
  if (normalizedStatus.includes('négociation') || normalizedStatus.includes('negociation')) {
    return 'En négociation'
  }
  if (normalizedStatus.includes('expir')) {
    return 'Expiré'
  }

  if (normalizedStatus === 'actif' || normalizedStatus === 'active' || !rawStatus) {
    return 'Actif'
  }

  return rawStatus
}

function getDaysUntilContractEnd(contract) {
  const endDate = getDateString(contract.dateFin || contract.endDate)
  const today = getDateString(new Date())
  if (!endDate || !today) {
    return null
  }

  const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number)
  const endTimestamp = Date.UTC(endYear, endMonth - 1, endDay)
  const todayTimestamp = Date.UTC(todayYear, todayMonth - 1, todayDay)

  return Math.round((endTimestamp - todayTimestamp) / 86_400_000)
}

function getContractAmount(contract) {
  const amount = contract.totalTTC ?? contract.montantTTC ?? contract.amountTTC
  if (amount !== undefined && amount !== null && amount !== '') {
    const parsedAmount = Number(amount)
    if (Number.isFinite(parsedAmount)) {
      return parsedAmount
    }
  }

  const amountHT = Number(contract.montantHT ?? contract.amountHT ?? 0)
  const vatRate = Number(contract.tauxTVA ?? contract.vatRate ?? 0)
  return Number.isFinite(amountHT) && Number.isFinite(vatRate)
    ? amountHT * (1 + vatRate / 100)
    : 0
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
    Actif: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
    Expiré: 'bg-red-50 text-red-800 ring-red-600/20',
    'En négociation': 'bg-amber-50 text-amber-800 ring-amber-600/20',
    Résilié: 'bg-slate-100 text-slate-700 ring-slate-500/15',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || 'bg-slate-100 text-slate-700 ring-slate-500/15'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'Actif'
            ? 'bg-emerald-500'
            : status === 'Expiré'
              ? 'bg-red-500'
              : status === 'En négociation'
                ? 'bg-amber-500'
                : 'bg-slate-400'
        }`}
      />
      {status}
    </span>
  )
}

function ContractDetailItem({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-800">
        {value || '—'}
      </dd>
    </div>
  )
}

function ContractDetailsModal({ contract, clientName, onClose }) {
  const elevators = getStoredElevatorDetails(contract)
  const elevatorIds = getElevatorIds(contract)
  const equipment = elevators.length
    ? elevators.map((elevator) =>
        [
          elevator.reference || elevator.numeroSerie || elevator.serialNumber,
          elevator.type,
          elevator.marque || elevator.brand,
        ]
          .filter(Boolean)
          .join(' · ') || elevator.id,
      )
    : elevatorIds
  const clauses = String(contract.clauses || contract.conditions || '').trim()

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        aria-labelledby="contract-details-title"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Fiche contractuelle
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900" id="contract-details-title">
              {getContractNumber(contract)}
            </h2>
          </div>
          <button
            aria-label="Fermer les détails du contrat"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          <div className="space-y-5">
            <dl className="grid gap-3 sm:grid-cols-2">
              <ContractDetailItem label="Client" value={clientName} />
              <ContractDetailItem
                label="Type de contrat"
                value={contract.typeContrat || contract.contractType}
              />
              <ContractDetailItem
                label="Objet / nature du contrat"
                value={contract.type}
              />
              <ContractDetailItem
                label="Délai d’intervention garanti (SLA)"
                value={
                  contract.slaIntervention ||
                  contract.delaiInterventionGaranti ||
                  contract.responseTimeSla
                }
              />
              <ContractDetailItem
                label="Tacite reconduction"
                value={
                  contract.taciteReconduction ?? contract.automaticRenewal
                    ? 'Oui — renouvellement automatique'
                    : 'Non'
                }
              />
              <ContractDetailItem label="Date de début" value={formatDate(contract.dateDebut || contract.startDate)} />
              <ContractDetailItem label="Date de fin" value={formatDate(contract.dateFin || contract.endDate)} />
              <ContractDetailItem label="Montant TTC" value={formatCurrency(getContractAmount(contract))} />
              <ContractDetailItem
                label="Fréquence de facturation"
                value={contract.frequenceFacturation || contract.billingFrequency}
              />
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Statut
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={getContractStatus(contract)} />
                </dd>
              </div>
            </dl>
            <section aria-labelledby="contract-details-equipment">
              <h3 className="font-semibold text-slate-900" id="contract-details-equipment">
                Équipements couverts
              </h3>
              {equipment.length ? (
                <ul className="mt-2 space-y-2">
                  {equipment.map((item, index) => (
                    <li
                      className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-sm text-slate-700"
                      key={`${item}-${index}`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Aucun équipement renseigné.</p>
              )}
            </section>
            <section
              aria-labelledby="contract-details-clauses"
              className="rounded-lg border border-slate-200 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-800" id="contract-details-clauses">
                Clauses
              </h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                {clauses || 'Aucune clause particulière.'}
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
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

function getStoredElevatorDetails(contract) {
  const details = contract.elevatorDetails || contract.equipmentDetails
  if (!Array.isArray(details)) {
    return []
  }

  return details.filter((detail) => detail && typeof detail === 'object')
}

function getElevatorIds(contract) {
  const ids = contract.elevatorIds || contract.equipementIds || contract.equipmentIds
  return Array.isArray(ids) ? [...new Set(ids.map(String).filter(Boolean))] : []
}

function getCompanyInfo(settings = {}) {
  return {
    name: 'TGI ASCENSEURS CASA',
    address: '',
    phone: '',
    email: '',
    ice: '',
    rc: '',
    patente: '',
    ...Object.fromEntries(
      Object.entries(settings).filter(([, value]) => typeof value === 'string'),
    ),
  }
}

export default function Contracts() {
  const [contracts, setContracts] = useState([])
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'dateFin', direction: 'asc' })
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [isLoadingContracts, setIsLoadingContracts] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [contractError, setContractError] = useState('')
  const [clientError, setClientError] = useState('')
  const [modalContract, setModalContract] = useState(undefined)
  const [detailsContract, setDetailsContract] = useState(undefined)
  const [exportingId, setExportingId] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'contracts'),
      (snapshot) => {
        setContracts(
          snapshot.docs.map((contractDocument) => ({
            ...contractDocument.data(),
            id: contractDocument.id,
          })),
        )
        setContractError('')
        setIsLoadingContracts(false)
      },
      (error) => {
        setContractError(
          error instanceof Error ? error.message : 'Impossible de charger les contrats.',
        )
        setIsLoadingContracts(false)
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

  const filteredContracts = useMemo(() => {
    const normalizedQuery = normalizeSearch(search)

    return contracts
      .filter((contract) => {
        if (statusFilter !== 'Tous' && getContractStatus(contract) !== statusFilter) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        return [
          getContractNumber(contract),
          getContractClientName(contract, clientsById),
        ].some((value) => normalizeSearch(value).includes(normalizedQuery))
      })
      .sort((first, second) => {
        const firstValue =
          sortConfig.key === 'client'
            ? getContractClientName(first, clientsById)
            : getDateString(first.dateFin || first.endDate)
        const secondValue =
          sortConfig.key === 'client'
            ? getContractClientName(second, clientsById)
            : getDateString(second.dateFin || second.endDate)
        if (sortConfig.key === 'dateFin' && (!firstValue || !secondValue)) {
          return firstValue ? -1 : secondValue ? 1 : 0
        }

        const order = firstValue.localeCompare(secondValue, 'fr', {
          sensitivity: 'base',
          numeric: true,
        })

        return sortConfig.direction === 'asc' ? order : -order
      })
  }, [clientsById, contracts, search, sortConfig, statusFilter])

  const activeCount = contracts.filter(
    (contract) => getContractStatus(contract) === 'Actif',
  ).length
  const expiringCount = contracts.filter(
    (contract) => getContractStatus(contract) === 'Expiré',
  ).length
  const negotiationCount = contracts.filter(
    (contract) => getContractStatus(contract) === 'En négociation',
  ).length

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
    setModalContract(undefined)
    showToast(
      'success',
      action === 'updated' ? 'Le contrat a été modifié.' : 'Le contrat a été créé.',
    )
  }

  async function handleDelete(contract) {
    const number = getContractNumber(contract)
    if (!window.confirm(`Supprimer définitivement le contrat « ${number} » ?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'contracts', contract.id))
      showToast('success', 'Le contrat a été supprimé.')
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `Suppression impossible : ${error.message}`
          : 'Suppression impossible. Veuillez réessayer.',
      )
    }
  }

  async function handleExport(contract) {
    setExportingId(contract.id)

    try {
      const settingsSnapshot = await getDoc(doc(db, 'settings', 'company'))
      const elevatorIds = getElevatorIds(contract)
      let elevatorDetails = getStoredElevatorDetails(contract)

      if (elevatorDetails.length === 0 && elevatorIds.length > 0) {
        const elevatorSnapshots = await Promise.all(
          elevatorIds.map((id) => getDoc(doc(db, 'elevators', id))),
        )
        elevatorDetails = elevatorSnapshots
          .filter((snapshot) => snapshot.exists())
          .map((snapshot) => ({ ...snapshot.data(), id: snapshot.id }))
      }

      const companyData = getCompanyInfo(settingsSnapshot.exists() ? settingsSnapshot.data() : {})
      const client = clientsById.get(getContractClientId(contract))
      const [{ pdf }, { default: ContractPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/pdf/ContractPdfDocument.jsx'),
      ])
      const documentContract = {
        ...contract,
        number: getContractNumber(contract),
        elevatorDetails,
        totalTTC: getContractAmount(contract),
        clientInfo: {
          ...client,
          nom: getContractClientName(contract, clientsById),
          adresse: client?.adresse || client?.address || '',
          ice: client?.ice || client?.identifiantFiscal || '',
          telephone: client?.telephone || client?.téléphone || client?.phone || '',
        },
        companyInfo: companyData,
      }
      const blob = await pdf(
        <ContractPdfDocument contract={documentContract} />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Contrat_${getContractNumber(contract)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)

      showToast('success', 'Le PDF du contrat a été généré.')
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

  const isLoading = isLoadingContracts || isLoadingClients

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <Toast onClose={() => setToast(null)} toast={toast} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <FileText aria-hidden="true" className="h-4 w-4" />
            Gestion commerciale
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Contrats
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Gérez les engagements clients, les équipements couverts et leurs échéances.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <TablePdfExportButton
            columns={[
              { label: 'N° Contrat', value: getContractNumber },
              { label: 'Client', value: (contract) => getContractClientName(contract, clientsById) },
              { label: 'Début', value: (contract) => formatDate(contract.dateDebut || contract.startDate) },
              { label: 'Fin', value: (contract) => formatDate(contract.dateFin || contract.endDate) },
              { label: 'Montant TTC', value: (contract) => formatCurrency(getContractAmount(contract)) },
              { label: 'Statut', value: getContractStatus },
            ]}
            disabled={isLoading}
            filename="Liste-contrats"
            rows={filteredContracts}
            title="Liste des contrats"
          />
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:w-auto"
            onClick={() => setModalContract(null)}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nouveau contrat
          </button>
        </div>
      </header>

      <section aria-label="Synthèse des contrats" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Contrats enregistrés</p>
            <FileText aria-hidden="true" className="h-4 w-4 text-blue-700" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {contracts.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Actifs</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-700">
            {activeCount}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">En négociation</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-700">
            {negotiationCount}
          </p>
        </div>
        <div className="rounded-xl border border-red-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Expirés</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-red-700">{expiringCount}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">Registre des contrats</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredContracts.length} contrat{filteredContracts.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(15rem,1fr)_12rem] sm:items-center sm:w-[min(100%,34rem)]">
            <label className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Rechercher par numéro ou client"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Numéro de contrat, client..."
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
                {['Actif', 'Expiré', 'En négociation', 'Résilié'].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {contractError && (
          <div
            className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chargement des contrats impossible : {contractError}</span>
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
            <p className="mt-3 text-sm text-slate-500">Chargement des contrats...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <FileText aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search || statusFilter !== 'Tous'
                ? 'Aucun contrat ne correspond aux filtres'
                : 'Aucun contrat pour le moment'}
            </h3>
            <p className="mt-1 max-w-md text-sm leading-5 text-slate-500">
              {search || statusFilter !== 'Tous'
                ? 'Modifiez la recherche ou le filtre pour afficher d’autres contrats.'
                : 'Créez un contrat pour suivre les engagements de vos clients.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    N° Contrat
                  </th>
                  <th
                    aria-sort={sortConfig.key === 'client'
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : 'none'}
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <button
                      aria-label={`Trier par client ${sortConfig.key === 'client' && sortConfig.direction === 'asc' ? 'décroissant' : 'croissant'}`}
                      className="inline-flex items-center gap-2 text-left transition hover:text-blue-700 focus:outline-none focus:text-blue-700"
                      onClick={() => handleSort('client')}
                      type="button"
                    >
                      Client
                      <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date début
                  </th>
                  <th
                    aria-sort={sortConfig.key === 'dateFin'
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : 'none'}
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <button
                      aria-label={`Trier par date de fin ${sortConfig.key === 'dateFin' && sortConfig.direction === 'asc' ? 'décroissant' : 'croissant'}`}
                      className="inline-flex items-center gap-2 text-left transition hover:text-blue-700 focus:outline-none focus:text-blue-700"
                      onClick={() => handleSort('dateFin')}
                      type="button"
                    >
                      Date fin
                      <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Montant TTC
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
                {filteredContracts.map((contract) => {
                  const number = getContractNumber(contract)
                  const isExporting = exportingId === contract.id
                  const status = getContractStatus(contract)
                  const daysUntilEnd = getDaysUntilContractEnd(contract)
                  const isExpiringSoon =
                    status !== 'Expiré' &&
                    status !== 'Résilié' &&
                    daysUntilEnd !== null &&
                    daysUntilEnd >= 0 &&
                    daysUntilEnd < 30

                  return (
                    <tr className="transition hover:bg-slate-50/70" key={contract.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {number}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm font-semibold text-slate-900">
                          {getContractClientName(contract, clientsById)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(contract.dateDebut || contract.startDate)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        <span className="block">{formatDate(contract.dateFin || contract.endDate)}</span>
                        {isExpiringSoon && (
                          <span
                            className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20"
                            title="Le contrat arrive à échéance dans moins de 30 jours."
                          >
                            {daysUntilEnd === 0
                              ? 'Échéance aujourd’hui'
                              : `Expire dans ${daysUntilEnd} j`}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-800">
                        {formatCurrency(getContractAmount(contract))}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={`Afficher les détails du contrat ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            onClick={() => setDetailsContract(contract)}
                            title="Afficher les détails du contrat"
                            type="button"
                          >
                            <Eye aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            aria-label={`Exporter le contrat ${number} en PDF`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-wait disabled:opacity-50"
                            disabled={Boolean(exportingId)}
                            onClick={() => void handleExport(contract)}
                            title="Exporter le contrat en PDF"
                            type="button"
                          >
                            {isExporting ? (
                              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download aria-hidden="true" className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            aria-label={`Modifier le contrat ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            onClick={() => setModalContract(contract)}
                            title="Modifier le contrat"
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            aria-label={`Supprimer le contrat ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                            onClick={() => void handleDelete(contract)}
                            title="Supprimer le contrat"
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

      {modalContract !== undefined && (
        <ContractForm
          contract={modalContract}
          onClose={() => setModalContract(undefined)}
          onSaved={handleSaved}
        />
      )}
      {detailsContract !== undefined && (
        <ContractDetailsModal
          clientName={getContractClientName(detailsContract, clientsById)}
          contract={detailsContract}
          onClose={() => setDetailsContract(undefined)}
        />
      )}
    </div>
  )
}
