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
  UserRound,
} from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/useAuth.js'

const DEFAULT_FORM_DATA = {
  name: 'TGI ASCENSEURS CASA',
  address: '',
  phone: '',
  email: '',
  ice: '',
  rc: '',
  patente: '',
  directeurPhoto: '',
  commercialPhoto: '',
}

const MAX_PROFILE_IMAGE_SIZE_BYTES = 600 * 1024
const MAX_PROFILE_PHOTOS_DATA_LENGTH = 850 * 1024

function getFormDataFromSettings(settings = {}) {
  return {
    name:
      typeof settings.name === 'string' && settings.name.trim()
        ? settings.name
        : DEFAULT_FORM_DATA.name,
    address: typeof settings.address === 'string' ? settings.address : '',
    phone: typeof settings.phone === 'string' ? settings.phone : '',
    email: typeof settings.email === 'string' ? settings.email : '',
    ice: typeof settings.ice === 'string' ? settings.ice : '',
    rc: typeof settings.rc === 'string' ? settings.rc : '',
    patente: typeof settings.patente === 'string' ? settings.patente : '',
    directeurPhoto: typeof settings.directeurPhoto === 'string' ? settings.directeurPhoto : '',
    commercialPhoto: typeof settings.commercialPhoto === 'string' ? settings.commercialPhoto : '',
  }
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
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
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
          disabled={disabled}
          id={id}
          name={id}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
        />
      </div>
    </div>
  )
}

