import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpDown,
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import DeliveryNoteForm from '../components/DeliveryNoteForm.jsx'
import TablePdfExportButton from '../components/TablePdfExportButton.jsx'
import { useAuth } from '../context/useAuth.js'
import { db } from '../firebase.js'

const DELIVERY_NOTE_STATUSES = ['Brouillon', 'Validé & Livré', 'Annulé']

function getDeliveryNoteNumber(deliveryNote) {
  return String(
    deliveryNote.number ||
      deliveryNote.numero ||
      deliveryNote.deliveryNoteNumber ||
      (deliveryNote.id ? `BL-${deliveryNote.id.slice(0, 7).toUpperCase()}` : 'Sans numéro'),
  )
}

function getDateValue(value) {
  if (!value) {
    return null
  }
  if (typeof value?.toDate === 'function') {
    value = value.toDate()
  } else if (typeof value === 'string') {
    value = new Date(value)
  }
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null
}

function formatDate(value) {
  const date = getDateValue(value)
  if (!date) {
    return '—'
  }
  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getClientName(client, deliveryNote) {
  return String(
    client?.nom ||
      client?.raisonSociale ||
      client?.name ||
      deliveryNote.clientName ||
      deliveryNote.client ||
      'Client non renseigné',
  )
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

function normalizeStatus(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

function getDeliveryNoteStatus(deliveryNote) {
  const status = normalizeStatus(deliveryNote.status || deliveryNote.statut || 'Brouillon')
  if (status.includes('annul') || status.includes('cancel')) {
    return 'Annulé'
  }
  if (status.includes('brouillon') || status.includes('draft')) {
    return 'Brouillon'
  }
  if (
    status === 'livre' ||
    status === 'delivered' ||
    /^(valide|validee)\s*(?:&|et)\s*livre(e)?$/.test(status)
  ) {
    return 'Validé & Livré'
  }
  return String(deliveryNote.status || deliveryNote.statut || 'Brouillon')
}

function isDelivered(deliveryNote) {
  return getDeliveryNoteStatus(deliveryNote) === 'Validé & Livré'
}

function getInventoryQuantity(item) {
  const rawQuantity = item?.quantite ?? item?.quantiteActuelle ?? item?.quantity
  if (rawQuantity === undefined || rawQuantity === null || rawQuantity === '') {
    return null
  }
  const quantity = Number(rawQuantity)
  return Number.isInteger(quantity) && quantity >= 0 ? quantity : null
}

function getDeliveredItemQuantities(deliveryNote) {
  const quantities = new Map()
  const items = Array.isArray(deliveryNote.items) ? deliveryNote.items : []
  for (const item of items) {
    const inventoryItemId = String(item.inventoryItemId || item.articleId || '')
    const quantity = Number(item.quantity ?? item.quantite ?? 0)
    if (inventoryItemId && Number.isInteger(quantity) && quantity > 0) {
      quantities.set(inventoryItemId, (quantities.get(inventoryItemId) || 0) + quantity)
    }
  }
  return quantities
}

function StatusBadge({ status }) {
  const styles = {
    Brouillon: {
      badge: 'bg-slate-100 text-slate-700 ring-slate-500/15',
      dot: 'bg-slate-400',
    },
    'Validé & Livré': {
      badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
      dot: 'bg-emerald-500',
    },
    Annulé: {
      badge: 'bg-red-50 text-red-800 ring-red-600/20',
      dot: 'bg-red-500',
    },
  }[status] || {
    badge: 'bg-slate-100 text-slate-700 ring-slate-500/15',
    dot: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles.badge}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${styles.dot}`}
        />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${styles.dot}`} />
      </span>
      {status}
    </span>
  )
}

function SortableDateHeader({ sortDirection, onSort }) {
  return (
    <th
      aria-sort={sortDirection === 'asc' ? 'ascending' : 'descending'}
      className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
    >
      <button
        className="inline-flex items-center gap-1.5 transition hover:text-blue-800"
        onClick={onSort}
        type="button"
      >
        Date
        <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5 text-blue-700" />
      </button>
    </th>
  )
}

function Toast({ toast, onClose }) {
  if (!toast) {
    return null
  }
  const isError = toast.type === 'error'

  return (
    <div
      className={`fixed right-4 top-4 z-[70] flex max-w-md items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-xl ${
        isError ? 'border-red-200 text-red-800' : 'border-emerald-200 text-emerald-800'
      }`}
      role={isError ? 'alert' : 'status'}
    >
      {isError ? (
        <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <Truck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
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

function getCompanyInfo(settings = {}) {
  const defaults = {
    name: 'TGI ASCENSEURS CASA',
    address: '',
    phone: '',
    email: '',
    ice: '',
    rc: '',
    patente: '',
  }
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(settings).filter(([, value]) => typeof value === 'string'),
    ),
  }
}

export default function DeliveryNotes() {
  const { currentUser } = useAuth()
  const [deliveryNotes, setDeliveryNotes] = useState([])
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [sortDirection, setSortDirection] = useState('desc')
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [noteError, setNoteError] = useState('')
  const [clientError, setClientError] = useState('')
  const [modalNote, setModalNote] = useState(undefined)
  const [exportingId, setExportingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'delivery_notes'),
      (snapshot) => {
        setDeliveryNotes(
          snapshot.docs.map((noteDocument) => ({
            ...noteDocument.data(),
            id: noteDocument.id,
          })),
        )
        setNoteError('')
        setIsLoadingNotes(false)
      },
      (error) => {
        setNoteError(
          error instanceof Error ? error.message : 'Impossible de charger les bons de livraison.',
        )
        setIsLoadingNotes(false)
      },
    )
    return unsubscribe
  }, [])

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
        setClientError('')
        setIsLoadingClients(false)
      },
      (error) => {
        setClientError(
          error instanceof Error ? error.message : 'Impossible de charger les clients.',
        )
        setIsLoadingClients(false)
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

  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )

  const filteredNotes = useMemo(() => {
    const queryText = normalizeSearch(search)
    return deliveryNotes
      .filter((deliveryNote) => {
        if (
          statusFilter !== 'Tous' &&
          getDeliveryNoteStatus(deliveryNote) !== statusFilter
        ) {
          return false
        }
        if (!queryText) {
          return true
        }
        const client = clientsById.get(String(deliveryNote.clientId || ''))
        return [
          getDeliveryNoteNumber(deliveryNote),
          getClientName(client, deliveryNote),
          deliveryNote.referenceDocument,
          deliveryNote.referenceLiee,
          deliveryNote.lieuLivraison,
          deliveryNote.transporteurReceptionnaire,
        ].some((value) => normalizeSearch(value).includes(queryText))
      })
      .sort((first, second) => {
        const firstDate = getDateValue(
          first.dateLivraison || first.deliveryDate || first.date,
        )?.getTime() || 0
        const secondDate = getDateValue(
          second.dateLivraison || second.deliveryDate || second.date,
        )?.getTime() || 0
        return (secondDate - firstDate) * (sortDirection === 'desc' ? 1 : -1)
      })
  }, [clientsById, deliveryNotes, search, sortDirection, statusFilter])

  const draftCount = deliveryNotes.filter(
    (deliveryNote) => getDeliveryNoteStatus(deliveryNote) === 'Brouillon',
  ).length
  const deliveredCount = deliveryNotes.filter(isDelivered).length
  const cancelledCount = deliveryNotes.filter(
    (deliveryNote) => getDeliveryNoteStatus(deliveryNote) === 'Annulé',
  ).length

  function showToast(type, message) {
    setToast({ type, message })
  }

  function handleSortDate() {
    setSortDirection((previous) => (previous === 'desc' ? 'asc' : 'desc'))
  }

  function handleSaved(action) {
    setModalNote(undefined)
    showToast(
      'success',
      action === 'updated'
        ? 'Le bon de livraison a été modifié et le stock ajusté.'
        : 'Le bon de livraison a été créé.',
    )
  }

  async function handleDelete(deliveryNote) {
    const number = getDeliveryNoteNumber(deliveryNote)
    if (!window.confirm(`Supprimer définitivement le bon de livraison « ${number} » ?`)) {
      return
    }

    setDeletingId(deliveryNote.id)
    try {
      const deliveryRef = doc(db, 'delivery_notes', deliveryNote.id)
      await runTransaction(db, async (transaction) => {
        const noteSnapshot = await transaction.get(deliveryRef)
        if (!noteSnapshot.exists()) {
          throw new Error('Ce bon de livraison n’existe plus.')
        }

        const savedNote = noteSnapshot.data()
        const deliveredQuantities = isDelivered(savedNote)
          ? getDeliveredItemQuantities(savedNote)
          : new Map()
        const inventoryUpdates = []

        for (const [itemId, quantity] of deliveredQuantities) {
          const inventoryRef = doc(db, 'inventory', itemId)
          const inventorySnapshot = await transaction.get(inventoryRef)
          if (!inventorySnapshot.exists()) {
            throw new Error(`Impossible de restaurer le stock : l’article ${itemId} est introuvable.`)
          }
          const inventoryData = inventorySnapshot.data()
          const currentQuantity = getInventoryQuantity(inventoryData)
          if (currentQuantity === null) {
            throw new Error(`La quantité de l’article ${itemId} est invalide.`)
          }
          const restoredQuantity = currentQuantity + quantity
          if (restoredQuantity > 1000000) {
            throw new Error(`La quantité restaurée de l’article ${itemId} dépasse la limite autorisée.`)
          }
          inventoryUpdates.push({
            ref: inventoryRef,
            data: inventoryData,
            quantity: restoredQuantity,
          })
        }

        for (const update of inventoryUpdates) {
          const inventoryPayload = {
            quantite: update.quantity,
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || null,
          }
          if (Object.prototype.hasOwnProperty.call(update.data, 'quantity')) {
            inventoryPayload.quantity = update.quantity
          }
          if (Object.prototype.hasOwnProperty.call(update.data, 'quantiteActuelle')) {
            inventoryPayload.quantiteActuelle = update.quantity
          }
          transaction.update(update.ref, inventoryPayload)
        }
        transaction.delete(deliveryRef)
      })
      showToast(
        'success',
        isDelivered(deliveryNote)
          ? 'Le bon de livraison a été supprimé et les quantités ont été réintégrées au stock.'
          : 'Le bon de livraison a été supprimé.',
      )
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `Suppression impossible : ${error.message}`
          : 'Suppression impossible. Veuillez réessayer.',
      )
    } finally {
      setDeletingId('')
    }
  }

  async function handleExport(deliveryNote) {
    setExportingId(deliveryNote.id)
    try {
      const settingsSnapshot = await getDoc(doc(db, 'settings', 'company'))
      const companyInfo = getCompanyInfo(
        settingsSnapshot.exists() ? settingsSnapshot.data() : {},
      )
      const client = clientsById.get(String(deliveryNote.clientId || ''))
      const deliveryItems = Array.isArray(deliveryNote.items) ? deliveryNote.items : []
      const [{ pdf }, { default: DeliveryNotePdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/pdf/DeliveryNotePdfDocument.jsx'),
      ])
      const documentDeliveryNote = {
        ...deliveryNote,
        number: getDeliveryNoteNumber(deliveryNote),
        items: deliveryItems.map((item) => ({
          designation: String(item.designation || item.description || 'Article'),
          quantity: item.quantity ?? item.quantite ?? 0,
        })),
        clientInfo: {
          ...client,
          nom: getClientName(client, deliveryNote),
          adresse: client?.adresse || client?.address || '',
          ice: client?.ice || client?.identifiantFiscal || '',
          telephone: client?.telephone || client?.phone || '',
        },
        companyInfo,
      }
      const blob = await pdf(
        <DeliveryNotePdfDocument deliveryNote={documentDeliveryNote} />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `BL_${getDeliveryNoteNumber(deliveryNote)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast('success', 'Le bon de livraison PDF a été généré.')
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

  const isLoading = isLoadingNotes || (isLoadingClients && clients.length === 0)

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <Toast onClose={() => setToast(null)} toast={toast} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <Truck aria-hidden="true" className="h-4 w-4" />
            Logistique & livraison
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Bons de Livraison
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Préparez les livraisons, contrôlez les articles sortis et exportez les bons signables.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <TablePdfExportButton
            columns={[
              { label: 'N° BL', value: getDeliveryNoteNumber },
              { label: 'Date', value: (deliveryNote) => formatDate(deliveryNote.dateLivraison || deliveryNote.deliveryDate || deliveryNote.date) },
              { label: 'Client', value: (deliveryNote) => getClientName(clientsById.get(deliveryNote.clientId), deliveryNote) },
              { label: 'Lieu de livraison', value: (deliveryNote) => deliveryNote.lieuLivraison || '—' },
              { label: 'Transporteur / Réceptionnaire', value: (deliveryNote) => deliveryNote.transporteurReceptionnaire || '—' },
              { label: 'Réf. Document', value: (deliveryNote) => deliveryNote.referenceDocument || deliveryNote.referenceLiee || '—' },
              { label: 'Statut', value: getDeliveryNoteStatus },
            ]}
            disabled={isLoading}
            filename="Liste-bons-de-livraison"
            rows={filteredNotes}
            title="Liste des bons de livraison"
          />
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:w-auto"
            onClick={() => setModalNote(null)}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nouveau bon de livraison
          </button>
        </div>
      </header>

      {clientError && (
        <div
          className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Chargement des clients impossible : {clientError}</span>
        </div>
      )}

      <section
        aria-label="Synthèse des bons de livraison"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Bons enregistrés</p>
            <Truck aria-hidden="true" className="h-4 w-4 text-blue-700" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {deliveryNotes.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Brouillons</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-700">{draftCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Validés & livrés</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-700">
            {deliveredCount}
          </p>
        </div>
        <div className="rounded-xl border border-red-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Annulés</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-red-700">{cancelledCount}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">Registre des livraisons</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredNotes.length} bon{filteredNotes.length === 1 ? '' : 's'} affiché
              {filteredNotes.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(15rem,1fr)_12rem] sm:items-center sm:w-[min(100%,34rem)]">
            <label className="relative block">
              <span className="sr-only">Rechercher un bon de livraison</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="N° BL, client, facture..."
                type="search"
                value={search}
              />
            </label>
            <label>
              <span className="sr-only">Filtrer les bons de livraison par statut</span>
              <select
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="Tous">Tous les statuts</option>
                {DELIVERY_NOTE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {noteError && (
          <div
            className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chargement des bons de livraison impossible : {noteError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12">
            <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin text-blue-700" />
            <p className="mt-3 text-sm text-slate-500">Chargement des bons de livraison...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <Truck aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search || statusFilter !== 'Tous'
                ? 'Aucun bon de livraison ne correspond aux filtres'
                : 'Aucun bon de livraison pour le moment'}
            </h3>
            <p className="mt-1 max-w-md text-sm leading-5 text-slate-500">
              {search || statusFilter !== 'Tous'
                ? 'Modifiez la recherche ou le filtre pour afficher d’autres bons.'
                : 'Créez un bon de livraison pour documenter une sortie de stock.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    N° BL
                  </th>
                  <SortableDateHeader onSort={handleSortDate} sortDirection={sortDirection} />
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Lieu de livraison
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Transporteur / Réceptionnaire
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Réf. Document
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
                {filteredNotes.map((deliveryNote) => {
                  const number = getDeliveryNoteNumber(deliveryNote)
                  const client = clientsById.get(String(deliveryNote.clientId || ''))
                  const isExporting = exportingId === deliveryNote.id
                  const isDeleting = deletingId === deliveryNote.id

                  return (
                    <tr className="transition hover:bg-slate-50/70" key={deliveryNote.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {number}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          deliveryNote.dateLivraison ||
                            deliveryNote.deliveryDate ||
                            deliveryNote.date,
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm font-semibold text-slate-900">
                          {getClientName(client, deliveryNote)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm text-slate-600">
                          {deliveryNote.lieuLivraison || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm text-slate-600">
                          {deliveryNote.transporteurReceptionnaire || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block max-w-xs truncate text-sm text-slate-600">
                          {deliveryNote.referenceDocument ||
                            deliveryNote.referenceLiee ||
                            '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={getDeliveryNoteStatus(deliveryNote)} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={`Exporter le bon de livraison ${number} en PDF`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-wait disabled:opacity-50"
                            disabled={Boolean(exportingId) || isDeleting}
                            onClick={() => void handleExport(deliveryNote)}
                            title="Exporter le bon de livraison en PDF"
                            type="button"
                          >
                            {isExporting ? (
                              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download aria-hidden="true" className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            aria-label={`Modifier le bon de livraison ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isDeleting || Boolean(exportingId)}
                            onClick={() => setModalNote(deliveryNote)}
                            title="Modifier le bon de livraison"
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            aria-label={`Supprimer le bon de livraison ${number}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isDeleting || Boolean(exportingId)}
                            onClick={() => void handleDelete(deliveryNote)}
                            title={
                              isDelivered(deliveryNote)
                                ? 'Supprimer et réintégrer les quantités au stock'
                                : 'Supprimer le bon de livraison'
                            }
                            type="button"
                          >
                            {isDeleting ? (
                              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 aria-hidden="true" className="h-4 w-4" />
                            )}
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

      {modalNote !== undefined && (
        <DeliveryNoteForm
          deliveryNote={modalNote}
          onClose={() => setModalNote(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
