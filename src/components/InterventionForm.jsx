import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CalendarClock,
  ClipboardCheck,
  LoaderCircle,
  RefreshCw,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/useAuth.js'

const INTERVENTION_TYPES = [
  'Maintenance Préventive',
  'Dépannage / Curatif',
  'Installation',
]
const INTERVENTION_STATUSES = ['Planifiée', 'En cours', 'Terminée', 'Annulée']

function getClientName(client) {
  return String(client.nom || client.raisonSociale || client.name || 'Client sans nom')
}

function getElevatorReference(elevator) {
  return String(
    elevator.reference || elevator.numeroSerie || elevator.serialNumber || 'Sans référence',
  )
}

function getElevatorLabel(elevator) {
  const type = String(elevator.type || 'Équipement')
  const brand = String(elevator.marque || elevator.brand || '')
  return `${getElevatorReference(elevator)} — ${type}${brand ? ` · ${brand}` : ''}`
}

function toLocalDateTime(value) {
  if (!value) {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  let date = value
  if (typeof date?.toDate === 'function') {
    date = date.toDate()
  } else if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(date)) {
      return date.slice(0, 16)
    }
    date = new Date(date)
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }

  date = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return date.toISOString().slice(0, 16)
}

function getInitialFormData(intervention) {
  const replacedParts = intervention?.piecesRemplacees || intervention?.partsReplaced || []

  return {
    clientId: String(intervention?.clientId || ''),
    clientName: String(intervention?.clientName || ''),
    elevatorId: String(intervention?.elevatorId || intervention?.equipmentId || ''),
    elevatorReference: String(
      intervention?.elevatorReference || intervention?.equipmentReference || '',
    ),
    type: String(intervention?.type || INTERVENTION_TYPES[0]),
    dateHeure: toLocalDateTime(
      intervention?.dateIntervention || intervention?.dateHeure || intervention?.date,
    ),
    technicien: String(
      intervention?.technicien || intervention?.technician || intervention?.technicianName || '',
    ),
    descriptionProbleme: String(
      intervention?.descriptionProbleme ||
        intervention?.probleme ||
        intervention?.description ||
        '',
    ),
    travauxEffectues: String(
      intervention?.travauxEffectues || intervention?.rapport || intervention?.report || '',
    ),
    piecesRemplacees: Array.isArray(replacedParts)
      ? replacedParts.map(String).join('\n')
      : String(replacedParts),
    status: String(intervention?.status || intervention?.statut || 'Planifiée'),
  }
}