function ProfilePhotoField({ field, label, value, disabled, onChange }) {
  const inputId = `settings-${field}`

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      {value ? (
        <img
          alt={`Aperçu du profil ${label}`}
          className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
          src={value}
        />
      ) : (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white bg-slate-200 text-slate-500 shadow-sm">
          <UserRound aria-hidden="true" className="h-7 w-7" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={inputId}>
          Photo du {label}
        </label>
        <input
          accept="image/*"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          id={inputId}
          onChange={onChange}
          type="file"
        />
        <p className="mt-1.5 text-xs text-slate-500">Image jusqu’à 600 Ko.</p>
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
        className="mt-5 text-center text-xl font-semibold text-slate-900"
        id="settings-access-denied-title"
      >
        Accès refusé
      </h1>
      <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-slate-500">
        Cette page est réservée à la direction. Seul le Directeur peut consulter ou modifier les
        paramètres de l’entreprise.
      </p>
    </section>
  )
}

function LoadingPanel() {
  return (
    <div
      aria-live="polite"
      className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      role="status"
    >
      <LoaderCircle aria-hidden="true" className="h-9 w-9 animate-spin text-blue-700" />
      <p className="mt-4 text-sm font-medium text-slate-600">
        Chargement des paramètres de l’entreprise...
      </p>
    </div>
  )
}

function FeedbackMessage({ feedback }) {
  if (!feedback) {
    return <span className="sr-only">Aucun nouveau message.</span>
  }

  const isSuccess = feedback.type === 'success'
  const Icon = isSuccess ? CheckCircle2 : AlertCircle
  return (
    <p
      className={`flex items-start gap-2 text-sm ${
        isSuccess ? 'text-emerald-700' : 'text-red-700'
      }`}
      role={isSuccess ? 'status' : 'alert'}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{feedback.message}</span>
    </p>
  )
}

export default function Settings() {
  const { userData } = useAuth()
  const isDirector = userData?.role === 'Directeur'
  const [formData, setFormData] = useState(() => ({ ...DEFAULT_FORM_DATA }))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingImageReads, setPendingImageReads] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadCompanySettings() {
      try {
        const settingsSnapshot = await getDoc(doc(db, 'settings', 'company'))
        if (!isMounted) {
          return
        }

        if (settingsSnapshot.exists()) {
          setFormData(getFormDataFromSettings(settingsSnapshot.data()))
        } else {
          setFormData({ ...DEFAULT_FORM_DATA })
        }
        setLoadError('')
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres de l’entreprise :', error)
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Impossible de charger les paramètres de l’entreprise.',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (isDirector) {
      void loadCompanySettings()
    }

    return () => {
      isMounted = false
    }
  }, [isDirector, reloadKey])

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setFeedback(null)
  }

  function handleImageUpload(event, role) {
    const file = event.currentTarget.files?.[0]
    const field =
      role === 'Directeur'
        ? 'directeurPhoto'
        : role === 'Commercial'
          ? 'commercialPhoto'
          : null

    if (!file || !field) {
      return
    }

    event.currentTarget.value = ''
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Sélectionnez un fichier image valide.' })
      return
    }
    if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      setFeedback({
        type: 'error',
        message: 'La photo dépasse 600 Ko. Choisissez une image plus légère.',
      })
      return
    }

    const reader = new FileReader()
    setPendingImageReads((count) => count + 1)
    function finishReading() {
      setPendingImageReads((count) => Math.max(0, count - 1))
    }

    reader.onload = () => {
      finishReading()
      if (typeof reader.result !== 'string' || !reader.result.startsWith('data:image/')) {
        setFeedback({
          type: 'error',
          message: 'Le fichier image n’a pas pu être converti.',
        })
        return
      }

      setFormData((previous) => ({ ...previous, [field]: reader.result }))
      setFeedback(null)
    }
    reader.onerror = () => {
      finishReading()
      console.error(`Erreur lors de la lecture de la photo du ${role.toLocaleLowerCase('fr-FR')}.`)
      setFeedback({
        type: 'error',
        message: 'La lecture de la photo a échoué. Réessayez avec une autre image.',
      })
    }
    reader.onabort = () => {
      finishReading()
      setFeedback({ type: 'error', message: 'La lecture de la photo a été interrompue.' })
    }

    try {
      reader.readAsDataURL(file)
    } catch (error) {
      finishReading()
      console.error('Erreur lors de la conversion de la photo de profil :', error)
      setFeedback({
        type: 'error',
        message: 'La photo n’a pas pu être lue. Réessayez avec une autre image.',
      })
    }
  }

  function handleRetry() {
    setLoadError('')
    setFeedback(null)
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback(null)

    if (!isDirector) {
      setFeedback({
        type: 'error',
        message: 'Seul le Directeur peut modifier ces paramètres.',
      })
      return
    }

    if (!formData.name.trim()) {
      setFeedback({
        type: 'error',
        message: 'Le nom de l’entreprise est obligatoire.',
      })
      return
    }

    const valuesToSave = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      ice: formData.ice.trim(),
      rc: formData.rc.trim(),
      patente: formData.patente.trim(),
      directeurPhoto: formData.directeurPhoto,
      commercialPhoto: formData.commercialPhoto,
    }
    if (
      valuesToSave.directeurPhoto.length + valuesToSave.commercialPhoto.length >
      MAX_PROFILE_PHOTOS_DATA_LENGTH
    ) {
      setFeedback({
        type: 'error',
        message: 'La taille totale des photos dépasse la limite de stockage des paramètres.',
      })
      return
    }

    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'company'), valuesToSave, { merge: true })
      setFormData(valuesToSave)
      window.dispatchEvent(new Event('company-settings-updated'))
      setFeedback({
        type: 'success',
        message: 'Les paramètres de l’entreprise ont été enregistrés.',
      })
    } catch (error) {
      console.error('Erreur lors de l’enregistrement des paramètres de l’entreprise :', error)
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? `Enregistrement impossible : ${error.message}`
            : 'Enregistrement impossible. Veuillez réessayer.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isDirector) {
    return <AccessDenied />
  }

  if (loading) {
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
              onClick={handleRetry}
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
    <div className="mx-auto max-w-6xl space-y-6">
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
        aria-busy={saving}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_48px_-30px_rgba(15,23,42,0.28)]"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="grid gap-0 lg:grid-cols-2">
          <section aria-labelledby="settings-general-title" className="p-5 sm:p-7 lg:border-r lg:border-slate-100">
            <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Building2 aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900" id="settings-general-title">
                  Informations générales
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Coordonnées affichées sur les documents de l’entreprise.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <TextField
                autoComplete="organization"
                icon={Building2}
                id="name"
                label="Nom de l’entreprise"
                onChange={handleChange}
                placeholder="TGI ASCENSEURS CASA"
                required
                value={formData.name}
                disabled={saving}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="address">
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
                    disabled={saving}
                    id="address"
                    name="address"
                    onChange={handleChange}
                    placeholder="Adresse, quartier, ville, code postal"
                    rows={3}
                    value={formData.address}
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
                disabled={saving}
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
                disabled={saving}
              />
            </div>
          </section>

          <section aria-labelledby="settings-legal-title" className="p-5 sm:p-7">
            <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                <Fingerprint aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900" id="settings-legal-title">
                  Informations légales
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Identifiants utilisés dans les factures et documents PDF.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <TextField
                icon={Fingerprint}
                id="ice"
                label="ICE"
                onChange={handleChange}
                placeholder="Identifiant Commun de l’Entreprise"
                value={formData.ice}
                disabled={saving}
              />
              <TextField
                icon={Landmark}
                id="rc"
                label="Registre de Commerce (RC)"
                onChange={handleChange}
                placeholder="Numéro et ville d’immatriculation"
                value={formData.rc}
                disabled={saving}
              />
              <TextField
                icon={FileText}
                id="patente"
                label="Patente"
                onChange={handleChange}
                placeholder="Numéro de patente"
                value={formData.patente}
                disabled={saving}
              />
            </div>
          </section>
        </div>

        <section
          aria-labelledby="settings-profiles-title"
          className="border-t border-slate-100 p-5 sm:p-7"
        >
          <div className="mb-5 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
              <UserRound aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900" id="settings-profiles-title">
                Personnalisation des Profils
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ajoutez les photos affichées dans le profil de session.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ProfilePhotoField
              disabled={saving || pendingImageReads > 0}
              field="directeurPhoto"
              label="Directeur"
              onChange={(event) => handleImageUpload(event, 'Directeur')}
              value={formData.directeurPhoto}
            />
            <ProfilePhotoField
              disabled={saving || pendingImageReads > 0}
              field="commercialPhoto"
              label="Commercial"
              onChange={(event) => handleImageUpload(event, 'Commercial')}
              value={formData.commercialPhoto}
            />
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div aria-live="polite" className="min-h-5">
            <FeedbackMessage feedback={feedback} />
          </div>
          <button
            className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={saving || loading || pendingImageReads > 0}
            type="submit"
          >
            {saving ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="h-4 w-4" />
            )}
            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
        </footer>
      </form>

      <p className="px-1 text-xs leading-5 text-slate-500">
        L’accès à cette page est protégé dans l’interface. Les règles de sécurité Firestore doivent
        également limiter la lecture et l’écriture de ces paramètres aux utilisateurs autorisés.
      </p>
    </div>
  )
}
