import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  LoaderCircle,
  RefreshCw,
  Wallet,
  Wrench,
  X,
} from 'lucide-react'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/useAuth.js'

const CONTRACT_TYPES = ['Maintenance', 'Modernisation']
const CONTRACT_STATUSES = ['En négociation', 'Actif', 'Résilié']
const BILLING_FREQUENCIES = ['Mensuelle', 'Trimestrielle', 'Annuelle']
const VAT_RATES = [0, 7, 10, 14, 20]
const MAX_CLAUSE_LENGTH = 10000
const STANDARD_CONTRACT_CLAUSES = [
  {
    label: 'Maintenance préventive',
    text: 'Le prestataire s’engage à effectuer des visites mensuelles de contrôle et de graissage.',
  },
  {
    label: 'Dépannage',
    text: 'Intervention garantie sous 24h ouvrables en cas de panne bloquante.',
  },
  {
    label: 'Pièces de rechange',
    text: 'Le remplacement des pièces d’usure normale est facturé séparément sur devis.',
  },
  {
    label: 'Exclusions',
    text: 'Les pannes causées par vandalisme, inondation ou force majeure ne sont pas couvertes.',
  },
]

function getClientName(client) {
  return String(client.nom || client.raisonSociale || client.name || 'Client sans nom')
}

