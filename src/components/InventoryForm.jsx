import { useState } from 'react'
import {
  Archive,
  Hash,
  LoaderCircle,
  MapPin,
  Package,
  Tag,
  X,
} from 'lucide-react'
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/useAuth.js'

const INVENTORY_CATEGORIES = [
  'Mécanique',
  'Électronique',
  'Consommable',
  'Outil',
  'Cabine',
]

function getValue(item, keys, fallback = '') {
  for (const key of keys) {
    if (item?.[key] !== undefined && item[key] !== null) {
      return item[key]
    }
  }
  return fallback
}

function getInitialFormData(item) {
  return {
    reference: String(getValue(item, ['reference', 'refArticle', 'sku'])),
    designation: String(getValue(item, ['designation', 'name'])),
    categorie: String(getValue(item, ['categorie', 'category'], INVENTORY_CATEGORIES[0])),
    quantite: String(getValue(item, ['quantite', 'quantiteActuelle', 'quantity'], 0)),
    seuilAlerte: String(getValue(item, ['seuilAlerte', 'alertThreshold'], 5)),
    emplacement: String(getValue(item, ['emplacement', 'location'])),
    prixAchatUnitaire: String(
      getValue(item, ['prixAchatUnitaire', 'prixUnitaireMoyen', 'averageUnitCost']),
    ),
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
  disabled = false,
  min,
  max,
  step,
  autoFocus = false,
  helpText,
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
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
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
      {!error && helpText && (
        <p className="mt-1.5 text-xs text-slate-500" id={`${id}-help`}>
          {helpText}
        </p>
      )}
    </div>
  )
}

