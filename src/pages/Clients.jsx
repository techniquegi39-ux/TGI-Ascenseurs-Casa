import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpDown,
  Building2,
  Download,
  Eye,
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
import TablePdfExportButton from '../components/TablePdfExportButton.jsx'
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

function getClientIce(client) {
  return String(client.ice || client.identifiantFiscal || '—')
}

function getClientInitials(client) {
  const words = getClientName(client).trim().split(/\s+/).filter(Boolean)
  const initials = words.length > 1
    ? `${words[0][0]}${words[1][0]}`
    : words[0]?.slice(0, 2) || 'CL'

  return initials.toLocaleUpperCase('fr-FR')
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

function ClientDetailItem({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-800">{value || '—'}</dd>
    </div>
  )
}

function ClientDetailsModal({ client, onClose }) {
  const mapsLink = String(
    client.googleMapsLink || client.localisationGoogleMaps || client.mapsUrl || '',
  )
  const mapsLinkIsSafe = /^https?:\/\//i.test(mapsLink)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        aria-labelledby="client-details-title"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Fiche client
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900" id="client-details-title">
              {getClientName(client)}
            </h2>
          </div>
          <button
            aria-label="Fermer les détails du client"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          <div className="space-y-6">
            <section aria-labelledby="client-details-general">
              <h3 className="mb-3 font-semibold text-slate-900" id="client-details-general">
                Informations générales
              </h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                <ClientDetailItem label="Type de client" value={getClientType(client)} />
                <ClientDetailItem label="ICE / Identifiant fiscal" value={getClientIce(client)} />
                <ClientDetailItem label="Téléphone" value={getClientPhone(client)} />
                <ClientDetailItem label="E-mail" value={client.email} />
                <ClientDetailItem label="Adresse" value={client.adresse || client.address} />
                <ClientDetailItem label="Ville" value={getClientCity(client)} />
                <ClientDetailItem
                  label="Statut"
                  value={isClientActive(client) ? 'Actif' : 'Inactif'}
                />
              </dl>
            </section>

            <section aria-labelledby="client-details-building-contacts">
              <h3
                className="mb-3 font-semibold text-slate-900"
                id="client-details-building-contacts"
              >
                Contacts de l’immeuble
              </h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                <ClientDetailItem
                  label="Syndic"
                  value={client.syndicNom || client.nomSyndic || client.syndicName}
                />
                <ClientDetailItem
                  label="Téléphone du syndic"
                  value={
                    client.syndicTelephone || client.telephoneSyndic || client.syndicPhone
                  }
                />
                <ClientDetailItem
                  label="Concierge"
                  value={client.conciergeNom || client.nomConcierge || client.conciergeName}
                />
                <ClientDetailItem
                  label="Téléphone du concierge"
                  value={
                    client.conciergeTelephone ||
                    client.telephoneConcierge ||
                    client.conciergePhone
                  }
                />
              </dl>
            </section>

            <section aria-labelledby="client-details-location-payment">
              <h3
                className="mb-3 font-semibold text-slate-900"
                id="client-details-location-payment"
              >
                Localisation &amp; conditions financières
              </h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Google Maps
                  </dt>
                  <dd className="mt-1 break-words text-sm font-medium">
                    {mapsLinkIsSafe ? (
                      <a
                        className="text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                        href={mapsLink}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Ouvrir la localisation
                      </a>
                    ) : (
                      mapsLink || '—'
                    )}
                  </dd>
                </div>
                <ClientDetailItem
                  label="Coordonnées GPS"
                  value={
                    client.coordonneesGPS ||
                    client.gpsCoordinates ||
                    client.coordinates
                  }
                />
                <ClientDetailItem
                  label="Mode de paiement préféré"
                  value={
                    client.modePaiementPrefere ||
                    client.preferredPaymentMethod ||
                    client.modePaiement
                  }
                />
                <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 p-3 sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Conditions particulières
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-800">
                    {client.conditionsParticulieres || client.specialConditions || '—'}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'nom', direction: 'asc' })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [modalClient, setModalClient] = useState(undefined)
  const [detailsClient, setDetailsClient] = useState(undefined)
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
        const searchableValues = [
          getClientPhone(client),
          client.syndicNom,
          client.syndicTelephone,
          client.conciergeNom,
          client.conciergeTelephone,
          client.googleMapsLink,
          client.coordonneesGPS,
        ]
        const searchableMatch = searchableValues.some((value) =>
          normalizeSearch(value || '').includes(normalizedQuery),
        )
        const clientPhoneDigits = searchableValues
          .filter(Boolean)
          .join(' ')
          .replace(/\D/g, '')
        const phoneMatches = phoneQuery.length > 0 && clientPhoneDigits.includes(phoneQuery)
        return nameMatches || searchableMatch || phoneMatches
      })
      .sort((first, second) => {
        const getValue = sortConfig.key === 'type' ? getClientType : getClientName
        const order = getValue(first).localeCompare(getValue(second), 'fr', {
          sensitivity: 'base',
          numeric: true,
        })

        return sortConfig.direction === 'asc' ? order : -order
      })
  }, [clients, search, sortConfig])

  const activeCount = clients.filter(isClientActive).length
  const inactiveCount = clients.length - activeCount

  function showToast(type, message) {
    setToast({ type, message })
  }

  function handleSort(key) {
    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc',
    }))
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
      const [{ pdf }, { PDF_COMPANY_INFO }, { default: ClientPdfDocument }] =
        await Promise.all([
          import('@react-pdf/renderer'),
          import('../utils/pdfEngine.js'),
          import('../components/pdf/ClientPdfDocument.jsx'),
        ])
      const savedCompanyInfo = settingsSnapshot.exists() ? settingsSnapshot.data() : {}
      const companyInfo = {
        ...PDF_COMPANY_INFO,
        ...Object.fromEntries(
          Object.entries(savedCompanyInfo).filter(([, value]) => typeof value === 'string'),
        ),
      }

      const blob = await pdf(
        <ClientPdfDocument client={client} companyInfo={companyInfo} />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Fiche_Client_${getClientReference(client)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)

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
        <div className="flex flex-col gap-2 sm:flex-row">
          <TablePdfExportButton
            columns={[
              { label: 'Nom / Raison sociale', value: getClientName },
              { label: 'Type', value: getClientType },
              { label: 'Téléphone', value: getClientPhone },
              { label: 'Ville', value: getClientCity },
              { label: 'ICE', value: getClientIce },
              { label: 'Statut', value: (client) => (isClientActive(client) ? 'Actif' : 'Inactif') },
            ]}
            disabled={isLoading}
            filename="Liste-clients"
            rows={filteredClients}
            title="Répertoire clients"
          />
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:w-auto"
            onClick={() => setModalClient(null)}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nouveau Client
          </button>
        </div>
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
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  <th
                    aria-sort={sortConfig.key === 'nom'
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : 'none'}
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <button
                      aria-label={`Trier par nom ${sortConfig.key === 'nom' && sortConfig.direction === 'asc' ? 'décroissant' : 'croissant'}`}
                      className="inline-flex items-center gap-2 text-left transition hover:text-blue-700 focus:outline-none focus:text-blue-700"
                      onClick={() => handleSort('nom')}
                      type="button"
                    >
                      Nom / Raison sociale
                      <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th
                    aria-sort={sortConfig.key === 'type'
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : 'none'}
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <button
                      aria-label={`Trier par type ${sortConfig.key === 'type' && sortConfig.direction === 'asc' ? 'décroissant' : 'croissant'}`}
                      className="inline-flex items-center gap-2 text-left transition hover:text-blue-700 focus:outline-none focus:text-blue-700"
                      onClick={() => handleSort('type')}
                      type="button"
                    >
                      Type
                      <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Téléphone
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ville
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    ICE
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
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-800 ring-1 ring-inset ring-blue-700/10"
                          >
                            {getClientInitials(client)}
                          </span>
                          <div className="min-w-0">
                            <span className="block max-w-xs truncate text-sm font-semibold text-slate-900">
                              {getClientName(client)}
                            </span>
                            {client.email && (
                              <span className="mt-1 block max-w-xs truncate text-xs text-slate-500">
                                {String(client.email)}
                              </span>
                            )}
                          </div>
                        </div>
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
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-600">
                        {getClientIce(client)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <ClientStatus active={active} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={`Afficher les détails de ${getClientName(client)}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            onClick={() => setDetailsClient(client)}
                            title="Afficher la fiche détaillée"
                            type="button"
                          >
                            <Eye aria-hidden="true" className="h-4 w-4" />
                          </button>
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
      {detailsClient !== undefined && (
        <ClientDetailsModal
          client={detailsClient}
          onClose={() => setDetailsClient(undefined)}
        />
      )}
    </div>
  )
}