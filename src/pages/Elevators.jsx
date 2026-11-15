import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpDown,
  Building2,
  Download,
  Gauge,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Server,
  Trash2,
  X,
} from 'lucide-react'
import { collection, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore'
import ElevatorForm from '../components/ElevatorForm.jsx'
import TablePdfExportButton from '../components/TablePdfExportButton.jsx'
import { db } from '../firebase.js'

const ELEVATOR_STATUSES = ['En marche', 'En panne', 'En maintenance']

function getElevatorReference(elevator) {
  return String(
    elevator.reference || elevator.numeroSerie || elevator.serialNumber || 'Sans référence',
  )
}

function getElevatorStatus(elevator) {
  const rawStatus = String(elevator.status || elevator.statut || ELEVATOR_STATUSES[0])
  const normalizedStatus = rawStatus.trim().toLocaleLowerCase('fr-FR')

  if (normalizedStatus.includes('panne')) {
    return 'En panne'
  }
  if (normalizedStatus.includes('maintenance')) {
    return 'En maintenance'
  }
  if (normalizedStatus.includes('marche') || normalizedStatus === 'actif') {
    return 'En marche'
  }

  return rawStatus
}

function getElevatorClientId(elevator) {
  return String(elevator.clientId || elevator.proprietaireId || '')
}

function getElevatorClientName(elevator, clientsById) {
  const client = clientsById.get(getElevatorClientId(elevator))
  return String(
    client?.nom ||
      client?.raisonSociale ||
      client?.name ||
      elevator.clientName ||
      elevator.proprietaireNom ||
      'Client non renseigné',
  )
}

function getElevatorType(elevator) {
  return String(elevator.type || 'Type non renseigné')
}

function getElevatorLevels(elevator) {
  const value = elevator.niveaux ?? elevator.nombreNiveaux ?? elevator.floors
  return value === undefined || value === null || value === '' ? '—' : String(value)
}

function getElevatorCapacity(elevator) {
  const kilograms = elevator.chargeKg ?? elevator.charge ?? elevator.capacityKg
  const people = elevator.personnes ?? elevator.passagers ?? elevator.capacityPeople
  const capacity = kilograms === undefined || kilograms === null || kilograms === ''
    ? '—'
    : `${kilograms} kg`

  if (people === undefined || people === null || people === '') {
    return capacity
  }

  return capacity === '—' ? `${people} personnes` : `${capacity} / ${people} pers.`
}

function getClientDisplayName(client) {
  return String(client.nom || client.raisonSociale || client.name || 'Client sans nom')
}

function normalizeSearch(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

function StatusBadge({ status }) {
  const appearance = {
    'En marche': {
      className: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
      dotClassName: 'bg-emerald-500',
    },
    'En panne': {
      className: 'bg-red-50 text-red-800 ring-red-600/20',
      dotClassName: 'bg-red-500',
    },
    'En maintenance': {
      className: 'bg-amber-50 text-amber-800 ring-amber-600/20',
      dotClassName: 'bg-amber-500',
    },
  }[status] || {
    className: 'bg-slate-100 text-slate-700 ring-slate-500/15',
    dotClassName: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${appearance.className}`}
    >
      <span className={`relative flex h-2 w-2`}>
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${appearance.dotClassName}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${appearance.dotClassName}`} />
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
        <Building2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
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

export default function Elevators() {
  const [elevators, setElevators] = useState([])
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'reference', direction: 'asc' })
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [clientFilter, setClientFilter] = useState('Tous')
  const [isLoadingElevators, setIsLoadingElevators] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [elevatorError, setElevatorError] = useState('')
  const [clientError, setClientError] = useState('')
  const [modalElevator, setModalElevator] = useState(undefined)
  const [exportingId, setExportingId] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'elevators'),
      (snapshot) => {
        setElevators(
          snapshot.docs.map((elevatorDocument) => ({
            ...elevatorDocument.data(),
            id: elevatorDocument.id,
          })),
        )
        setElevatorError('')
        setIsLoadingElevators(false)
      },
      (error) => {
        setElevatorError(
          error instanceof Error ? error.message : 'Impossible de charger le parc technique.',
        )
        setIsLoadingElevators(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'clients'),
      (snapshot) => {
        setClients(
          snapshot.docs
            .map((clientDocument) => ({
              ...clientDocument.data(),
              id: clientDocument.id,
            }))
            .sort((first, second) =>
              getClientDisplayName(first).localeCompare(getClientDisplayName(second), 'fr', {
                sensitivity: 'base',
              }),
            ),
        )
        setClientError('')
        setIsLoadingClients(false)
      },
      (error) => {
        setClientError(
          error instanceof Error ? error.message : 'Impossible de charger les propriétaires.',
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

  const filteredElevators = useMemo(() => {
    const normalizedQuery = normalizeSearch(search)

    return elevators
      .filter((elevator) => {
        const statusMatches =
          statusFilter === 'Tous' || getElevatorStatus(elevator) === statusFilter
        const elevatorClientId = getElevatorClientId(elevator)
        const clientMatches = clientFilter === 'Tous' || elevatorClientId === clientFilter

        if (!statusMatches || !clientMatches) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        const searchableValues = [
          getElevatorReference(elevator),
          getElevatorClientName(elevator, clientsById),
          getElevatorType(elevator),
          elevator.marque,
          elevator.moteur,
          elevator.adresseInstallation,
        ]
        return searchableValues.some((value) => normalizeSearch(value || '').includes(normalizedQuery))
      })
      .sort((first, second) => {
        const firstValue =
          sortConfig.key === 'client'
            ? getElevatorClientName(first, clientsById)
            : getElevatorReference(first)
        const secondValue =
          sortConfig.key === 'client'
            ? getElevatorClientName(second, clientsById)
            : getElevatorReference(second)
        const order = firstValue.localeCompare(secondValue, 'fr', {
          sensitivity: 'base',
          numeric: true,
        })

        return sortConfig.direction === 'asc' ? order : -order
      })
  }, [clientsById, clientFilter, elevators, search, sortConfig, statusFilter])

  const runningCount = elevators.filter(
    (elevator) => getElevatorStatus(elevator) === 'En marche',
  ).length
  const brokenCount = elevators.filter(
    (elevator) => getElevatorStatus(elevator) === 'En panne',
  ).length
  const maintenanceCount = elevators.filter(
    (elevator) => getElevatorStatus(elevator) === 'En maintenance',
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
    setModalElevator(undefined)
    showToast(
      'success',
      action === 'updated'
        ? 'L’équipement a été modifié.'
        : 'L’équipement a été ajouté au parc.',
    )
  }

  async function handleDelete(elevator) {
    const reference = getElevatorReference(elevator)
    if (!window.confirm(`Supprimer définitivement l’équipement « ${reference} » ?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'elevators', elevator.id))
      showToast('success', 'L’équipement a été supprimé.')
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `Suppression impossible : ${error.message}`
          : 'Suppression impossible. Veuillez réessayer.',
      )
    }
  }

  async function handleExport(elevator) {
    setExportingId(elevator.id)

    try {
      const settingsSnapshot = await getDoc(doc(db, 'settings', 'company'))
      const { PDF_COMPANY_INFO, generatePremiumPDF } = await import('../utils/pdfEngine.js')
      const savedCompanyInfo = settingsSnapshot.exists() ? settingsSnapshot.data() : {}
      const companyInfo = {
        ...PDF_COMPANY_INFO,
        ...Object.fromEntries(
          Object.entries(savedCompanyInfo).filter(([, value]) => typeof value === 'string'),
        ),
      }

      const owner = clientsById.get(getElevatorClientId(elevator))
      const ownerName = getElevatorClientName(elevator, clientsById)
      const installationAddress = String(
        elevator.adresseInstallation || elevator.adresse || '—',
      )
      const reference = getElevatorReference(elevator)
      const details = [
        ['Référence / N° de série', reference],
        ['Client propriétaire', ownerName],
        ['Type d’équipement', getElevatorType(elevator)],
        ['Marque', String(elevator.marque || '—')],
        ['Moteur / Modèle', String(elevator.moteur || '—')],
        ['Niveaux / Arrêts', getElevatorLevels(elevator)],
        ['Charge utile', getElevatorCapacity(elevator)],
        ['Adresse d’installation', installationAddress],
        ['Statut actuel', getElevatorStatus(elevator)],
      ].map(([designation, value]) => ({ designation, value }))

      await generatePremiumPDF({
        typeDocument: 'Fiche Technique Équipement',
        numero: reference,
        date: new Date(),
        clientInfo: {
          nom: ownerName,
          adresse: String(owner?.adresse || owner?.address || '—'),
          ice: String(owner?.ice || owner?.identifiantFiscal || '—'),
        },
        items: details,
        companyInfo,
        layout: 'details',
      })

      showToast('success', 'La fiche technique PDF a été générée.')
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

  const isLoading = isLoadingElevators || isLoadingClients

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <Toast onClose={() => setToast(null)} toast={toast} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <Building2 aria-hidden="true" className="h-4 w-4" />
            Gestion technique
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Parc d’Ascenseurs
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Suivez les équipements, leur propriétaire et leur état opérationnel.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <TablePdfExportButton
            columns={[
              { label: 'N° Série', value: getElevatorReference },
              { label: 'Client', value: (elevator) => getElevatorClientName(elevator, clientsById) },
              { label: 'Type', value: getElevatorType },
              { label: 'Marque', value: (elevator) => elevator.marque || elevator.brand || '—' },
              { label: 'Niveaux', value: getElevatorLevels },
              { label: 'Charge', value: getElevatorCapacity },
              { label: 'Statut', value: getElevatorStatus },
            ]}
            disabled={isLoading}
            filename="Parc-ascenseurs"
            rows={filteredElevators}
            title="Parc d’ascenseurs"
          />
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:w-auto"
            onClick={() => setModalElevator(null)}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Ajouter un équipement
          </button>
        </div>
      </header>

      <section aria-label="Synthèse du parc" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Équipements suivis</p>
            <Server aria-hidden="true" className="h-4 w-4 text-blue-700" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {elevators.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">En marche</p>
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-700">
            {runningCount}
          </p>
        </div>
        <div className="rounded-xl border border-red-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">En panne</p>
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-red-700">{brokenCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">En maintenance</p>
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-700">
            {maintenanceCount}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 lg:flex-row lg:items-end lg:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">Registre des équipements</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredElevators.length} équipement{filteredElevators.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[min(100%,42rem)]">
            <label className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Rechercher dans le parc d’ascenseurs"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Référence, client, marque..."
                type="search"
                value={search}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="sr-only">Filtrer par statut</span>
                <select
                  aria-label="Filtrer par statut"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  onChange={(event) => setStatusFilter(event.target.value)}
                  value={statusFilter}
                >
                  <option value="Tous">Tous les statuts</option>
                  {ELEVATOR_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Filtrer par client</span>
                <select
                  aria-label="Filtrer par client"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  onChange={(event) => setClientFilter(event.target.value)}
                  value={clientFilter}
                >
                  <option value="Tous">Tous les clients</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {getClientDisplayName(client)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {elevatorError && (
          <div
            className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chargement du parc impossible : {elevatorError}</span>
          </div>
        )}
        {clientError && (
          <div
            className="mx-4 mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chargement des propriétaires impossible : {clientError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12">
            <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin text-blue-700" />
            <p className="mt-3 text-sm text-slate-500">Chargement du parc d’ascenseurs...</p>
          </div>
        ) : filteredElevators.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search || statusFilter !== 'Tous' || clientFilter !== 'Tous'
                ? 'Aucun équipement ne correspond aux filtres'
                : 'Aucun équipement pour le moment'}
            </h3>
            <p className="mt-1 max-w-md text-sm leading-5 text-slate-500">
              {search || statusFilter !== 'Tous' || clientFilter !== 'Tous'
                ? 'Modifiez la recherche ou les filtres pour afficher d’autres équipements.'
                : 'Ajoutez un équipement pour commencer à suivre votre parc technique.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  <th
                    aria-sort={sortConfig.key === 'reference'
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : 'none'}
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <button
                      aria-label={`Trier par numéro de série ${sortConfig.key === 'reference' && sortConfig.direction === 'asc' ? 'décroissant' : 'croissant'}`}
                      className="inline-flex items-center gap-2 text-left transition hover:text-blue-700 focus:outline-none focus:text-blue-700"
                      onClick={() => handleSort('reference')}
                      type="button"
                    >
                      N° de série
                      <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
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
                    Marque
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Niveaux / Charge
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
                {filteredElevators.map((elevator) => {
                  const reference = getElevatorReference(elevator)
                  const isExporting = exportingId === elevator.id

                  return (
                    <tr className="transition hover:bg-slate-50/70" key={elevator.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {reference}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm font-semibold text-slate-900">
                          {getElevatorClientName(elevator, clientsById)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block text-sm font-medium text-slate-700">
                          {String(elevator.marque || '—')}
                        </span>
                        {elevator.moteur && (
                          <span className="mt-1 block max-w-xs truncate text-xs text-slate-500">
                            {String(elevator.moteur)}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                        <div className="space-y-1">
                          <span className="block font-medium">
                            {getElevatorLevels(elevator)} niveaux
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                            <Gauge aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
                            {getElevatorCapacity(elevator)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={getElevatorStatus(elevator)} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={`Exporter la fiche technique de ${reference}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-wait disabled:opacity-50"
                            disabled={Boolean(exportingId)}
                            onClick={() => void handleExport(elevator)}
                            title="Exporter la fiche technique en PDF"
                            type="button"
                          >
                            {isExporting ? (
                              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download aria-hidden="true" className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            aria-label={`Modifier ${reference}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            onClick={() => setModalElevator(elevator)}
                            title="Modifier l’équipement"
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            aria-label={`Supprimer ${reference}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                            onClick={() => void handleDelete(elevator)}
                            title="Supprimer l’équipement"
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

      {modalElevator !== undefined && (
        <ElevatorForm
          elevator={modalElevator}
          onClose={() => setModalElevator(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
