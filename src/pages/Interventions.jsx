import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpDown,
  CalendarClock,
  ClipboardCheck,
  Download,
  Eye,
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
import TablePdfExportButton from '../components/TablePdfExportButton.jsx'
import { db } from '../firebase.js'

const INTERVENTION_STATUSES = ['Planifiée', 'En cours', 'Terminée', 'Annulée']

function getInterventionNumber(intervention) {
  return String(
    intervention.number ||
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

function getInterventionTechnician(intervention) {
  return String(
    intervention.technicien ||
      intervention.technician ||
      intervention.technicianName ||
      '',
  ).trim()
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

function isInterventionOverdue(intervention) {
  if (getStatus(intervention) !== 'Planifiée') {
    return false
  }

  const date = toDate(
    intervention.dateIntervention || intervention.dateHeure || intervention.date,
  )
  return Boolean(date && date.getTime() < Date.now())
}

function getParts(intervention) {
  const source =
    intervention.partsUsed ??
    intervention.piecesRemplacees ??
    intervention.partsReplaced ??
    []
  const entries = Array.isArray(source)
    ? source
    : String(source)
        .split(/\r?\n|;/)
        .map((part) => part.trim())
        .filter(Boolean)

  return entries
    .map((part) => {
      if (typeof part === 'string') {
        return { designation: part.trim(), quantity: 1 }
      }

      if (!part || typeof part !== 'object') {
        return null
      }

      const designation = String(
        part.designation || part.name || part.nom || part.description || part.reference || '',
      ).trim()
      const parsedQuantity = Number(part.quantity ?? part.quantite ?? part.qty ?? 1)
      return {
        designation: designation || 'Pièce remplacée',
        quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1,
      }
    })
    .filter((part) => part?.designation)
}

function getMaintenanceChecklist(intervention) {
  const checklist =
    intervention.checklistMaintenance || intervention.maintenanceChecklist || []
  return Array.isArray(checklist)
    ? checklist.map(String).filter(Boolean)
    : String(checklist)
        .split(/\r?\n|;/)
        .map((item) => item.trim())
        .filter(Boolean)
}

function getElapsedTimeLabel(intervention) {
  const storedMinutes = Number(intervention.tempsPasseMinutes)
  let minutes =
    intervention.tempsPasseMinutes !== null &&
    intervention.tempsPasseMinutes !== undefined &&
    intervention.tempsPasseMinutes !== '' &&
    Number.isFinite(storedMinutes) &&
    storedMinutes >= 0
      ? storedMinutes
      : null

  if (minutes === null && intervention.heureArrivee && intervention.heureDepart) {
    const parseTime = (time) => {
      const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(time))
      return match ? Number(match[1]) * 60 + Number(match[2]) : null
    }
    const arrival = parseTime(intervention.heureArrivee)
    const departure = parseTime(intervention.heureDepart)
    if (arrival !== null && departure !== null) {
      minutes = departure >= arrival ? departure - arrival : 24 * 60 - arrival + departure
    }
  }

  if (minutes === null) {
    return '—'
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return [hours ? `${hours} h` : '', remainingMinutes ? `${remainingMinutes} min` : '']
    .filter(Boolean)
    .join(' ') || '0 min'
}

function InterventionDetailItem({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-800">
        {value || '—'}
      </dd>
    </div>
  )
}

function InterventionDetailsModal({ intervention, clientName, elevatorName, onClose }) {
  const checklist = getMaintenanceChecklist(intervention)
  const parts = getParts(intervention)

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
        aria-labelledby="intervention-details-title"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Fiche d’intervention
            </p>
            <h2
              className="mt-1 text-lg font-semibold text-slate-900"
              id="intervention-details-title"
            >
              {getInterventionNumber(intervention)}
            </h2>
          </div>
          <button
            aria-label="Fermer les détails de l’intervention"
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
              <InterventionDetailItem label="Client" value={clientName} />
              <InterventionDetailItem label="Équipement" value={elevatorName} />
              <InterventionDetailItem
                label="Date d’intervention"
                value={formatDateTime(
                  intervention.dateIntervention || intervention.dateHeure || intervention.date,
                )}
              />
              <InterventionDetailItem label="Type" value={intervention.type} />
              <InterventionDetailItem
                label="Technicien"
                value={getInterventionTechnician(intervention)}
              />
              <InterventionDetailItem label="Statut" value={getStatus(intervention)} />
              <InterventionDetailItem
                label="Heure d’arrivée"
                value={intervention.heureArrivee || intervention.arrivalTime}
              />
              <InterventionDetailItem
                label="Heure de départ"
                value={intervention.heureDepart || intervention.departureTime}
              />
              <InterventionDetailItem label="Temps passé" value={getElapsedTimeLabel(intervention)} />
              <InterventionDetailItem
                label="Problème signalé"
                value={
                  intervention.descriptionProbleme ||
                  intervention.probleme ||
                  intervention.description
                }
              />
              <InterventionDetailItem
                label="Travaux effectués"
                value={
                  intervention.travauxEffectues ||
                  intervention.rapport ||
                  intervention.report
                }
              />
              <InterventionDetailItem
                label="Pièces remplacées"
                value={parts.map((part) => `${part.designation} (Qté : ${part.quantity})`).join('\n')}
              />
              <InterventionDetailItem
                label="Observations internes"
                value={
                  intervention.observationsInternes ||
                  intervention.internalNotes
                }
              />
            </dl>
            <section
              aria-labelledby="intervention-details-checklist"
              className="rounded-lg border border-slate-200 p-4"
            >
              <h3
                className="text-sm font-semibold text-slate-800"
                id="intervention-details-checklist"
              >
                Checklist de maintenance
              </h3>
              {checklist.length ? (
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {checklist.map((task) => (
                    <li className="inline-flex items-center gap-2 text-sm text-slate-700" key={task}>
                      <ClipboardCheck aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                      {task}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Aucune tâche cochée.</p>
              )}
            </section>
          </div>
        </div>
      </section>
    </div>
  )
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

export default function Interventions() {
  const [interventions, setInterventions] = useState([])
  const [clients, setClients] = useState([])
  const [elevators, setElevators] = useState([])
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [isLoadingInterventions, setIsLoadingInterventions] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [isLoadingElevators, setIsLoadingElevators] = useState(true)
  const [interventionError, setInterventionError] = useState('')
  const [clientError, setClientError] = useState('')
  const [elevatorError, setElevatorError] = useState('')
  const [modalIntervention, setModalIntervention] = useState(undefined)
  const [detailsIntervention, setDetailsIntervention] = useState(undefined)
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
          getInterventionTechnician(intervention),
        ]
        return searchableValues.some((value) => normalizeSearch(value || '').includes(normalizedQuery))
      })
      .sort((first, second) => {
        if (sortConfig.key === 'technician') {
          const order = getInterventionTechnician(first).localeCompare(
            getInterventionTechnician(second),
            'fr',
            { sensitivity: 'base', numeric: true },
          )
          return sortConfig.direction === 'asc' ? order : -order
        }

        const firstDate = toDate(
          first.dateIntervention || first.dateHeure || first.date,
        )?.getTime()
        const secondDate = toDate(
          second.dateIntervention || second.dateHeure || second.date,
        )?.getTime()
        if (firstDate === undefined || secondDate === undefined) {
          return firstDate === undefined ? (secondDate === undefined ? 0 : 1) : -1
        }

        const order = firstDate - secondDate
        return sortConfig.direction === 'asc' ? order : -order
      })
  }, [clientsById, elevatorsById, interventions, search, sortConfig, statusFilter])

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

  function handleSort(key) {
    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc',
    }))
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
      const companyInfo = getCompanyInfo(
        settingsSnapshot.exists() ? settingsSnapshot.data() : {},
      )
      const client = clientsById.get(getInterventionClientId(intervention))
      const elevator = elevatorsById.get(getInterventionElevatorId(intervention))
      const parts = getParts(intervention)
      const [{ pdf }, { default: InterventionPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/pdf/InterventionPdfDocument.jsx'),
      ])
      const documentIntervention = {
        ...intervention,
        number: getInterventionNumber(intervention),
        partsUsed: parts,
        clientInfo: {
          ...client,
          nom: getInterventionClientName(intervention, clientsById),
          adresse: client?.adresse || client?.address || intervention.clientAddress || '',
          telephone:
            client?.telephone ||
            client?.téléphone ||
            client?.phone ||
            intervention.clientPhone ||
            '',
        },
        equipmentInfo: {
          ...elevator,
          type: elevator?.type || intervention.elevatorType || intervention.equipmentType || '',
          numeroSerie:
            elevator?.numeroSerie ||
            elevator?.serialNumber ||
            elevator?.reference ||
            intervention.elevatorReference ||
            intervention.equipmentReference ||
            '',
          adresseInstallation:
            elevator?.adresseInstallation ||
            elevator?.address ||
            intervention.adresseInstallation ||
            intervention.equipmentAddress ||
            '',
        },
        companyInfo,
      }
      const blob = await pdf(
        <InterventionPdfDocument intervention={documentIntervention} />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Intervention_${getInterventionNumber(intervention)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)

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
        <div className="flex flex-col gap-2 sm:flex-row">
          <TablePdfExportButton
            columns={[
              { label: 'N° Fiche', value: getInterventionNumber },
              { label: 'Date', value: (intervention) => formatDateTime(intervention.dateIntervention || intervention.dateHeure || intervention.date) },
              { label: 'Client', value: (intervention) => getInterventionClientName(intervention, clientsById) },
              { label: 'Type', value: (intervention) => intervention.type || '—' },
              { label: 'Technicien', value: getInterventionTechnician },
              { label: 'Statut', value: getStatus },
            ]}
            disabled={isLoading}
            filename="Liste-interventions"
            rows={filteredInterventions}
            title="Liste des interventions"
          />
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:w-auto"
            onClick={() => setModalIntervention(null)}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nouvelle intervention
          </button>
        </div>
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
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    N° Fiche
                  </th>
                  <th
                    aria-sort={sortConfig.key === 'date'
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : 'none'}
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <button
                      aria-label={`Trier par date ${sortConfig.key === 'date' && sortConfig.direction === 'asc' ? 'décroissante' : 'croissante'}`}
                      className="inline-flex items-center gap-2 text-left transition hover:text-blue-700 focus:outline-none focus:text-blue-700"
                      onClick={() => handleSort('date')}
                      type="button"
                    >
                      Date
                      <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>
                  <th
                    aria-sort={sortConfig.key === 'technician'
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : 'none'}
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <button
                      aria-label={`Trier par technicien ${sortConfig.key === 'technician' && sortConfig.direction === 'asc' ? 'décroissant' : 'croissant'}`}
                      className="inline-flex items-center gap-2 text-left transition hover:text-blue-700 focus:outline-none focus:text-blue-700"
                      onClick={() => handleSort('technician')}
                      type="button"
                    >
                      Technicien
                      <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
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
                  const dateValue =
                    intervention.dateIntervention ||
                    intervention.dateHeure ||
                    intervention.date
                  const overdue = isInterventionOverdue(intervention)

                  return (
                    <tr className="transition hover:bg-slate-50/70" key={intervention.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {number}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                          {overdue ? (
                            <AlertCircle
                              aria-label="Intervention planifiée en retard"
                              className="h-4 w-4 shrink-0 text-red-600"
                              role="img"
                            />
                          ) : (
                            <CalendarClock
                              aria-hidden="true"
                              className="h-4 w-4 text-slate-400"
                            />
                          )}
                          {formatDateTime(dateValue)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm font-semibold text-slate-900">
                          {getInterventionClientName(intervention, clientsById)}
                        </span>
                        <span className="mt-1 block max-w-xs truncate font-mono text-[11px] text-slate-500">
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
                        {getInterventionTechnician(intervention) || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={getStatus(intervention)} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={`Afficher les détails de la fiche ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            onClick={() => setDetailsIntervention(intervention)}
                            title="Afficher les détails de l’intervention"
                            type="button"
                          >
                            <Eye aria-hidden="true" className="h-4 w-4" />
                          </button>
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
      {detailsIntervention !== undefined && (
        <InterventionDetailsModal
          clientName={getInterventionClientName(detailsIntervention, clientsById)}
          elevatorName={getInterventionElevatorName(detailsIntervention, elevatorsById)}
          intervention={detailsIntervention}
          onClose={() => setDetailsIntervention(undefined)}
        />
      )}
    </div>
  )
}
