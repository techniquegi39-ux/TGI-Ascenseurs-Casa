import { useState } from 'react'
import {
  BadgeCheck,
  Building2,
  FileText,
  Fingerprint,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  UserRound,
  X,
} from 'lucide-react'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/useAuth.js'

const CLIENT_TYPES = ['Syndic', 'Promoteur Immobilier', 'Entreprise', 'Particulier']
const PAYMENT_METHODS = ['Virement', 'Chèque', 'Espèces']

function getClientField(client, aliases, fallback = '') {
  for (const key of aliases) {
    const value = client?.[key]
    if (value !== undefined && value !== null) {
      return value
    }
  }

  return fallback
}

function getInitialFormData(client) {
  const activeValue = getClientField(client, ['active', 'actif', 'status', 'statut'], true)
  const isActive =
    typeof activeValue === 'boolean'
      ? activeValue
      : !['inactif', 'inactive', 'false', 'non'].includes(
          String(activeValue).trim().toLocaleLowerCase('fr-FR'),
        )

  const typeValue = String(getClientField(client, ['type'], 'Entreprise'))

  return {
    type: CLIENT_TYPES.includes(typeValue) ? typeValue : 'Entreprise',
    nom: String(getClientField(client, ['nom', 'raisonSociale', 'name'])),
    ice: String(getClientField(client, ['ice', 'identifiantFiscal'])),
    telephone: String(getClientField(client, ['telephone', 'téléphone', 'phone'])),
    email: String(getClientField(client, ['email'])),
    adresse: String(getClientField(client, ['adresse', 'address'])),
    ville: String(getClientField(client, ['ville', 'city'])),
    syndicNom: String(
      getClientField(client, ['syndicNom', 'nomSyndic', 'syndicName']),
    ),
    syndicTelephone: String(
      getClientField(client, ['syndicTelephone', 'telephoneSyndic', 'syndicPhone']),
    ),
    conciergeNom: String(
      getClientField(client, ['conciergeNom', 'nomConcierge', 'conciergeName']),
    ),
    conciergeTelephone: String(
      getClientField(client, [
        'conciergeTelephone',
        'telephoneConcierge',
        'conciergePhone',
      ]),
    ),
    googleMapsLink: String(
      getClientField(client, ['googleMapsLink', 'localisationGoogleMaps', 'mapsUrl']),
    ),
    coordonneesGPS: String(
      getClientField(client, ['coordonneesGPS', 'gpsCoordinates', 'coordinates']),
    ),
    modePaiementPrefere: String(
      getClientField(client, ['modePaiementPrefere', 'preferredPaymentMethod', 'modePaiement']),
    ),
    conditionsParticulieres: String(
      getClientField(client, ['conditionsParticulieres', 'specialConditions']),
    ),
    active: isActive,
  }
}