function Field({
  id,
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  required = false,
  disabled = false,
  min,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </label>
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
        }`}
        disabled={disabled}
        id={id}
        min={min}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-700" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

function TextAreaField({
  id,
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  rows = 4,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </label>
      <textarea
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={`w-full resize-y rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
        }`}
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        value={value}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-700" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

export default function InterventionForm({ intervention = null, onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState(() => getInitialFormData(intervention))
  const [clients, setClients] = useState([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [clientLoadError, setClientLoadError] = useState('')
  const [clientReloadKey, setClientReloadKey] = useState(0)
  const [elevators, setElevators] = useState([])
  const [isLoadingElevators, setIsLoadingElevators] = useState(
    () => Boolean(getInitialFormData(intervention).clientId),
  )
  const [elevatorLoadError, setElevatorLoadError] = useState('')
  const [elevatorReloadKey, setElevatorReloadKey] = useState(0)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadClients() {
      setIsLoadingClients(true)
      setClientLoadError('')

      try {
        const snapshot = await getDocs(collection(db, 'clients'))
        if (isMounted) {
          setClients(
            snapshot.docs
              .map((clientDocument) => ({
                ...clientDocument.data(),
                id: clientDocument.id,
              }))
              .sort((first, second) =>
                getClientName(first).localeCompare(getClientName(second), 'fr', {
                  sensitivity: 'base',
                }),
              ),
          )
        }
      } catch (error) {
        if (isMounted) {
          setClientLoadError(
            error instanceof Error ? error.message : 'Impossible de charger les clients.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingClients(false)
        }
      }
    }

    void loadClients()
    return () => {
      isMounted = false
    }
  }, [clientReloadKey])

  useEffect(() => {
    let isMounted = true

    async function loadClientElevators() {
      if (!formData.clientId) {
        setElevators([])
        setIsLoadingElevators(false)
        setElevatorLoadError('')
        return
      }

      setIsLoadingElevators(true)
      setElevatorLoadError('')

      try {
        const snapshot = await getDocs(
          query(
            collection(db, 'elevators'),
            where('clientId', '==', formData.clientId),
          ),
        )
        if (isMounted) {
          const clientElevators = snapshot.docs
            .map((elevatorDocument) => ({
              ...elevatorDocument.data(),
              id: elevatorDocument.id,
            }))
            .sort((first, second) =>
              getElevatorReference(first).localeCompare(getElevatorReference(second), 'fr', {
                sensitivity: 'base',
              }),
            )
          setElevators(clientElevators)
          setFormData((previous) => {
            const selectedElevator = clientElevators.find(
              (elevator) => elevator.id === previous.elevatorId,
            )
            return {
              ...previous,
              elevatorId: selectedElevator?.id || '',
              elevatorReference: selectedElevator ? getElevatorReference(selectedElevator) : '',
            }
          })
        }
      } catch (error) {
        if (isMounted) {
          setElevatorLoadError(
            error instanceof Error
              ? error.message
              : 'Impossible de charger les équipements de ce client.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingElevators(false)
        }
      }
    }

    void loadClientElevators()
    return () => {
      isMounted = false
    }
  }, [elevatorReloadKey, formData.clientId])

  function handleChange(event) {
    const { name, value } = event.target
    if (name === 'clientId') {
      setElevators([])
      setIsLoadingElevators(Boolean(value))
      setElevatorLoadError('')
    }
    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'clientId'
        ? {
            clientName: value
              ? getClientName(clients.find((client) => client.id === value) || {})
              : '',
            elevatorId: '',
            elevatorReference: '',
          }
        : name === 'elevatorId'
          ? {
              elevatorReference: getElevatorReference(
                elevators.find((elevator) => elevator.id === value) || {},
              ),
            }
          : {}),
    }))
    setErrors((previous) => {
      if (!previous[name]) {
        return previous
      }
      const nextErrors = { ...previous }
      delete nextErrors[name]
      return nextErrors
    })
    setFormError('')
  }

  function validate() {
    const nextErrors = {}
    const technician = formData.technicien.trim()
    const problem = formData.descriptionProbleme.trim()

    if (!clients.some((client) => client.id === formData.clientId)) {
      nextErrors.clientId = 'Sélectionnez un client valide.'
    }
    if (!elevators.some((elevator) => elevator.id === formData.elevatorId)) {
      nextErrors.elevatorId = 'Sélectionnez un équipement appartenant au client choisi.'
    }
    if (!INTERVENTION_TYPES.includes(formData.type)) {
      nextErrors.type = 'Sélectionnez un type d’intervention valide.'
    }
    if (!formData.dateHeure || Number.isNaN(new Date(formData.dateHeure).getTime())) {
      nextErrors.dateHeure = 'Saisissez une date et une heure valides.'
    }
    if (!technician) {
      nextErrors.technicien = 'Le nom du technicien est obligatoire.'
    } else if (technician.length > 120) {
      nextErrors.technicien = 'Le nom du technicien ne doit pas dépasser 120 caractères.'
    }
    if (!problem) {
      nextErrors.descriptionProbleme = 'La description du problème est obligatoire.'
    } else if (problem.length > 5000) {
      nextErrors.descriptionProbleme = 'La description ne doit pas dépasser 5 000 caractères.'
    }
    if (formData.travauxEffectues.trim().length > 10000) {
      nextErrors.travauxEffectues = 'Le rapport ne doit pas dépasser 10 000 caractères.'
    }
    if (formData.piecesRemplacees.length > 3000) {
      nextErrors.piecesRemplacees = 'La liste des pièces ne doit pas dépasser 3 000 caractères.'
    }
    if (!INTERVENTION_STATUSES.includes(formData.status)) {
      nextErrors.status = 'Sélectionnez un statut valide.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (isLoadingClients || isLoadingElevators) {
      setFormError('Attendez la fin du chargement des données avant d’enregistrer.')
      return
    }
    if (clientLoadError || elevatorLoadError) {
      setFormError('Rechargez les données nécessaires avant d’enregistrer l’intervention.')
      return
    }
    if (!validate()) {
      return
    }

    const selectedClient = clients.find((client) => client.id === formData.clientId)
    const selectedElevator = elevators.find((elevator) => elevator.id === formData.elevatorId)
    if (!selectedClient || !selectedElevator) {
      setFormError('Le client ou l’équipement sélectionné est introuvable. Rechargez la liste.')
      return
    }

    setIsSaving(true)
    const dateIntervention = new Date(formData.dateHeure)
    const piecesRemplacees = formData.piecesRemplacees
      .split(/\r?\n|;/)
      .map((part) => part.trim())
      .filter(Boolean)
    const payload = {
      clientId: selectedClient.id,
      clientName: getClientName(selectedClient),
      elevatorId: selectedElevator.id,
      elevatorReference: getElevatorReference(selectedElevator),
      elevatorType: String(selectedElevator.type || ''),
      type: formData.type,
      dateIntervention: Timestamp.fromDate(dateIntervention),
      technicien: formData.technicien.trim(),
      descriptionProbleme: formData.descriptionProbleme.trim(),
      travauxEffectues: formData.travauxEffectues.trim(),
      piecesRemplacees,
      status: formData.status,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || null,
    }

    let savedAction
    try {
      if (intervention?.id) {
        await updateDoc(doc(db, 'interventions', intervention.id), payload)
        savedAction = 'updated'
      } else {
        const interventionDocument = doc(collection(db, 'interventions'))
        const interventionYear = dateIntervention.getFullYear()
        await setDoc(interventionDocument, {
          ...payload,
          numero: `INT-${interventionYear}-${interventionDocument.id.slice(0, 6).toUpperCase()}`,
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || null,
        })
        savedAction = 'created'
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? `Enregistrement impossible : ${error.message}`
          : 'Enregistrement impossible. Veuillez réessayer.',
      )
    } finally {
      setIsSaving(false)
    }

    if (savedAction) {
      onSaved?.(savedAction)
    }
  }

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape' && !isSaving) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onKeyDown={handleDialogKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <section
        aria-labelledby="intervention-form-title"
        aria-modal="true"
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Wrench aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Suivi technique
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900" id="intervention-form-title">
                {intervention ? 'Modifier l’intervention' : 'Planifier une intervention'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Associez la fiche à un client et à l’un de ses équipements.
              </p>
            </div>
          </div>
          <button
            aria-label="Fermer le formulaire"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
          <div className="overflow-y-auto px-5 py-6 sm:px-7">
            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="intervention-client"
                >
                  Client
                  <span aria-hidden="true" className="ml-1 text-red-600">*</span>
                </label>
                <div className="relative">
                  <UserRound
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    aria-describedby={errors.clientId ? 'intervention-client-error' : undefined}
                    aria-invalid={Boolean(errors.clientId)}
                    className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                      errors.clientId
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                    }`}
                    disabled={isSaving || isLoadingClients || clients.length === 0}
                    id="intervention-client"
                    name="clientId"
                    onChange={handleChange}
                    value={formData.clientId}
                  >
                    <option value="">
                      {isLoadingClients
                        ? 'Chargement des clients...'
                        : clients.length
                          ? 'Sélectionnez un client'
                          : 'Aucun client disponible'}
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {getClientName(client)}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.clientId && (
                  <p className="mt-1.5 text-xs text-red-700" id="intervention-client-error">
                    {errors.clientId}
                  </p>
                )}
                {clientLoadError && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                    <span className="min-w-0 break-words">{clientLoadError}</span>
                    <button
                      className="inline-flex shrink-0 items-center gap-1 font-semibold"
                      onClick={() => setClientReloadKey((key) => key + 1)}
                      type="button"
                    >
                      <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                      Réessayer
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="intervention-elevator"
                >
                  Équipement concerné
                  <span aria-hidden="true" className="ml-1 text-red-600">*</span>
                </label>
                <div className="relative">
                  <Wrench
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    aria-describedby={errors.elevatorId ? 'intervention-elevator-error' : undefined}
                    aria-invalid={Boolean(errors.elevatorId)}
                    className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                      errors.elevatorId
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                    }`}
                    disabled={
                      isSaving ||
                      !formData.clientId ||
                      isLoadingElevators ||
                      elevators.length === 0 ||
                      Boolean(elevatorLoadError)
                    }
                    id="intervention-elevator"
                    name="elevatorId"
                    onChange={handleChange}
                    value={formData.elevatorId}
                  >
                    <option value="">
                      {!formData.clientId
                        ? 'Sélectionnez d’abord un client'
                        : isLoadingElevators
                          ? 'Chargement des équipements...'
                          : elevatorLoadError
                            ? 'Erreur de chargement'
                            : elevators.length
                              ? 'Sélectionnez un équipement'
                              : 'Aucun équipement pour ce client'}
                    </option>
                    {elevators.map((elevator) => (
                      <option key={elevator.id} value={elevator.id}>
                        {getElevatorLabel(elevator)}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.elevatorId && (
                  <p className="mt-1.5 text-xs text-red-700" id="intervention-elevator-error">
                    {errors.elevatorId}
                  </p>
                )}
                {elevatorLoadError && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                    <span className="min-w-0 break-words">{elevatorLoadError}</span>
                    <button
                      className="inline-flex shrink-0 items-center gap-1 font-semibold"
                      onClick={() => setElevatorReloadKey((key) => key + 1)}
                      type="button"
                    >
                      <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                      Réessayer
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="intervention-type"
                >
                  Type d’intervention
                  <span aria-hidden="true" className="ml-1 text-red-600">*</span>
                </label>
                <select
                  aria-describedby={errors.type ? 'intervention-type-error' : undefined}
                  aria-invalid={Boolean(errors.type)}
                  className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.type
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                  }`}
                  disabled={isSaving}
                  id="intervention-type"
                  name="type"
                  onChange={handleChange}
                  value={formData.type}
                >
                  {INTERVENTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1.5 text-xs text-red-700" id="intervention-type-error">
                    {errors.type}
                  </p>
                )}
              </div>

              <Field
                error={errors.dateHeure}
                id="intervention-date"
                label="Date et heure"
                name="dateHeure"
                onChange={handleChange}
                required
                type="datetime-local"
                value={formData.dateHeure}
                disabled={isSaving}
              />
              <Field
                error={errors.technicien}
                id="intervention-technician"
                label="Technicien assigné"
                name="technicien"
                onChange={handleChange}
                placeholder="Nom du technicien"
                required
                value={formData.technicien}
                disabled={isSaving}
              />

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="intervention-status"
                >
                  Statut
                  <span aria-hidden="true" className="ml-1 text-red-600">*</span>
                </label>
                <div className="relative">
                  <ClipboardCheck
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    aria-describedby={errors.status ? 'intervention-status-error' : undefined}
                    aria-invalid={Boolean(errors.status)}
                    className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                      errors.status
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                    }`}
                    disabled={isSaving}
                    id="intervention-status"
                    name="status"
                    onChange={handleChange}
                    value={formData.status}
                  >
                    {INTERVENTION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.status && (
                  <p className="mt-1.5 text-xs text-red-700" id="intervention-status-error">
                    {errors.status}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <TextAreaField
                  error={errors.descriptionProbleme}
                  id="intervention-problem"
                  label="Description du problème signalé"
                  name="descriptionProbleme"
                  onChange={handleChange}
                  placeholder="Décrivez le problème constaté ou la demande du client..."
                  required
                  rows={3}
                  value={formData.descriptionProbleme}
                  disabled={isSaving}
                />
              </div>
              <div className="sm:col-span-2">
                <TextAreaField
                  error={errors.travauxEffectues}
                  id="intervention-work"
                  label="Travaux effectués / Rapport"
                  name="travauxEffectues"
                  onChange={handleChange}
                  placeholder="Compte rendu des contrôles, réparations et actions effectuées..."
                  rows={4}
                  value={formData.travauxEffectues}
                  disabled={isSaving}
                />
              </div>
              <div className="sm:col-span-2">
                <TextAreaField
                  error={errors.piecesRemplacees}
                  id="intervention-parts"
                  label="Pièces remplacées"
                  name="piecesRemplacees"
                  onChange={handleChange}
                  placeholder={'Une pièce par ligne, par exemple :\nContacteur de porte\nFusible 2A'}
                  rows={3}
                  value={formData.piecesRemplacees}
                  disabled={isSaving}
                />
              </div>

              {formError && (
                <div
                  className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
                  role="alert"
                >
                  <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
            </div>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Annuler
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving || isLoadingClients || clients.length === 0}
              type="submit"
            >
              {isSaving ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarClock aria-hidden="true" className="h-4 w-4" />
              )}
              {isSaving
                ? 'Enregistrement...'
                : intervention
                  ? 'Enregistrer les modifications'
                  : 'Créer la fiche'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
