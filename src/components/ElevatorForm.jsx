import { useEffect, useState } from 'react'
import {
  Building2,
  Fingerprint,
  Gauge,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Server,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/useAuth.js'

const ELEVATOR_TYPES = [
  'Ascenseur',
  'Monte-charge',
  'Monte-plat',
  'Escalator',
]

const ELEVATOR_STATUSES = ['En marche', 'En panne', 'En maintenance']

function getClientName(client) {
  return String(client.nom || client.raisonSociale || client.name || 'Client sans nom')
}

function getElevatorValue(elevator, aliases, fallback = '') {
  for (const key of aliases) {
    const value = elevator?.[key]
    if (value !== undefined && value !== null) {
      return value
    }
  }

  return fallback
}

function getInitialFormData(elevator) {
  const savedType = String(getElevatorValue(elevator, ['type'], ELEVATOR_TYPES[0]))
  const typeValue = ['Ascenseur Électrique', 'Ascenseur Hydraulique'].includes(savedType)
    ? 'Ascenseur'
    : savedType
  const statusValue = String(
    getElevatorValue(elevator, ['status', 'statut'], ELEVATOR_STATUSES[0]),
  )

  return {
    clientId: String(getElevatorValue(elevator, ['clientId', 'proprietaireId'])),
    clientName: String(getElevatorValue(elevator, ['clientName', 'proprietaireNom'])),
    reference: String(getElevatorValue(elevator, ['reference', 'numeroSerie', 'serialNumber'])),
    type: ELEVATOR_TYPES.includes(typeValue) ? typeValue : ELEVATOR_TYPES[0],
    marque: String(getElevatorValue(elevator, ['marque', 'brand'])),
    moteur: String(getElevatorValue(elevator, ['moteur', 'motor'])),
    niveaux: String(getElevatorValue(elevator, ['niveaux', 'nombreNiveaux', 'floors'])),
    chargeKg: String(getElevatorValue(elevator, ['chargeKg', 'charge', 'capacityKg'])),
    personnes: String(getElevatorValue(elevator, ['personnes', 'passagers', 'capacityPeople'])),
    adresseInstallation: String(
      getElevatorValue(elevator, ['adresseInstallation', 'adresse', 'installationAddress']),
    ),
    status: ELEVATOR_STATUSES.includes(statusValue) ? statusValue : ELEVATOR_STATUSES[0],
  }
}

function Field({
  id,
  name,
  label,
  value,
  onChange,
  icon: Icon,
  type = 'text',
  placeholder,
  error,
  required = false,
  min,
  max,
  step,
  disabled = false,
  autoFocus = false,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
        )}
        <input
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={Boolean(error)}
          autoFocus={autoFocus}
          className={`h-11 w-full rounded-lg border bg-white text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
          } ${Icon ? 'pl-10 pr-3' : 'px-3'}`}
          disabled={disabled}
          id={id}
          max={max}
          min={min}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          step={step}
          type={type}
          value={value}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-700" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

export default function ElevatorForm({ elevator = null, onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState(() => getInitialFormData(elevator))
  const [clients, setClients] = useState([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [clientLoadError, setClientLoadError] = useState('')
  const [clientReloadKey, setClientReloadKey] = useState(0)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadClients() {
      try {
        const clientsSnapshot = await getDocs(collection(db, 'clients'))
        if (isMounted) {
          setClients(
            clientsSnapshot.docs
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
          setClientLoadError('')
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

  const matchedClient =
    clients.find((client) => client.id === formData.clientId) ||
    clients.find(
      (client) =>
        formData.clientName &&
        getClientName(client).toLocaleLowerCase('fr-FR') ===
          formData.clientName.toLocaleLowerCase('fr-FR'),
    )
  const selectedClientId = formData.clientId || matchedClient?.id || ''

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'clientId'
        ? { clientName: getClientName(clients.find((client) => client.id === value) || {}) }
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
    const reference = formData.reference.trim()
    const levels = Number(formData.niveaux)
    const capacity = Number(formData.chargeKg)
    const people = formData.personnes === '' ? undefined : Number(formData.personnes)

    if (!selectedClientId || !clients.some((client) => client.id === selectedClientId)) {
      nextErrors.clientId = 'Sélectionnez un client propriétaire valide.'
    }

    if (!reference) {
      nextErrors.reference = 'La référence ou le numéro de série est obligatoire.'
    } else if (reference.length < 4) {
      nextErrors.reference = 'Le numéro de série doit contenir au moins 4 caractères.'
    } else if (reference.length > 50) {
      nextErrors.reference = 'Le numéro de série ne doit pas dépasser 50 caractères.'
    }

    if (!ELEVATOR_TYPES.includes(formData.type)) {
      nextErrors.type = 'Sélectionnez un type d’équipement valide.'
    }

    if (!formData.marque.trim()) {
      nextErrors.marque = 'La marque est obligatoire.'
    } else if (formData.marque.trim().length > 100) {
      nextErrors.marque = 'La marque ne doit pas dépasser 100 caractères.'
    }

    if (!formData.moteur.trim()) {
      nextErrors.moteur = 'La marque ou le modèle du moteur est obligatoire.'
    } else if (formData.moteur.trim().length > 120) {
      nextErrors.moteur = 'Le moteur ne doit pas dépasser 120 caractères.'
    }

    if (!Number.isInteger(levels) || levels < 2 || levels > 200) {
      nextErrors.niveaux = 'Le nombre de niveaux doit être un entier entre 2 et 200.'
    }

    if (!Number.isFinite(capacity) || capacity < 50 || capacity > 100000) {
      nextErrors.chargeKg = 'La charge utile doit être un nombre compris entre 50 et 100 000 kg.'
    }

    if (people !== undefined && (!Number.isInteger(people) || people < 1 || people > 1000)) {
      nextErrors.personnes = 'Le nombre de personnes doit être un entier entre 1 et 1000.'
    }

    if (!formData.adresseInstallation.trim()) {
      nextErrors.adresseInstallation = 'L’adresse d’installation est obligatoire.'
    } else if (formData.adresseInstallation.trim().length > 500) {
      nextErrors.adresseInstallation = 'L’adresse ne doit pas dépasser 500 caractères.'
    }

    if (!ELEVATOR_STATUSES.includes(formData.status)) {
      nextErrors.status = 'Sélectionnez un statut valide.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!validate()) {
      return
    }

    const selectedClient = clients.find((client) => client.id === selectedClientId)
    if (!selectedClient) {
      setFormError('Le client propriétaire sélectionné est introuvable.')
      return
    }

    setIsSaving(true)

    const payload = {
      clientId: selectedClient.id,
      clientName: getClientName(selectedClient),
      reference: formData.reference.trim(),
      type: formData.type,
      marque: formData.marque.trim(),
      moteur: formData.moteur.trim(),
      niveaux: Number(formData.niveaux),
      chargeKg: Number(formData.chargeKg),
      personnes: formData.personnes === '' ? null : Number(formData.personnes),
      adresseInstallation: formData.adresseInstallation.trim(),
      status: formData.status,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || null,
    }

    let savedAction

    try {
      if (elevator?.id) {
        await updateDoc(doc(db, 'elevators', elevator.id), payload)
        savedAction = 'updated'
      } else {
        await addDoc(collection(db, 'elevators'), {
          ...payload,
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

  function retryClients() {
    setClientLoadError('')
    setIsLoadingClients(true)
    setClientReloadKey((key) => key + 1)
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
        aria-labelledby="elevator-form-title"
        aria-modal="true"
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Parc technique
              </p>
              <h2 id="elevator-form-title" className="mt-1 text-lg font-semibold text-slate-900">
                {elevator ? 'Modifier l’équipement' : 'Ajouter un équipement'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Renseignez les caractéristiques de l’équipement et son propriétaire.
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
            <div className="space-y-5">
              <section
                aria-labelledby="elevator-location-heading"
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900" id="elevator-location-heading">
                    Localisation &amp; affectation
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Associez l’équipement à son propriétaire et à son site d’installation.
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="elevator-client"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Client propriétaire
                      <span className="ml-1 text-red-600" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <UserRound
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      />
                      <select
                        aria-describedby={errors.clientId ? 'elevator-client-error' : undefined}
                        aria-invalid={Boolean(errors.clientId)}
                        className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                          errors.clientId
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                        }`}
                        disabled={isSaving || isLoadingClients || clients.length === 0}
                        id="elevator-client"
                        name="clientId"
                        onChange={handleChange}
                        required
                        value={selectedClientId}
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
                      <p className="mt-1.5 text-xs text-red-700" id="elevator-client-error">
                        {errors.clientId}
                      </p>
                    )}
                    {isLoadingClients && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                        Chargement de la liste des clients
                      </p>
                    )}
                    {clientLoadError && (
                      <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                        <span className="min-w-0 break-words">{clientLoadError}</span>
                        <button
                          className="inline-flex shrink-0 items-center gap-1 font-semibold"
                          onClick={retryClients}
                          type="button"
                        >
                          <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                          Réessayer
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="elevator-address"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Adresse d’installation
                      <span className="ml-1 text-red-600" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <MapPin
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                      />
                      <textarea
                        aria-describedby={
                          errors.adresseInstallation ? 'elevator-address-error' : undefined
                        }
                        aria-invalid={Boolean(errors.adresseInstallation)}
                        className={`min-h-24 w-full resize-y rounded-lg border bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                          errors.adresseInstallation
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                        }`}
                        disabled={isSaving}
                        id="elevator-address"
                        name="adresseInstallation"
                        onChange={handleChange}
                        placeholder="Adresse complète de l’installation"
                        required
                        rows={3}
                        value={formData.adresseInstallation}
                      />
                    </div>
                    {errors.adresseInstallation && (
                      <p className="mt-1.5 text-xs text-red-700" id="elevator-address-error">
                        {errors.adresseInstallation}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section
                aria-labelledby="elevator-technical-heading"
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900" id="elevator-technical-heading">
                    Caractéristiques techniques
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Décrivez le type d’appareil, sa motorisation et ses capacités.
                  </p>
                </div>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="elevator-type"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Type d’équipement
                      <span className="ml-1 text-red-600" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <Building2
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      />
                      <select
                        aria-describedby={errors.type ? 'elevator-type-error' : undefined}
                        aria-invalid={Boolean(errors.type)}
                        className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                          errors.type
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                        }`}
                        disabled={isSaving}
                        id="elevator-type"
                        name="type"
                        onChange={handleChange}
                        required
                        value={formData.type}
                      >
                        {ELEVATOR_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.type && (
                      <p className="mt-1.5 text-xs text-red-700" id="elevator-type-error">
                        {errors.type}
                      </p>
                    )}
                  </div>

                  <Field
                    error={errors.marque}
                    icon={Building2}
                    id="elevator-brand"
                    label="Marque"
                    name="marque"
                    onChange={handleChange}
                    placeholder="Otis, KONE, Schindler..."
                    required
                    value={formData.marque}
                    disabled={isSaving}
                  />
                  <Field
                    error={errors.moteur}
                    icon={Wrench}
                    id="elevator-motor"
                    label="Marque / Moteur"
                    name="moteur"
                    onChange={handleChange}
                    placeholder="Marque ou modèle du moteur"
                    required
                    value={formData.moteur}
                    disabled={isSaving}
                  />
                  <Field
                    error={errors.niveaux}
                    icon={Building2}
                    id="elevator-levels"
                    label="Nombre de niveaux / arrêts"
                    max={200}
                    min={2}
                    name="niveaux"
                    onChange={handleChange}
                    placeholder="Ex. 8"
                    required
                    step={1}
                    type="number"
                    value={formData.niveaux}
                    disabled={isSaving}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      error={errors.chargeKg}
                      icon={Gauge}
                      id="elevator-capacity"
                      label="Charge utile (kg)"
                      max={100000}
                      min={50}
                      name="chargeKg"
                      onChange={handleChange}
                      placeholder="630"
                      required
                      step="any"
                      type="number"
                      value={formData.chargeKg}
                      disabled={isSaving}
                    />
                    <Field
                      error={errors.personnes}
                      id="elevator-people"
                      label="Personnes"
                      max={1000}
                      min={1}
                      name="personnes"
                      onChange={handleChange}
                      placeholder="8"
                      step={1}
                      type="number"
                      value={formData.personnes}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </section>

              <section
                aria-labelledby="elevator-identification-heading"
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
              >
                <div className="mb-4">
                  <h3
                    className="font-semibold text-slate-900"
                    id="elevator-identification-heading"
                  >
                    Identification &amp; état
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Identifiant unique de l’équipement et état opérationnel.
                  </p>
                </div>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <Field
                    autoFocus
                    error={errors.reference}
                    icon={Fingerprint}
                    id="elevator-reference"
                    label="N° de série / Référence"
                    name="reference"
                    onChange={handleChange}
                    placeholder="TGI-2026-001"
                    required
                    value={formData.reference}
                    disabled={isSaving}
                  />

                  <div>
                    <label
                      htmlFor="elevator-status"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Statut actuel
                      <span className="ml-1 text-red-600" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <Server
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      />
                      <select
                        aria-describedby={errors.status ? 'elevator-status-error' : undefined}
                        aria-invalid={Boolean(errors.status)}
                        className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                          errors.status
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                        }`}
                        disabled={isSaving}
                        id="elevator-status"
                        name="status"
                        onChange={handleChange}
                        required
                        value={formData.status}
                      >
                        {ELEVATOR_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.status && (
                      <p className="mt-1.5 text-xs text-red-700" id="elevator-status-error">
                        {errors.status}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {formError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
                  role="alert"
                >
                  {formError}
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
                <Fingerprint aria-hidden="true" className="h-4 w-4" />
              )}
              {isSaving ? 'Enregistrement...' : elevator ? 'Enregistrer les modifications' : 'Ajouter l’équipement'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
