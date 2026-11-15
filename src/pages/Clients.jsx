import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Building2,
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { collection, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore'
import ClientForm from '../components/ClientForm.jsx'
import { db } from '../firebase.js'

function getClientName(client) {
  return String(client.nom || client.raisonSociale || client.name || 'Client sans nom')
}

function getClientPhone(client) {
  return String(client.telephone || client.téléphone || client.phone || '—')
}

function getClientType(client) {
  return String(client.type || '—')
}

function getClientCity(client) {
  return String(client.ville || client.city || '—')
}

function isClientActive(client) {
  const status = client.active ?? client.actif ?? client.status ?? client.statut

  if (typeof status === 'boolean') {
    return status
  }

  if (typeof status === 'string') {
    return !['inactif', 'inactive', 'false', 'non'].includes(
      status.trim().toLocaleLowerCase('fr-FR'),
    )
  }

  return true
}

function normalizeSearch(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

function getClientReference(client) {
  return String(client.reference || client.ref || `CL-${client.id.slice(0, 7).toUpperCase()}`)
}

function Toast({ toast, onClose }) {
  if (!toast) {
    return null
  }

  const isError = toast.type === 'error'

  return (
    <div
      className={`fixed right-4 top-4 z-[70] flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-xl ${
        isError
          ? 'border-red-200 bg-white text-red-800'
          : 'border-emerald-200 bg-white text-emerald-800'
      }`}
      role={isError ? 'alert' : 'status'}
    >
      {isError ? (
        <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <Building2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
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

function ClientStatus({ active }) {
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

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [modalClient, setModalClient] = useState(undefined)
  const [exportingId, setExportingId] = useState('')
  const [toast, setToast] = useState(null)

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
        setIsLoading(false)
      },
      (error) => {
        setLoadError(
          error instanceof Error ? error.message : 'Impossible de charger les clients.',
        )
        setIsLoading(false)
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

  const filteredClients = useMemo(() => {
    const normalizedQuery = normalizeSearch(search)
    const phoneQuery = search.replace(/\D/g, '')

    return clients
      .filter((client) => {
        if (!normalizedQuery) {
          return true
        }

        const nameMatches = normalizeSearch(getClientName(client)).includes(normalizedQuery)
        const clientPhoneDigits = getClientPhone(client).replace(/\D/g, '')
        const phoneMatches = phoneQuery.length > 0 && clientPhoneDigits.includes(phoneQuery)
        return nameMatches || phoneMatches
      })
      .sort((first, second) =>
        getClientName(first).localeCompare(getClientName(second), 'fr', {
          sensitivity: 'base',
        }),
      )
  }, [clients, search])

  const activeCount = clients.filter(isClientActive).length
  const inactiveCount = clients.length - activeCount

  function showToast(type, message) {
    setToast({ type, message })
  }

  function handleSaved(action) {
    setModalClient(undefined)
    showToast(
      'success',
      action === 'updated' ? 'Le client a été modifié.' : 'Le client a été créé.',
    )
  }

  async function handleDelete(client) {
    const clientName = getClientName(client)
    if (!window.confirm(`Supprimer définitivement le client « ${clientName} » ?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'clients', client.id))
      showToast('success', 'Le client a été supprimé.')
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `Suppression impossible : ${error.message}`
          : 'Suppression impossible. Veuillez réessayer.',
      )
    }
  }

  async function handleExport(client) {
    setExportingId(client.id)

    try {
      const settingsSnapshot = await getDoc(doc(db, 'settings', 'company'))
      const { PDF_COMPANY_INFO, generatePremiumPDF } = await import('../utils/pdfEngine.js')
      const savedCompanyInfo = settingsSnapshot.exists() ? settingsSnapshot.data() : {}
      const companyInfo = {
        ...PDF_COMPANY_INFO,
        ...Object.fromEntries(
          Object.entries(savedCompanyInfo).filter(([, value]) => typeof value === 'string'),
        ),
      }

      const clientName = getClientName(client)
      const address = String(client.adresse || client.address || '')
      const city = getClientCity(client)
      const details = [
        ['Nom / Raison sociale', clientName],
        ['Type de client', getClientType(client)],
        ['ICE / Identifiant fiscal', String(client.ice || client.identifiantFiscal || '—')],
        ['Téléphone', getClientPhone(client)],
        ['E-mail', String(client.email || '—')],
        ['Adresse complète', address || '—'],
        ['Ville', city],
        ['Statut', isClientActive(client) ? 'Actif' : 'Inactif'],
      ].map(([designation, value]) => ({ designation, value }))

      await generatePremiumPDF({
        typeDocument: 'Fiche Client',
        numero: getClientReference(client),
        date: new Date(),
        clientInfo: {
          nom: clientName,
          adresse: [address, city !== '—' ? city : ''].filter(Boolean).join(', '),
          ice: String(client.ice || client.identifiantFiscal || '—'),
        },
        items: details,
        companyInfo,
        layout: 'details',
      })

      showToast('success', 'La fiche PDF du client a été générée.')
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

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <Toast onClose={() => setToast(null)} toast={toast} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <Users aria-hidden="true" className="h-4 w-4" />
            Gestion CRM
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Clients
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Gérez vos syndics, entreprises et particuliers depuis un espace centralisé.
          </p>
        </div>
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:w-auto"
          onClick={() => setModalClient(null)}
          type="button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Nouveau Client
        </button>
      </header>

      <section aria-label="Synthèse des clients" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total clients</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {clients.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Clients actifs</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-700">
            {activeCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Clients inactifs</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-600">
            {inactiveCount}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">Répertoire clients</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredClients.length} résultat{filteredClients.length === 1 ? '' : 's'}
            </p>
          </div>
          <label className="relative block w-full sm:max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Rechercher un client par nom ou téléphone"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom ou téléphone..."
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
            <span>Chargement des clients impossible : {loadError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12">
            <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin text-blue-700" />
            <p className="mt-3 text-sm text-slate-500">Chargement des clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <Users aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search ? 'Aucun résultat trouvé' : 'Aucun client pour le moment'}
            </h3>
            <p className="mt-1 max-w-sm text-sm leading-5 text-slate-500">
              {search
                ? 'Essayez une autre recherche par nom ou numéro de téléphone.'
                : 'Créez une fiche client pour commencer à alimenter votre répertoire.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    ID / Réf
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nom / Raison sociale
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Téléphone
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ville
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
                {filteredClients.map((client) => {
                  const active = isClientActive(client)
                  const isExporting = exportingId === client.id

                  return (
                    <tr className="transition hover:bg-slate-50/70" key={client.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {getClientReference(client)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm font-semibold text-slate-900">
                          {getClientName(client)}
                        </span>
                        {client.email && (
                          <span className="mt-1 block max-w-xs truncate text-xs text-slate-500">
                            {String(client.email)}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {getClientType(client)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {getClientPhone(client)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {getClientCity(client)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <ClientStatus active={active} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={`Exporter la fiche PDF de ${getClientName(client)}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-wait disabled:opacity-50"
                            disabled={Boolean(exportingId)}
                            onClick={() => void handleExport(client)}
                            title="Exporter la fiche client en PDF"
                            type="button"
                          >
                            {isExporting ? (
                              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download aria-hidden="true" className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            aria-label={`Modifier ${getClientName(client)}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            onClick={() => setModalClient(client)}
                            title="Modifier le client"
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            aria-label={`Supprimer ${getClientName(client)}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                            onClick={() => void handleDelete(client)}
                            title="Supprimer le client"
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

      {modalClient !== undefined && (
        <ClientForm
          client={modalClient}
          onClose={() => setModalClient(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}