export default function InventoryForm({ item = null, onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState(() => getInitialFormData(item))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
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
    const designation = formData.designation.trim()
    const quantity = Number(formData.quantite)
    const alertThreshold = Number(formData.seuilAlerte)
    const hasQuantity = formData.quantite.trim() !== ''
    const hasAlertThreshold = formData.seuilAlerte.trim() !== ''
    const purchasePrice =
      formData.prixAchatUnitaire.trim() === ''
        ? undefined
        : Number(formData.prixAchatUnitaire)

    if (!reference) {
      nextErrors.reference = 'La référence article est obligatoire.'
    } else if (!/^[\p{L}\d][\p{L}\d._/-]{2,49}$/u.test(reference)) {
      nextErrors.reference = 'Utilisez 3 à 50 caractères (lettres, chiffres, point, tiret ou slash).'
    }

    if (!designation) {
      nextErrors.designation = 'La désignation est obligatoire.'
    } else if (designation.length > 150) {
      nextErrors.designation = 'La désignation ne doit pas dépasser 150 caractères.'
    }

    if (!INVENTORY_CATEGORIES.includes(formData.categorie)) {
      nextErrors.categorie = 'Sélectionnez une catégorie valide.'
    }

    if (!hasQuantity || !Number.isInteger(quantity) || quantity < 0 || quantity > 1000000) {
      nextErrors.quantite = 'La quantité doit être un nombre entier positif ou nul.'
    }

    if (
      !hasAlertThreshold ||
      !Number.isInteger(alertThreshold) ||
      alertThreshold < 0 ||
      alertThreshold > 1000000
    ) {
      nextErrors.seuilAlerte = 'Le seuil doit être un nombre entier positif ou nul.'
    }

    if (formData.emplacement.trim().length > 100) {
      nextErrors.emplacement = 'L’emplacement ne doit pas dépasser 100 caractères.'
    }

    if (
      purchasePrice !== undefined &&
      (!Number.isFinite(purchasePrice) ||
        purchasePrice < 0 ||
        Math.abs(purchasePrice - Math.round(purchasePrice * 100) / 100) > 0.000001)
    ) {
      nextErrors.prixAchatUnitaire =
        'Saisissez un prix positif ou nul avec au maximum deux décimales.'
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
      reference: formData.reference.trim(),
      designation: formData.designation.trim(),
      categorie: formData.categorie,
      quantite: Number(formData.quantite),
      seuilAlerte: Number(formData.seuilAlerte),
      emplacement: formData.emplacement.trim(),
      prixAchatUnitaire:
        formData.prixAchatUnitaire.trim() === ''
          ? null
          : Math.round(Number(formData.prixAchatUnitaire) * 100) / 100,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || null,
    }

    let savedAction
    try {
      if (item?.id) {
        await updateDoc(doc(db, 'inventory', item.id), payload)
        savedAction = 'updated'
      } else {
        await addDoc(collection(db, 'inventory'), {
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
        aria-labelledby="inventory-form-title"
        aria-modal="true"
        className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Package aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Logistique & magasin
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900" id="inventory-form-title">
                {item?.id ? 'Modifier l’article' : 'Ajouter un article'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Renseignez la référence, les quantités et l’emplacement de stockage.
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
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">Identité de la pièce</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Référence, désignation et localisation de l’article.
                  </p>
                </div>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <Field
                    autoFocus
                    error={errors.reference}
                    icon={Hash}
                    id="inventory-reference"
                    label="Réf Article"
                    name="reference"
                    onChange={handleChange}
                    placeholder="PIECE-001"
                    required
                    value={formData.reference}
                    disabled={isSaving}
                  />
                  <Field
                    error={errors.designation}
                    icon={Tag}
                    id="inventory-designation"
                    label="Désignation"
                    name="designation"
                    onChange={handleChange}
                    placeholder="Carte mère ascenseur"
                    required
                    value={formData.designation}
                    disabled={isSaving}
                  />

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-slate-700"
                      htmlFor="inventory-category"
                    >
                      Catégorie
                      <span aria-hidden="true" className="ml-1 text-red-600">
                        *
                      </span>
                    </label>
                    <div className="relative">
                      <Archive
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      />
                      <select
                        aria-describedby={errors.categorie ? 'inventory-category-error' : undefined}
                        aria-invalid={Boolean(errors.categorie)}
                        className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                          errors.categorie
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                        }`}
                        disabled={isSaving}
                        id="inventory-category"
                        name="categorie"
                        onChange={handleChange}
                        value={formData.categorie}
                      >
                        {INVENTORY_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.categorie && (
                      <p className="mt-1.5 text-xs text-red-700" id="inventory-category-error">
                        {errors.categorie}
                      </p>
                    )}
                  </div>

                  <Field
                    error={errors.emplacement}
                    icon={MapPin}
                    id="inventory-location"
                    label="Emplacement dans le magasin"
                    name="emplacement"
                    onChange={handleChange}
                    placeholder="Étagère A2"
                    value={formData.emplacement}
                    disabled={isSaving}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">Paramètres de Stock</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Définissez les quantités disponibles, le seuil d’alerte et le prix d’achat.
                  </p>
                </div>
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <Field
                    error={errors.quantite}
                    icon={Package}
                    id="inventory-quantity"
                    label={item?.id ? 'Quantité actuelle' : 'Quantité initiale'}
                    max="1000000"
                    min="0"
                    name="quantite"
                    onChange={handleChange}
                    required
                    step="1"
                    type="number"
                    value={formData.quantite}
                    disabled={isSaving}
                  />
                  <Field
                    error={errors.seuilAlerte}
                    icon={Package}
                    id="inventory-alert-threshold"
                    label="Seuil d’alerte minimum"
                    helpText="Une alerte s’affiche lorsque le stock atteint ce seuil."
                    max="1000000"
                    min="0"
                    name="seuilAlerte"
                    onChange={handleChange}
                    required
                    step="1"
                    type="number"
                    value={formData.seuilAlerte}
                    disabled={isSaving}
                  />

                  <div className="sm:col-span-2">
                    <Field
                      error={errors.prixAchatUnitaire}
                      icon={Tag}
                      id="inventory-unit-cost"
                      label="Prix d’achat unitaire moyen (MAD, optionnel)"
                      min="0"
                      name="prixAchatUnitaire"
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={formData.prixAchatUnitaire}
                      disabled={isSaving}
                    />
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
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-400/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                <Package aria-hidden="true" className="h-4 w-4" />
              )}
              {isSaving ? 'Enregistrement...' : 'Enregistrer l’article'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
