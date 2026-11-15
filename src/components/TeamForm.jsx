import { useState } from 'react'
import { AlertCircle, LoaderCircle, Save, X } from 'lucide-react'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

const TEAM_ROLES = ['Directeur', 'Commercial', 'Technicien', 'Magasinier']

function getInitialFormData(member) {
  const status = String(member?.status || member?.statut || '')
    .trim()
    .toLocaleLowerCase('fr-FR')
  return {
    nom: String(member?.nom || ''),
    email: String(member?.email || ''),
    telephone: String(member?.telephone || ''),
    role: String(member?.role || TEAM_ROLES[0]),
    active:
      typeof member?.active === 'boolean'
        ? member.active
        : !['inactif', 'inactive', 'false', 'non'].includes(status),
  }
}

export default function TeamForm({ member, onClose, onSaved }) {
  const [formData, setFormData] = useState(() => getInitialFormData(member))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: name === 'active' ? value === 'true' : value,
    }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const name = formData.nom.trim()
    const email = formData.email.trim().toLowerCase()
    const phone = formData.telephone.trim()

    if (name.length < 2) {
      setError('Le nom doit contenir au moins 2 caractères.')
      return
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Saisissez une adresse e-mail valide.')
      return
    }
    if (!phone) {
      setError('Le numéro de téléphone est obligatoire.')
      return
    }
    if (!TEAM_ROLES.includes(formData.role)) {
      setError('Sélectionnez un rôle valide.')
      return
    }

    setSaving(true)
    setError('')
    const payload = {
      nom: name,
      email,
      telephone: phone,
      role: formData.role,
      active: formData.active,
      updatedAt: serverTimestamp(),
    }

    try {
      if (member?.id) {
        await updateDoc(doc(db, 'team', member.id), payload)
      } else {
        await addDoc(collection(db, 'team'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
      }

      onSaved(member ? 'Le membre de l’équipe a été mis à jour.' : 'Le membre a été ajouté à l’équipe.')
    } catch (saveError) {
      console.error('Erreur lors de l’enregistrement du membre de l’équipe :', saveError)
      setError(
        saveError instanceof Error
          ? `Enregistrement impossible : ${saveError.message}`
          : 'Enregistrement impossible. Veuillez réessayer.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose()
        }
      }}
    >
      <section
        aria-labelledby="team-form-title"
        aria-modal="true"
        className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
      >
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Annuaire de l’équipe
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900" id="team-form-title">
              {member ? 'Modifier le membre' : 'Ajouter un membre'}
            </h2>
          </div>
          <button
            aria-label="Fermer le formulaire"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <form className="space-y-5 p-6" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Nom complet</span>
              <input
                autoComplete="name"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-50"
                disabled={saving}
                maxLength={120}
                minLength={2}
                name="nom"
                onChange={handleChange}
                required
                value={formData.nom}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</span>
              <input
                autoComplete="email"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-50"
                disabled={saving}
                maxLength={254}
                name="email"
                onChange={handleChange}
                required
                type="email"
                value={formData.email}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Téléphone</span>
              <input
                autoComplete="tel"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-50"
                disabled={saving}
                maxLength={30}
                name="telephone"
                onChange={handleChange}
                required
                type="tel"
                value={formData.telephone}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Rôle</span>
              <select
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-50"
                disabled={saving}
                name="role"
                onChange={handleChange}
                value={formData.role}
              >
                {TEAM_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Statut</span>
              <select
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-50"
                disabled={saving}
                name="active"
                onChange={handleChange}
                value={String(formData.active)}
              >
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </label>
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              Annuler
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="h-4 w-4" />
              )}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