function Field({
  id,
  label,
  name,
  value,
  onChange,
  icon: Icon,
  type = 'text',
  placeholder,
  autoComplete,
  error,
  required = false,
  autoFocus = false,
  disabled = false,
}) {
  const controlClass = `w-full rounded-lg border bg-white text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
    error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
  } ${Icon ? 'pl-10 pr-3' : 'px-3'} h-11`

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
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={controlClass}
          id={id}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
          disabled={disabled}
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

export default function ClientForm({ client = null, onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState(() => getInitialFormData(client))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: name === 'active' ? value === 'true' : value,
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
    const name = formData.nom.trim()
    const email = formData.email.trim()
    const phone = formData.telephone.trim()

    if (name.length < 3) {
      nextErrors.nom = 'Le nom ou la raison sociale doit contenir au moins 3 caractères.'
    } else if (name.length > 160) {
      nextErrors.nom = 'Le nom ne doit pas dépasser 160 caractères.'
    }

    if (!CLIENT_TYPES.includes(formData.type)) {
      nextErrors.type = 'Sélectionnez un type de client valide.'
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      nextErrors.email = 'Saisissez une adresse e-mail valide.'
    }

    if (phone) {
      const normalizedPhone = phone.replace(/[\s.-]/g, '')
      if (!/^0[567]\d{8}$/.test(normalizedPhone)) {
        nextErrors.telephone = 'Le téléphone doit contenir 10 chiffres et commencer par 05, 06 ou 07.'
      }
    }

    if (formData.ice.trim() && !/^\d{15}$/.test(formData.ice.trim())) {
      nextErrors.ice = "L'ICE doit contenir exactement 15 chiffres."
    }

    for (const [field, label] of [
      ['syndicNom', 'Le nom du syndic'],
      ['syndicTelephone', 'Le téléphone du syndic'],
      ['conciergeNom', 'Le nom du concierge'],
      ['conciergeTelephone', 'Le téléphone du concierge'],
    ]) {
      if (formData[field].trim().length > 120) {
        nextErrors[field] = `${label} ne doit pas dépasser 120 caractères.`
      }
    }

    if (
      formData.googleMapsLink.trim() &&
      !/^https?:\/\/\S+$/i.test(formData.googleMapsLink.trim())
    ) {
      nextErrors.googleMapsLink = 'Saisissez un lien Google Maps valide commençant par http(s).'
    }

    if (formData.coordonneesGPS.trim()) {
      const coordinates = formData.coordonneesGPS
        .trim()
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(Number)
      if (
        coordinates.length !== 2 ||
        !coordinates.every(Number.isFinite) ||
        coordinates[0] < -90 ||
        coordinates[0] > 90 ||
        coordinates[1] < -180 ||
        coordinates[1] > 180
      ) {
        nextErrors.coordonneesGPS =
          'Saisissez une latitude et une longitude valides (ex. 33.5731, -7.5898).'
      }
    }

    if (formData.conditionsParticulieres.trim().length > 1000) {
      nextErrors.conditionsParticulieres =
        'Les conditions particulières ne doivent pas dépasser 1 000 caractères.'
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

    setIsSaving(true)

    const payload = {
      type: formData.type,
      nom: formData.nom.trim(),
      ice: formData.ice.trim(),
      telephone: formData.telephone.trim(),
      email: formData.email.trim(),
      adresse: formData.adresse.trim(),
      ville: formData.ville.trim(),
      syndicNom: formData.syndicNom.trim(),
      syndicTelephone: formData.syndicTelephone.trim(),
      conciergeNom: formData.conciergeNom.trim(),
      conciergeTelephone: formData.conciergeTelephone.trim(),
      googleMapsLink: formData.googleMapsLink.trim(),
      coordonneesGPS: formData.coordonneesGPS.trim(),
      modePaiementPrefere: formData.modePaiementPrefere,
      conditionsParticulieres: formData.conditionsParticulieres.trim(),
      active: formData.active,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || null,
    }

    let savedAction

    try {
      if (client?.id) {
        await updateDoc(doc(db, 'clients', client.id), payload)
        savedAction = 'updated'
      } else {
        await addDoc(collection(db, 'clients'), {
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
        aria-labelledby="client-form-title"
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
                Gestion CRM
              </p>
              <h2 id="client-form-title" className="mt-1 text-lg font-semibold text-slate-900">
                {client ? 'Modifier le client' : 'Nouveau client'}
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

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
          <div className="overflow-y-auto px-5 py-6 sm:px-7">
            <div className="space-y-5">
              <section
                aria-labelledby="client-general-heading"
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
              >
                <div className="mb-4">
                  <h3
                    className="font-semibold text-slate-900"
                    id="client-general-heading"
                  >
                    Informations générales
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Identité et catégorie du client.
                  </p>
                </div>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="client-type"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Type de client
                      <span className="ml-1 text-red-600" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <UserRound
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      />
                      <select
                        aria-describedby={errors.type ? 'client-type-error' : undefined}
                        aria-invalid={Boolean(errors.type)}
                        className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                          errors.type
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                        }`}
                        id="client-type"
                        name="type"
                        onChange={handleChange}
                        required
                        value={formData.type}
                        disabled={isSaving}
                      >
                        {CLIENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.type && (
                      <p className="mt-1.5 text-xs text-red-700" id="client-type-error">
                        {errors.type}
                      </p>
                    )}
                  </div>

                  <Field
                    autoFocus
                    autoComplete="organization"
                    error={errors.nom}
                    icon={Building2}
                    id="client-name"
                    label="Nom ou raison sociale"
                    name="nom"
                    onChange={handleChange}
                    placeholder="Nom du client"
                    required
                    value={formData.nom}
                    disabled={isSaving}
                  />
                </div>
              </section>

              <section
                aria-labelledby="client-contact-heading"
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
              >
                <div className="mb-4">
                  <h3
                    className="font-semibold text-slate-900"
                    id="client-contact-heading"
                  >
                    Informations légales &amp; contact
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Les coordonnées et identifiants sont vérifiés avant l’enregistrement.
                  </p>
                </div>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <Field
                    error={errors.ice}
                    icon={Fingerprint}
                    id="client-ice"
                    label="ICE / Identifiant fiscal"
                    name="ice"
                    onChange={handleChange}
                    placeholder="15 chiffres (optionnel)"
                    value={formData.ice}
                    disabled={isSaving}
                  />
                  <Field
                    autoComplete="tel"
                    error={errors.telephone}
                    icon={Phone}
                    id="client-phone"
                    label="Téléphone"
                    name="telephone"
                    onChange={handleChange}
                    placeholder="05XXXXXXXX, 06XXXXXXXX ou 07XXXXXXXX"
                    type="tel"
                    value={formData.telephone}
                    disabled={isSaving}
                  />
                  <Field
                    autoComplete="email"
                    error={errors.email}
                    icon={Mail}
                    id="client-email"
                    label="E-mail"
                    name="email"
                    onChange={handleChange}
                    placeholder="contact@entreprise.ma"
                    type="email"
                    value={formData.email}
                    disabled={isSaving}
                  />
                  <Field
                    autoComplete="address-level2"
                    error={errors.ville}
                    icon={MapPin}
                    id="client-city"
                    label="Ville"
                    name="ville"
                    onChange={handleChange}
                    placeholder="Casablanca"
                    value={formData.ville}
                    disabled={isSaving}
                  />

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="client-address"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Adresse complète
                    </label>
                    <div className="relative">
                      <MapPin
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                      />
                      <textarea
                        autoComplete="street-address"
                        className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                        id="client-address"
                        name="adresse"
                        onChange={handleChange}
                        placeholder="Numéro, rue, quartier..."
                        rows={3}
                        value={formData.adresse}
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="client-status"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Statut du compte
                    </label>
                    <div className="relative">
                      <BadgeCheck
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      />
                      <select
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                        id="client-status"
                        name="active"
                        onChange={handleChange}
                        value={String(formData.active)}
                        disabled={isSaving}
                      >
                        <option value="true">Actif</option>
                        <option value="false">Inactif</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <section
                aria-labelledby="client-building-contacts-heading"
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
              >
                <div className="mb-4">
                  <h3
                    className="font-semibold text-slate-900"
                    id="client-building-contacts-heading"
                  >
                    Contacts de l’immeuble
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Coordonnées du syndic et du concierge pour faciliter les interventions.
                  </p>
                </div>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <Field
                    error={errors.syndicNom}
                    icon={UserRound}
                    id="client-syndic-name"
                    label="Nom du syndic"
                    name="syndicNom"
                    onChange={handleChange}
                    placeholder="Nom et prénom"
                    value={formData.syndicNom}
                    disabled={isSaving}
                  />
                  <Field
                    error={errors.syndicTelephone}
                    icon={Phone}
                    id="client-syndic-phone"
                    label="Téléphone du syndic"
                    name="syndicTelephone"
                    onChange={handleChange}
                    placeholder="Téléphone direct"
                    type="tel"
                    value={formData.syndicTelephone}
                    disabled={isSaving}
                  />
                  <Field
                    error={errors.conciergeNom}
                    icon={UserRound}
                    id="client-concierge-name"
                    label="Nom du concierge"
                    name="conciergeNom"
                    onChange={handleChange}
                    placeholder="Nom et prénom"
                    value={formData.conciergeNom}
                    disabled={isSaving}
                  />
                  <Field
                    error={errors.conciergeTelephone}
                    icon={Phone}
                    id="client-concierge-phone"
                    label="Téléphone du concierge"
                    name="conciergeTelephone"
                    onChange={handleChange}
                    placeholder="Téléphone direct"
                    type="tel"
                    value={formData.conciergeTelephone}
                    disabled={isSaving}
                  />
                </div>
              </section>

              <section
                aria-labelledby="client-location-payment-heading"
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
              >
                <div className="mb-4">
                  <h3
                    className="font-semibold text-slate-900"
                    id="client-location-payment-heading"
                  >
                    Localisation &amp; conditions financières
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Repérez l’immeuble et renseignez les préférences de règlement.
                  </p>
                </div>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <Field
                    error={errors.googleMapsLink}
                    icon={MapPin}
                    id="client-google-maps-link"
                    label="Lien Google Maps"
                    name="googleMapsLink"
                    onChange={handleChange}
                    placeholder="https://maps.google.com/..."
                    type="url"
                    value={formData.googleMapsLink}
                    disabled={isSaving}
                  />
                  <Field
                    error={errors.coordonneesGPS}
                    icon={MapPin}
                    id="client-gps-coordinates"
                    label="Coordonnées GPS"
                    name="coordonneesGPS"
                    onChange={handleChange}
                    placeholder="33.5731, -7.5898"
                    value={formData.coordonneesGPS}
                    disabled={isSaving}
                  />
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-slate-700"
                      htmlFor="client-payment-method"
                    >
                      Mode de paiement préféré
                    </label>
                    <select
                      aria-describedby={
                        errors.modePaiementPrefere ? 'client-payment-method-error' : undefined
                      }
                      aria-invalid={Boolean(errors.modePaiementPrefere)}
                      className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                        errors.modePaiementPrefere
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                      }`}
                      disabled={isSaving}
                      id="client-payment-method"
                      name="modePaiementPrefere"
                      onChange={handleChange}
                      value={formData.modePaiementPrefere}
                    >
                      <option value="">Non renseigné</option>
                      {formData.modePaiementPrefere &&
                        !PAYMENT_METHODS.includes(formData.modePaiementPrefere) && (
                          <option value={formData.modePaiementPrefere}>
                            {formData.modePaiementPrefere}
                          </option>
                        )}
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                    {errors.modePaiementPrefere && (
                      <p
                        className="mt-1.5 text-xs text-red-700"
                        id="client-payment-method-error"
                      >
                        {errors.modePaiementPrefere}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      className="mb-2 block text-sm font-medium text-slate-700"
                      htmlFor="client-special-conditions"
                    >
                      Conditions particulières
                    </label>
                    <textarea
                      aria-describedby={
                        errors.conditionsParticulieres
                          ? 'client-special-conditions-error'
                          : undefined
                      }
                      aria-invalid={Boolean(errors.conditionsParticulieres)}
                      className={`min-h-24 w-full resize-y rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                        errors.conditionsParticulieres
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                      }`}
                      disabled={isSaving}
                      id="client-special-conditions"
                      maxLength={1000}
                      name="conditionsParticulieres"
                      onChange={handleChange}
                      placeholder="Ex. Paiement en fin de mois"
                      rows={3}
                      value={formData.conditionsParticulieres}
                    />
                    {errors.conditionsParticulieres && (
                      <p
                        className="mt-1.5 text-xs text-red-700"
                        id="client-special-conditions-error"
                      >
                        {errors.conditionsParticulieres}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {formError && (
              <div
                className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
                role="alert"
              >
                {formError}
              </div>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Annuler
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <FileText aria-hidden="true" className="h-4 w-4" />
              )}
              {isSaving ? 'Enregistrement...' : client ? 'Enregistrer les modifications' : 'Créer le client'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}