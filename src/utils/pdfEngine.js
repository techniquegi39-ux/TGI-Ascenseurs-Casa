import { useEffect, useState } from 'react'
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileText,
  Fingerprint,
  Landmark,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldAlert,
} from 'lucide-react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/useAuth.js'

const DEFAULT_FORM = {
  name: 'TGI ASCENSEURS CASA',
  address: '',
  phone: '',
  email: '',
  ice: '',
  rc: '',
  patente: '',
}

function getStoredValue(settings, key, fallback = '') {
  const value = settings?.[key]
  return typeof value === 'string' ? value : fallback
}

function TextField({
  id,
  label,
  value,
  onChange,
  icon: Icon,
  type = 'text',
  placeholder,
  autoComplete,
  required = false,
  disabled = false,
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
          autoComplete={autoComplete}
          className={`h-11 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 ${
            Icon ? 'pl-10 pr-3' : 'px-3'
          }`}
          id={id}
          name={id}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

function AccessDenied() {
  return (
    <section
      aria-labelledby="settings-access-denied-title"
      className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-white p-8 shadow-sm sm:p-10"
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
        <ShieldAlert aria-hidden="true" className="h-7 w-7" />
      </div>
      <h1
        id="settings-access-denied-title"
        className="mt-5 text-center text-xl font-semibold text-slate-900"
      >
        Accès réservé au Directeur
      </h1>
      <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-slate-500">
        Seul le Directeur peut consulter ou modifier les paramètres légaux de l’entreprise.
      </p>
    </section>
  )
}

function LoadingPanel() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin text-blue-700" />
      <p className="mt-4 text-sm font-medium text-slate-600">
        Chargement des paramètres de l’entreprise...
      </p>
    </div>
  )
}

export default function Settings() {
  const { currentUser, userData } = useAuth()
  const isDirector = userData?.role === 'Directeur'
  const [formData, setFormData] = useState({ ...DEFAULT_FORM })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadSettings() {
      if (!isDirector) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError('')

      try {
        const settingsSnapshot = await getDoc(doc(db, 'settings', 'company'))
        if (!isMounted) {
          return
        }

        if (!settingsSnapshot.exists()) {
          setFormData({ ...DEFAULT_FORM })
          return
        }

        const settings = settingsSnapshot.data()
        setFormData({
          name: getStoredValue(settings, 'name', DEFAULT_FORM.name) || DEFAULT_FORM.name,
          address: getStoredValue(settings, 'address'),
          phone: getStoredValue(settings, 'phone'),
          email: getStoredValue(settings, 'email'),
          ice: getStoredValue(settings, 'ice'),
          rc: getStoredValue(settings, 'rc'),
          patente: getStoredValue(settings, 'patente'),
        })
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Impossible de charger les paramètres de l’entreprise.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSettings()

    return () => {
      isMounted = false
    }
  }, [isDirector, reloadKey])

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setFeedback(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!isDirector) {
      setFeedback({
        type: 'error',
        message: 'Seul le Directeur peut modifier ces paramètres.',
      })
      return
    }

    const name = formData.name.trim()
    if (!name) {
      setFeedback({
        type: 'error',
        message: 'Le nom de l’entreprise est obligatoire.',
      })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      await setDoc(
        doc(db, 'settings', 'company'),
        {
          name,
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          ice: formData.ice.trim(),
          rc: formData.rc.trim(),
          patente: formData.patente.trim(),
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null,
        },
        { merge: true },
      )

      setFormData((previous) => ({ ...previous, name }))
      setFeedback({
        type: 'success',
        message: 'Les paramètres de l’entreprise ont été enregistrés.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? `Enregistrement impossible : ${error.message}`
            : 'Enregistrement impossible. Veuillez réessayer.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isDirector) {
    return <AccessDenied />
  }

  if (isLoading) {
    return <LoadingPanel />
  }

  if (loadError) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-slate-900">Chargement impossible</h1>
            <p className="mt-1 break-words text-sm leading-6 text-slate-600">{loadError}</p>
            <button
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
              onClick={() => setReloadKey((key) => key + 1)}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Réessayer
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <Building2 aria-hidden="true" className="h-4 w-4" />
            Administration
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Paramètres de l’entreprise
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Gérez les coordonnées et mentions légales utilisées sur les documents de TGI
            Ascenseurs Casa.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800">
          <BadgeCheck aria-hidden="true" className="h-4 w-4" />
          Accès Directeur
        </span>
      </header>

      <form
        aria-busy={isSaving}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_48px_-30px_rgba(15,23,42,0.28)]"
        onSubmit={handleSubmit}
      >
        <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Identité et coordonnées</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ces informations apparaîtront dans l’en-tête des documents PDF.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-x-6 gap-y-5 px-5 py-6 sm:grid-cols-2 sm:px-8 sm:py-8">
          <div className="sm:col-span-2">
            <TextField
              autoComplete="organization"
              icon={Building2}
              id="name"
              label="Nom de l’entreprise"
              onChange={handleChange}
              placeholder="TGI ASCENSEURS CASA"
              required
              value={formData.name}
              disabled={isSaving}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="mb-2 block text-sm font-medium text-slate-700">
              Adresse complète
            </label>
            <div className="relative">
              <MapPin
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400"
              />
              <textarea
                autoComplete="street-address"
                className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                id="address"
                name="address"
                onChange={handleChange}
                placeholder="Adresse, quartier, ville, code postal"
                rows={3}
                value={formData.address}
                disabled={isSaving}
              />
            </div>
          </div>

          <TextField
            autoComplete="tel"
            icon={Phone}
            id="phone"
            label="Téléphone"
            onChange={handleChange}
            placeholder="+212 5XX XX XX XX"
            type="tel"
            value={formData.phone}
            disabled={isSaving}
          />
          <TextField
            autoComplete="email"
            icon={Mail}
            id="email"
            label="Adresse e-mail"
            onChange={handleChange}
            placeholder="contact@tgi-ascenseurs.ma"
            type="email"
            value={formData.email}
            disabled={isSaving}
          />

          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Fingerprint aria-hidden="true" className="h-4 w-4 text-blue-700" />
              <h3 className="text-sm font-semibold text-slate-800">Informations légales</h3>
            </div>
          </div>

          <TextField
            icon={Fingerprint}
            id="ice"
            label="ICE"
            onChange={handleChange}
            placeholder="Identifiant Commun de l’Entreprise"
            value={formData.ice}
            disabled={isSaving}
          />
          <TextField
            icon={Landmark}
            id="rc"
            label="Registre de Commerce (RC)"
            onChange={handleChange}
            placeholder="Numéro et ville d’immatriculation"
            value={formData.rc}
            disabled={isSaving}
          />
          <TextField
            icon={FileText}
            id="patente"
            label="Patente"
            onChange={handleChange}
            placeholder="Numéro de patente"
            value={formData.patente}
            disabled={isSaving}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div aria-live="polite" className="min-h-5">
            {feedback && (
              <p
                className={`flex items-start gap-2 text-sm ${
                  feedback.type === 'success' ? 'text-emerald-700' : 'text-red-700'
                }`}
                role={feedback.type === 'error' ? 'alert' : 'status'}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </p>
            )}
          </div>

          <button
            className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="h-4 w-4" />
            )}
            {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </form>

      <p className="px-1 text-xs leading-5 text-slate-500">
        Les paramètres sont enregistrés dans Firestore. Leur accès doit également être
        restreint par les règles de sécurité Firebase.
      </p>
    </div>
  )
}