function getDateInputValue(value) {
  if (!value) {
    return ''
  }

  let date = value
  if (typeof date?.toDate === 'function') {
    date = date.toDate()
  } else if (typeof date === 'string') {
    return /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : ''
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getNextDateInputValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined
  }

  const [year, month, day] = value.split('-').map(Number)
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1))
  return [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, '0'),
    String(nextDate.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function getInitialFormData(contract) {
  const elevatorIds =
    contract?.elevatorIds || contract?.equipementIds || contract?.equipmentIds || []

  return {
    clientId: String(contract?.clientId || ''),
    clientName: String(contract?.clientName || ''),
    numero: String(contract?.numero || contract?.contractNumber || ''),
    type: String(contract?.type || CONTRACT_TYPES[0]),
    dateDebut: getDateInputValue(contract?.dateDebut || contract?.startDate),
    dateFin: getDateInputValue(contract?.dateFin || contract?.endDate),
    status: String(contract?.status || contract?.statut || 'En négociation'),
    elevatorIds: Array.isArray(elevatorIds) ? elevatorIds.map(String) : [],
    montantHT: String(contract?.montantHT ?? contract?.amountHT ?? ''),
    tauxTVA: String(contract?.tauxTVA ?? contract?.vatRate ?? 20),
    frequenceFacturation: String(
      contract?.frequenceFacturation || contract?.billingFrequency || BILLING_FREQUENCIES[0],
    ),
    clauses: String(contract?.clauses || contract?.conditions || ''),
  }
}

function getElevatorReference(elevator) {
  return String(
    elevator.reference || elevator.numeroSerie || elevator.serialNumber || 'Sans référence',
  )
}

function getElevatorDescription(elevator) {
  const type = String(elevator.type || 'Équipement')
  const brand = String(elevator.marque || elevator.brand || '')
  return brand ? `${type} · ${brand}` : type
}

function getTotalTTC(amount, rate) {
  const parsedAmount = Number(amount)
  const parsedRate = Number(rate)
  if (!Number.isFinite(parsedAmount) || !Number.isFinite(parsedRate)) {
    return 0
  }

  return Math.round((parsedAmount * (1 + parsedRate / 100) + Number.EPSILON) * 100) / 100
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MAD`
}

function TextField({
  id,
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  required = false,
  min,
  max,
  step,
  disabled = false,
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
      {error && (
        <p className="mt-1.5 text-xs text-red-700" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

function SelectField({ id, label, name, value, onChange, options, error, disabled = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>
      <select
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
        }`}
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-red-700" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

function FormTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'general', label: 'Infos générales', icon: FileText },
    { id: 'equipment', label: 'Équipements couverts', icon: Building2 },
    { id: 'finance', label: 'Finances & clauses', icon: Wallet },
  ]

  return (
    <div aria-label="Sections du contrat" className="grid grid-cols-3 gap-1 border-b border-slate-200 px-4 sm:px-7" role="tablist">
      {tabs.map(({ id, label, icon: Icon }, index) => {
        const isActive = activeTab === id
        return (
          <button
            aria-label={`Étape ${index + 1} : ${label}`}
            aria-controls={`contract-panel-${id}`}
            aria-selected={isActive}
            className={`relative flex min-h-14 items-center justify-center gap-2 px-2 py-3 text-center text-xs font-semibold transition sm:min-h-16 sm:text-sm ${
              isActive ? 'text-blue-800' : 'text-slate-500 hover:text-slate-800'
            }`}
            id={`contract-tab-${id}`}
            key={id}
            onClick={() => onChange(id)}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{index + 1}</span>
            {isActive && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-700" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function ContractForm({ contract = null, onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState(() => getInitialFormData(contract))
  const [clients, setClients] = useState([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [clientLoadError, setClientLoadError] = useState('')
  const [clientReloadKey, setClientReloadKey] = useState(0)
  const [elevators, setElevators] = useState([])
  const [isLoadingElevators, setIsLoadingElevators] = useState(
    () => Boolean(getInitialFormData(contract).clientId),
  )
  const [elevatorLoadError, setElevatorLoadError] = useState('')
  const [elevatorReloadKey, setElevatorReloadKey] = useState(0)
  const [activeTab, setActiveTab] = useState('general')
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
        setElevatorLoadError('')
        setIsLoadingElevators(false)
        return
      }

      setIsLoadingElevators(true)
      setElevatorLoadError('')

      try {
        const elevatorQuery = query(
          collection(db, 'elevators'),
          where('clientId', '==', formData.clientId),
        )
        const snapshot = await getDocs(elevatorQuery)
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
          const availableElevatorIds = new Set(clientElevators.map((elevator) => elevator.id))
          setElevators(clientElevators)
          setFormData((previous) => ({
            ...previous,
            elevatorIds: previous.elevatorIds.filter((id) => availableElevatorIds.has(id)),
          }))
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

  const selectedElevators = useMemo(
    () => elevators.filter((elevator) => formData.elevatorIds.includes(elevator.id)),
    [elevators, formData.elevatorIds],
  )
  const totalTTC = getTotalTTC(formData.montantHT, formData.tauxTVA)

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
            elevatorIds: [],
          }
        : {}),
    }))
    setErrors((previous) => {
      const nextErrors = { ...previous }
      delete nextErrors[name]

      if (name === 'dateDebut' || name === 'dateFin') {
        const startDate = name === 'dateDebut' ? value : formData.dateDebut
        const endDate = name === 'dateFin' ? value : formData.dateFin

        if (startDate && endDate && endDate <= startDate) {
          nextErrors.dateFin = 'La date de fin doit être strictement postérieure à la date de début.'
        } else {
          delete nextErrors.dateFin
        }
      }

      return nextErrors
    })
    setFormError('')
  }

  function appendStandardClause(event) {
    const clause = STANDARD_CONTRACT_CLAUSES.find((item) => item.label === event.target.value)
    if (!clause) {
      return
    }

    const currentClauses = formData.clauses.trim()
    const nextClauses = currentClauses
      ? `${currentClauses}\n\n${clause.text}`
      : clause.text

    setFormData((previous) => ({ ...previous, clauses: nextClauses }))
    setErrors((previous) => {
      const nextErrors = { ...previous }
      if (nextClauses.length > MAX_CLAUSE_LENGTH) {
        nextErrors.clauses = `Les clauses ne doivent pas dépasser ${MAX_CLAUSE_LENGTH.toLocaleString('fr-FR')} caractères.`
      } else {
        delete nextErrors.clauses
      }
      return nextErrors
    })
    setFormError('')
  }

  function toggleElevator(elevatorId) {
    setFormData((previous) => ({
      ...previous,
      elevatorIds: previous.elevatorIds.includes(elevatorId)
        ? previous.elevatorIds.filter((id) => id !== elevatorId)
        : [...previous.elevatorIds, elevatorId],
    }))
    setErrors((previous) => {
      if (!previous.elevatorIds) {
        return previous
      }
      const nextErrors = { ...previous }
      delete nextErrors.elevatorIds
      return nextErrors
    })
  }

  function validate() {
    const nextErrors = {}
    const number = formData.numero.trim().toLocaleUpperCase('fr-FR')
    const amount = Number(formData.montantHT)
    const taxRate = Number(formData.tauxTVA)

    if (!clients.some((client) => client.id === formData.clientId)) {
      nextErrors.clientId = 'Sélectionnez un client valide.'
    }
    if (!number) {
      nextErrors.numero = 'Le numéro de contrat est obligatoire.'
    } else if (!/^[\p{L}\d][\p{L}\d._/-]{2,49}$/u.test(number)) {
      nextErrors.numero = 'Utilisez 3 à 50 caractères (lettres, chiffres, point, tiret ou slash).'
    }
    if (!CONTRACT_TYPES.includes(formData.type)) {
      nextErrors.type = 'Sélectionnez un type de contrat valide.'
    }
    if (!formData.dateDebut) {
      nextErrors.dateDebut = 'La date de début est obligatoire.'
    }
    if (!formData.dateFin) {
      nextErrors.dateFin = 'La date de fin est obligatoire.'
    } else if (formData.dateDebut && formData.dateFin <= formData.dateDebut) {
      nextErrors.dateFin = 'La date de fin doit être strictement postérieure à la date de début.'
    }
    if (!CONTRACT_STATUSES.includes(formData.status)) {
      nextErrors.status = 'Sélectionnez un statut valide.'
    }
    if (!Number.isFinite(amount) || amount <= 0 || formData.montantHT.trim() === '') {
      nextErrors.montantHT = 'Le montant HT doit être un nombre strictement positif.'
    }
    if (selectedElevators.length === 0) {
      nextErrors.elevatorIds = 'Sélectionnez au moins un équipement couvert.'
    }
    if (!VAT_RATES.includes(taxRate)) {
      nextErrors.tauxTVA = 'Sélectionnez un taux de TVA valide.'
    }
    if (!BILLING_FREQUENCIES.includes(formData.frequenceFacturation)) {
      nextErrors.frequenceFacturation = 'Sélectionnez une fréquence de facturation valide.'
    }
    if (formData.clauses.trim().length > MAX_CLAUSE_LENGTH) {
      nextErrors.clauses = `Les clauses ne doivent pas dépasser ${MAX_CLAUSE_LENGTH.toLocaleString('fr-FR')} caractères.`
    }

    setErrors(nextErrors)
    if (
      nextErrors.clientId ||
      nextErrors.numero ||
      nextErrors.type ||
      nextErrors.dateDebut ||
      nextErrors.dateFin ||
      nextErrors.status
    ) {
      setActiveTab('general')
    } else if (nextErrors.elevatorIds) {
      setActiveTab('equipment')
    } else if (
      nextErrors.montantHT ||
      nextErrors.tauxTVA ||
      nextErrors.frequenceFacturation ||
      nextErrors.clauses
    ) {
      setActiveTab('finance')
    }

    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (isLoadingElevators) {
      setFormError('Attendez la fin du chargement des équipements avant d’enregistrer.')
      setActiveTab('equipment')
      return
    }
    if (elevatorLoadError) {
      setFormError('Rechargez la liste des équipements avant d’enregistrer le contrat.')
      setActiveTab('equipment')
      return
    }

    if (!validate()) {
      return
    }

    const selectedClient = clients.find((client) => client.id === formData.clientId)
    if (!selectedClient) {
      setFormError('Le client sélectionné est introuvable. Rechargez la liste puis réessayez.')
      setActiveTab('general')
      return
    }

    setIsSaving(true)
    const numero = formData.numero.trim().toLocaleUpperCase('fr-FR')
    const elevatorDetails = selectedElevators.map((elevator) => ({
      id: elevator.id,
      reference: getElevatorReference(elevator),
      type: String(elevator.type || 'Équipement'),
      marque: String(elevator.marque || elevator.brand || ''),
      adresseInstallation: String(
        elevator.adresseInstallation || elevator.adresse || elevator.installationAddress || '',
      ),
    }))
    const payload = {
      clientId: selectedClient.id,
      clientName: getClientName(selectedClient),
      numero,
      type: formData.type,
      dateDebut: formData.dateDebut,
      dateFin: formData.dateFin,
      status: formData.status,
      elevatorIds: selectedElevators.map((elevator) => elevator.id),
      elevatorDetails,
      montantHT: Number(formData.montantHT),
      tauxTVA: Number(formData.tauxTVA),
      totalTTC,
      frequenceFacturation: formData.frequenceFacturation,
      clauses: formData.clauses.trim(),
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || null,
    }

    let savedAction
    try {
      if (contract?.id) {
        await updateDoc(doc(db, 'contracts', contract.id), payload)
        savedAction = 'updated'
      } else {
        await addDoc(collection(db, 'contracts'), {
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
        aria-labelledby="contract-form-title"
        aria-modal="true"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <FileText aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Gestion contractuelle
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900" id="contract-form-title">
                {contract ? 'Modifier le contrat' : 'Nouveau contrat'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Les champs marqués d’un astérisque sont obligatoires.
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

        <FormTabs activeTab={activeTab} onChange={setActiveTab} />

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            <section
              aria-labelledby="contract-tab-general"
              className={activeTab === 'general' ? 'space-y-5' : 'hidden'}
              id="contract-panel-general"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="contract-client">
                    Client
                    <span aria-hidden="true" className="ml-1 text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Building2
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      aria-describedby={errors.clientId ? 'contract-client-error' : undefined}
                      aria-invalid={Boolean(errors.clientId)}
                      className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                        errors.clientId
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                      }`}
                      disabled={isSaving || isLoadingClients || clients.length === 0}
                      id="contract-client"
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
                    <p className="mt-1.5 text-xs text-red-700" id="contract-client-error">
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
                        onClick={() => setClientReloadKey((key) => key + 1)}
                        type="button"
                      >
                        <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                        Réessayer
                      </button>
                    </div>
                  )}
                </div>

                <TextField
                  error={errors.numero}
                  id="contract-number"
                  label="Numéro de contrat"
                  name="numero"
                  onChange={handleChange}
                  placeholder="CT-2026-001"
                  required
                  value={formData.numero}
                  disabled={isSaving}
                />
                <SelectField
                  error={errors.type}
                  id="contract-type"
                  label="Type de contrat"
                  name="type"
                  onChange={handleChange}
                  options={CONTRACT_TYPES.map((type) => ({ value: type, label: type }))}
                  value={formData.type}
                  disabled={isSaving}
                />
                <SelectField
                  error={errors.status}
                  id="contract-status"
                  label="Statut du contrat"
                  name="status"
                  onChange={handleChange}
                  options={CONTRACT_STATUSES.map((status) => ({ value: status, label: status }))}
                  value={formData.status}
                  disabled={isSaving}
                />
                <TextField
                  error={errors.dateDebut}
                  id="contract-start-date"
                  label="Date de début"
                  name="dateDebut"
                  onChange={handleChange}
                  required
                  type="date"
                  value={formData.dateDebut}
                  disabled={isSaving}
                />
                <TextField
                  error={errors.dateFin}
                  id="contract-end-date"
                  label="Date de fin"
                  name="dateFin"
                  onChange={handleChange}
                  required
                  type="date"
                  min={getNextDateInputValue(formData.dateDebut)}
                  value={formData.dateFin}
                  disabled={isSaving}
                />
              </div>
            </section>

            <section
              aria-labelledby="contract-tab-equipment"
              className={activeTab === 'equipment' ? 'space-y-5' : 'hidden'}
              id="contract-panel-equipment"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Équipements couverts</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    La liste est limitée aux équipements rattachés au client sélectionné.
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-800">
                  {selectedElevators.length} sélectionné{selectedElevators.length === 1 ? '' : 's'}
                </span>
              </div>

              {!formData.clientId ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                  <Building2 aria-hidden="true" className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Sélectionnez d’abord un client
                  </p>
                  <button
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-800 hover:text-blue-950"
                    onClick={() => setActiveTab('general')}
                    type="button"
                  >
                    <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                    Retour aux informations générales
                  </button>
                </div>
              ) : isLoadingElevators ? (
                <div className="flex min-h-36 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                  <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-blue-700" />
                  Chargement des équipements...
                </div>
              ) : elevatorLoadError ? (
                <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{elevatorLoadError}</span>
                  </div>
                  <button
                    className="inline-flex shrink-0 items-center gap-1 font-semibold"
                    onClick={() => setElevatorReloadKey((key) => key + 1)}
                    type="button"
                  >
                    <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                    Réessayer
                  </button>
                </div>
              ) : elevators.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                  <Wrench aria-hidden="true" className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Aucun équipement trouvé pour ce client
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Les équipements doivent être associés au même client dans le Parc d’Ascenseurs.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {elevators.map((elevator) => {
                    const isChecked = formData.elevatorIds.includes(elevator.id)
                    return (
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                          isChecked
                            ? 'border-blue-300 bg-blue-50/60'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        htmlFor={`contract-elevator-${elevator.id}`}
                        key={elevator.id}
                      >
                        <input
                          checked={isChecked}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                          disabled={isSaving}
                          id={`contract-elevator-${elevator.id}`}
                          onChange={() => toggleElevator(elevator.id)}
                          type="checkbox"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-mono text-sm font-semibold text-slate-900">
                              {getElevatorReference(elevator)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {getElevatorDescription(elevator)}
                            </span>
                          </span>
                          {elevator.adresseInstallation && (
                            <span className="mt-1 block truncate text-xs text-slate-500">
                              {elevator.adresseInstallation}
                            </span>
                          )}
                        </span>
                        {isChecked && (
                          <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-700" />
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
              {errors.elevatorIds && (
                <p className="text-xs text-red-700">{errors.elevatorIds}</p>
              )}
            </section>

            <section
              aria-labelledby="contract-tab-finance"
              className={activeTab === 'finance' ? 'space-y-5' : 'hidden'}
              id="contract-panel-finance"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  error={errors.montantHT}
                  id="contract-amount"
                  label="Montant HT (MAD)"
                  name="montantHT"
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={formData.montantHT}
                  disabled={isSaving}
                />
                <SelectField
                  error={errors.tauxTVA}
                  id="contract-vat"
                  label="Taux de TVA"
                  name="tauxTVA"
                  onChange={handleChange}
                  options={VAT_RATES.map((rate) => ({
                    value: String(rate),
                    label: `${rate} %`,
                  }))}
                  value={formData.tauxTVA}
                  disabled={isSaving}
                />
                <SelectField
                  error={errors.frequenceFacturation}
                  id="contract-frequency"
                  label="Fréquence de facturation"
                  name="frequenceFacturation"
                  onChange={handleChange}
                  options={BILLING_FREQUENCIES.map((frequency) => ({
                    value: frequency,
                    label: frequency,
                  }))}
                  value={formData.frequenceFacturation}
                  disabled={isSaving}
                />
                <div className="flex flex-col justify-end rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                    Total TTC calculé
                  </span>
                  <strong className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                    {formatCurrency(totalTTC)}
                  </strong>
                  <span className="mt-1 text-xs text-slate-500">
                    Montant HT + TVA à {formData.tauxTVA || 0} %
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="contract-clauses"
                  >
                    Clauses particulières
                  </label>
                  <select
                    aria-label="Insérer une clause type"
                    className="mb-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 sm:w-auto"
                    disabled={isSaving}
                    onChange={appendStandardClause}
                    value=""
                  >
                    <option disabled value="">
                      Insérer une clause type...
                    </option>
                    {STANDARD_CONTRACT_CLAUSES.map((clause) => (
                      <option key={clause.label} value={clause.label}>
                        {clause.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    aria-describedby={errors.clauses ? 'contract-clauses-error' : undefined}
                    aria-invalid={Boolean(errors.clauses)}
                    className={`min-h-36 w-full resize-y rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                      errors.clauses
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                    }`}
                    disabled={isSaving}
                    id="contract-clauses"
                    maxLength={MAX_CLAUSE_LENGTH + 500}
                    name="clauses"
                    onChange={handleChange}
                    placeholder="Conditions spécifiques, exclusions, délais d’intervention..."
                    rows={5}
                    value={formData.clauses}
                  />
                  {errors.clauses && (
                    <p className="mt-1.5 text-xs text-red-700" id="contract-clauses-error">
                      {errors.clauses}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {formError && (
              <div
                className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
                role="alert"
              >
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200/70 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={activeTab === 'general' || isSaving}
                onClick={() =>
                  setActiveTab(activeTab === 'finance' ? 'equipment' : 'general')
                }
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                Précédent
              </button>
              {activeTab !== 'finance' && (
                <button
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving}
                  onClick={() =>
                    setActiveTab(activeTab === 'general' ? 'equipment' : 'finance')
                  }
                  type="button"
                >
                  Suivant
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                  <FileText aria-hidden="true" className="h-4 w-4" />
                )}
                {isSaving
                  ? 'Enregistrement...'
                  : contract
                    ? 'Enregistrer les modifications'
                    : 'Créer le contrat'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
