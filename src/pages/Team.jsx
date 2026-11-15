import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ClipboardList,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import TablePdfExportButton from '../components/TablePdfExportButton.jsx'
import TeamForm from '../components/TeamForm.jsx'
import { db } from '../firebase.js'

function normalizeSearch(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

function isActive(member) {
  if (typeof member.active === 'boolean') {
    return member.active
  }
  const status = String(member.status || member.statut || '')
    .trim()
    .toLocaleLowerCase('fr-FR')
  return !['inactif', 'inactive', 'false', 'non'].includes(status)
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15'
          : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {active ? 'Actif' : 'Inactif'}
    </span>
  )
}

export default function Team() {
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [modalMember, setModalMember] = useState(undefined)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'team'),
      (snapshot) => {
        setMembers(
          snapshot.docs.map((memberDocument) => ({
            ...memberDocument.data(),
            id: memberDocument.id,
          })),
        )
        setLoadError('')
        setIsLoading(false)
      },
      (error) => {
        console.error('Erreur lors du chargement de l’annuaire :', error)
        setLoadError(error instanceof Error ? error.message : 'Impossible de charger l’équipe.')
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const filteredMembers = useMemo(() => {
    const query = normalizeSearch(search)
    return members
      .filter((member) => {
        if (!query) {
          return true
        }
        return [
          member.nom,
          member.email,
          member.telephone,
          member.role,
          isActive(member) ? 'Actif' : 'Inactif',
        ].some((value) => normalizeSearch(value).includes(query))
      })
      .sort((first, second) =>
        String(first.nom || '').localeCompare(String(second.nom || ''), 'fr', {
          sensitivity: 'base',
        }),
      )
  }, [members, search])

  async function handleDelete(member) {
    if (!window.confirm(`Supprimer ${member.nom || 'ce membre'} de l’annuaire ?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'team', member.id))
      setNotice('Le membre a été supprimé de l’annuaire.')
    } catch (error) {
      console.error('Erreur lors de la suppression du membre :', error)
      setLoadError(
        error instanceof Error ? error.message : 'La suppression du membre a échoué.',
      )
    }
  }

  function handleSaved(message) {
    setModalMember(undefined)
    setNotice(message)
  }

  const exportColumns = [
    { label: 'Nom', value: (member) => member.nom },
    { label: 'E-mail', value: (member) => member.email },
    { label: 'Téléphone', value: (member) => member.telephone },
    { label: 'Rôle', value: (member) => member.role },
    { label: 'Statut', value: (member) => (isActive(member) ? 'Actif' : 'Inactif') },
  ]

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      {notice && (
        <div
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          <Users aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button
            aria-label="Fermer le message"
            className="text-emerald-700 hover:text-emerald-900"
            onClick={() => setNotice('')}
            type="button"
          >
            ×
          </button>
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <ClipboardList aria-hidden="true" className="h-4 w-4" />
            Ressources humaines
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Équipe
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Gérez l’annuaire interne, indépendamment des comptes de connexion Firebase.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <TablePdfExportButton
            columns={exportColumns}
            filename="Annuaire-equipe"
            label="Exporter l’annuaire (PDF)"
            rows={filteredMembers}
            title="Annuaire de l’équipe"
          />
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20"
            onClick={() => setModalMember(null)}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Ajouter un membre
          </button>
        </div>
      </header>

      <section aria-label="Synthèse de l’équipe" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Membres référencés</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{members.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Membres actifs</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {members.filter(isActive).length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Rôles représentés</p>
          <p className="mt-2 text-2xl font-semibold text-blue-800">
            {new Set(members.map((member) => member.role).filter(Boolean)).size}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">Annuaire de l’équipe</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredMembers.length} membre{filteredMembers.length === 1 ? '' : 's'}
            </p>
          </div>
          <label className="relative block w-full sm:max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Rechercher un membre de l’équipe"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, e-mail, téléphone ou rôle..."
              type="search"
              value={search}
            />
          </label>
        </div>

        {loadError && (
          <div
            className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{loadError}</span>
            <button
              className="ml-auto font-semibold"
              onClick={() => setLoadError('')}
              type="button"
            >
              Fermer
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12">
            <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin text-blue-700" />
            <p className="mt-3 text-sm text-slate-500">Chargement de l’équipe...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <Users aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search ? 'Aucun résultat trouvé' : 'Aucun membre enregistré'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {search
                ? 'Essayez un autre nom, e-mail, téléphone ou rôle.'
                : 'Ajoutez un membre pour commencer à construire votre annuaire.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  {['Nom', 'E-mail', 'Téléphone', 'Rôle', 'Statut'].map((heading) => (
                    <th
                      className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                      key={heading}
                    >
                      {heading}
                    </th>
                  ))}
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr className="transition hover:bg-slate-50/70" key={member.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-800">
                          {String(member.nom || 'M')
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0] || '')
                            .join('')
                            .toLocaleUpperCase('fr-FR')}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {member.nom || 'Sans nom'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{member.email || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {member.telephone || '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{member.role || '—'}</td>
                    <td className="px-5 py-4">
                      <StatusBadge active={isActive(member)} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          aria-label={`Modifier ${member.nom || 'le membre'}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                          onClick={() => setModalMember(member)}
                          title="Modifier le membre"
                          type="button"
                        >
                          <Pencil aria-hidden="true" className="h-4 w-4" />
                        </button>
                        <button
                          aria-label={`Supprimer ${member.nom || 'le membre'}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                          onClick={() => void handleDelete(member)}
                          title="Supprimer le membre"
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalMember !== undefined && (
        <TeamForm
          key={modalMember?.id || 'new'}
          member={modalMember}
          onClose={() => setModalMember(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
