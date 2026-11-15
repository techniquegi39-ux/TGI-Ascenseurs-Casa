import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarClock,
  Download,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { collection, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore'
import InterventionForm from '../components/InterventionForm.jsx'
import { db } from '../firebase.js'

const INTERVENTION_STATUSES = ['Planifiée', 'En cours', 'Terminée', 'Annulée']

function getInterventionNumber(intervention) {
  return String(
    intervention.numero ||
      intervention.reference ||
      (intervention.id ? `INT-${intervention.id.slice(0, 7).toUpperCase()}` : 'Sans numéro'),
  )
}

function getInterventionClientId(intervention) {
  return String(intervention.clientId || '')
}

function getClientName(client) {
  return String(client?.nom || client?.raisonSociale || client?.name || 'Client non renseigné')
}

function getInterventionClientName(intervention, clientsById) {
  return getClientName(
    clientsById.get(getInterventionClientId(intervention)) || {
      nom: intervention.clientName || intervention.client || 'Client non renseigné',
    },
  )
}

function getInterventionElevatorId(intervention) {
  return String(intervention.elevatorId || intervention.equipmentId || '')
}

function getElevatorReference(elevator) {
  return String(
    elevator?.reference ||
      elevator?.numeroSerie ||
      elevator?.serialNumber ||
      'Équipement non renseigné',
  )
}

function getInterventionElevatorName(intervention, elevatorsById) {
  const elevator = elevatorsById.get(getInterventionElevatorId(intervention))
  return String(
    elevator
      ? getElevatorReference(elevator)
      : intervention.elevatorReference ||
          intervention.equipmentReference ||
          'Équipement non renseigné',
  )
}

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

function formatDateTime(value) {
  const date = toDate(value)
  if (!date) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function normalizeSearch(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

function getStatus(intervention) {
  const status = String(intervention.status || intervention.statut || INTERVENTION_STATUSES[0])
  const normalized = status.trim().toLocaleLowerCase('fr-FR')

  if (normalized.includes('planifi')) {
    return 'Planifiée'
  }
  if (normalized.includes('cours') || normalized.includes('progress')) {
    return 'En cours'
  }
  if (normalized.includes('termin') || normalized.includes('compl')) {
    return 'Terminée'
  }
  if (normalized.includes('annul')) {
    return 'Annulée'
  }
  return status
}

function getParts(intervention) {
  const parts = intervention.piecesRemplacees || intervention.partsReplaced || []
  if (Array.isArray(parts)) {
    return parts.map((part) => String(part).trim()).filter(Boolean)
  }
  return String(parts)
    .split(/\r?\n|;/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function StatusBadge({ status }) {
  const styles = {
    Planifiée: {
      badge: 'bg-blue-50 text-blue-800 ring-blue-600/20',
      dot: 'bg-blue-500',
    },
    'En cours': {
      badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
      dot: 'bg-amber-500',
    },
    Terminée: {
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
        <Wrench aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
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

export default function Interventions() {
  const [interventions, setInterventions] = useState([])
  const [clients, setClients] = useState([])
  const [elevators, setElevators] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [isLoadingInterventions, setIsLoadingInterventions] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [isLoadingElevators, setIsLoadingElevators] = useState(true)
  const [interventionError, setInterventionError] = useState('')
  const [clientError, setClientError] = useState('')
  const [elevatorError, setElevatorError] = useState('')
  const [modalIntervention, setModalIntervention] = useState(undefined)
  const [exportingId, setExportingId] = useState('')
  const [toast, setToast] = useState(null)

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
        setInterventionError('')
        setIsLoadingInterventions(false)
      },
      (error) => {
        setInterventionError(
          error instanceof Error ? error.message : 'Impossible de charger les interventions.',
        )
        setIsLoadingInterventions(false)
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
          error instanceof Error ? error.message : 'Impossible de charger les équipements.',
        )
        setIsLoadingElevators(false)
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

  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])
  const elevatorsById = useMemo(
    () => new Map(elevators.map((elevator) => [elevator.id, elevator])),
    [elevators],
  )

  const filteredInterventions = useMemo(() => {
    const normalizedQuery = normalizeSearch(search)

    return interventions
      .filter((intervention) => {
        if (statusFilter !== 'Tous' && getStatus(intervention) !== statusFilter) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        const searchableValues = [
          getInterventionNumber(intervention),
          getInterventionClientName(intervention, clientsById),
          getInterventionElevatorName(intervention, elevatorsById),
          intervention.type,
          intervention.technicien || intervention.technician,
        ]
        return searchableValues.some((value) => normalizeSearch(value || '').includes(normalizedQuery))
      })
      .sort((first, second) => {
        const firstDate = toDate(first.dateIntervention || first.dateHeure)?.getTime() || 0
        const secondDate = toDate(second.dateIntervention || second.dateHeure)?.getTime() || 0
        return secondDate - firstDate
      })
  }, [clientsById, elevatorsById, interventions, search, statusFilter])

  const plannedCount = interventions.filter(
    (intervention) => getStatus(intervention) === 'Planifiée',
  ).length
  const inProgressCount = interventions.filter(
    (intervention) => getStatus(intervention) === 'En cours',
  ).length
  const completedCount = interventions.filter(
    (intervention) => getStatus(intervention) === 'Terminée',
  ).length

  function showToast(type, message) {
    setToast({ type, message })
  }

  function handleSaved(action) {
    setModalIntervention(undefined)
    showToast(
      'success',
      action === 'updated' ? 'La fiche d’intervention a été modifiée.' : 'La fiche d’intervention a été créée.',
    )
  }

  async function handleDelete(intervention) {
    const number = getInterventionNumber(intervention)
    if (!window.confirm(`Supprimer définitivement la fiche « ${number} » ?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'interventions', intervention.id))
      showToast('success', 'La fiche d’intervention a été supprimée.')
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `Suppression impossible : ${error.message}`
          : 'Suppression impossible. Veuillez réessayer.',
      )
    }
  }

  async function handleExport(intervention) {
    setExportingId(intervention.id)

    try {
      const settingsSnapshot = await getDoc(doc(db, 'settings', 'company'))
      const { PDF_COMPANY_INFO, generatePremiumPDF } = await import('../utils/pdfEngine.js')
      const companyInfo = getCompanyInfo(
        settingsSnapshot.exists() ? settingsSnapshot.data() : {},
        PDF_COMPANY_INFO,
      )
      const client = clientsById.get(getInterventionClientId(intervention))
      const elevator = elevatorsById.get(getInterventionElevatorId(intervention))
      const parts = getParts(intervention)
      const workReport = String(
        intervention.travauxEffectues || intervention.rapport || intervention.report || '',
      ).trim()
      const problemDescription = String(
        intervention.descriptionProbleme ||
          intervention.probleme ||
          intervention.description ||
          'Non renseigné',
      ).trim()
      const notes = [
        `Problème signalé :\n${problemDescription}`,
        `Travaux effectués / Rapport :\n${workReport || 'Aucun rapport de travaux renseigné.'}`,
      ].join('\n\n')
      const items = parts.length
        ? parts.map((part) => ({ designation: 'Pièce remplacée', value: part }))
        : [{ designation: 'Pièces remplacées', value: 'Aucune pièce remplacée.' }]
      const interventionType = String(intervention.type || 'Intervention')

      await generatePremiumPDF({
        typeDocument: 'Fiche d’intervention',
        numero: getInterventionNumber(intervention),
        date: intervention.dateIntervention || intervention.dateHeure || new Date(),
        clientInfo: {
          nom: getInterventionClientName(intervention, clientsById),
          adresse: String(client?.adresse || client?.address || '—'),
          ice: String(client?.ice || client?.identifiantFiscal || '—'),
        },
        items: [
          { designation: 'Type d’intervention', value: interventionType },
          {
            designation: 'Statut',
            value: getStatus(intervention),
          },
          {
            designation: 'Date et heure',
            value: formatDateTime(intervention.dateIntervention || intervention.dateHeure),
          },
          {
            designation: 'Technicien assigné',
            value: String(
              intervention.technicien || intervention.technician || intervention.technicianName || '—',
            ),
          },
          {
            designation: 'Équipement',
            value: [
              getInterventionElevatorName(intervention, elevatorsById),
              elevator?.type || intervention.elevatorType,
              elevator?.adresseInstallation || intervention.adresseInstallation,
            ]
              .filter(Boolean)
              .join(' · '),
          },
          ...items,
        ],
        notes,
        companyInfo,
        layout: 'details',
        signatureLabel: 'Signature du Client',
        showTotals: false,
      })

      showToast('success', 'La fiche d’intervention PDF a été générée.')
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

  const isLoading =
    isLoadingInterventions || isLoadingClients || isLoadingElevators

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <Toast onClose={() => setToast(null)} toast={toast} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <Wrench aria-hidden="true" className="h-4 w-4" />
            Suivi technique
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Interventions
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Planifiez et documentez les interventions sur les équipements de vos clients.
          </p>
        </div>
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:w-auto"
          onClick={() => setModalIntervention(null)}
          type="button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Nouvelle intervention
        </button>
      </header>

      <section aria-label="Synthèse des interventions" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Fiches enregistrées</p>
            <FileText aria-hidden="true" className="h-4 w-4 text-blue-700" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {interventions.length}
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Planifiées</p>
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-blue-800">{plannedCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">En cours</p>
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-700">{inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Terminées</p>
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-700">
            {completedCount}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">Registre des interventions</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredInterventions.length} fiche{filteredInterventions.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(15rem,1fr)_12rem] sm:items-center sm:w-[min(100%,34rem)]">
            <label className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Rechercher une intervention"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="N° fiche, client, équipement..."
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
                {INTERVENTION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {interventionError && (
          <div
            className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chargement des interventions impossible : {interventionError}</span>
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
        {elevatorError && (
          <div
            className="mx-4 mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chargement des équipements impossible : {elevatorError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12">
            <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin text-blue-700" />
            <p className="mt-3 text-sm text-slate-500">Chargement des interventions...</p>
          </div>
        ) : filteredInterventions.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <Wrench aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search || statusFilter !== 'Tous'
                ? 'Aucune intervention ne correspond aux filtres'
                : 'Aucune intervention pour le moment'}
            </h3>
            <p className="mt-1 max-w-md text-sm leading-5 text-slate-500">
              {search || statusFilter !== 'Tous'
                ? 'Modifiez la recherche ou le filtre pour afficher d’autres fiches.'
                : 'Créez une fiche pour suivre les interventions de vos techniciens.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    N° Fiche
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Équipement concerné
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Technicien
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
                {filteredInterventions.map((intervention) => {
                  const number = getInterventionNumber(intervention)
                  const isExporting = exportingId === intervention.id

                  return (
                    <tr className="transition hover:bg-slate-50/70" key={intervention.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {number}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                          <CalendarClock aria-hidden="true" className="h-4 w-4 text-slate-400" />
                          {formatDateTime(
                            intervention.dateIntervention ||
                              intervention.dateHeure ||
                              intervention.date,
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm font-semibold text-slate-900">
                          {getInterventionClientName(intervention, clientsById)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate font-mono text-xs font-semibold text-slate-800">
                          {getInterventionElevatorName(intervention, elevatorsById)}
                        </span>
                        {elevatorsById.get(getInterventionElevatorId(intervention))?.type && (
                          <span className="mt-1 block max-w-xs truncate text-xs text-slate-500">
                            {elevatorsById.get(getInterventionElevatorId(intervention)).type}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {intervention.type || '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {intervention.technicien ||
                          intervention.technician ||
                          intervention.technicianName ||
                          '—'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={getStatus(intervention)} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={`Exporter la fiche ${number} en PDF`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-wait disabled:opacity-50"
                            disabled={Boolean(exportingId)}
                            onClick={() => void handleExport(intervention)}
                            title="Exporter la fiche d’intervention en PDF"
                            type="button"
                          >
                            {isExporting ? (
                              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download aria-hidden="true" className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            aria-label={`Modifier la fiche ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            onClick={() => setModalIntervention(intervention)}
                            title="Modifier l’intervention"
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            aria-label={`Supprimer la fiche ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                            onClick={() => void handleDelete(intervention)}
                            title="Supprimer l’intervention"
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

      {modalIntervention !== undefined && (
        <InterventionForm
          intervention={modalIntervention}
          onClose={() => setModalIntervention(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
