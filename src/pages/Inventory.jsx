import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Archive,
  ArrowDown,
  ArrowUp,
  Boxes,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import InventoryForm from '../components/InventoryForm.jsx'
import { useAuth } from '../context/useAuth.js'
import { db } from '../firebase.js'

const INVENTORY_STATUSES = ['Rupture de Stock', 'Stock Faible', 'En Stock']

function getInventoryReference(item) {
  return String(item.reference || item.refArticle || item.sku || 'Sans référence')
}

function getInventoryDesignation(item) {
  return String(item.designation || item.name || 'Article sans désignation')
}

function getInventoryCategory(item) {
  return String(item.categorie || item.category || 'Catégorie non renseignée')
}

function getInventoryQuantity(item) {
  const rawQuantity = item.quantite ?? item.quantiteActuelle ?? item.quantity
  if (rawQuantity === undefined || rawQuantity === null || rawQuantity === '') {
    return null
  }
  const quantity = Number(rawQuantity)
  return Number.isInteger(quantity) && quantity >= 0 ? quantity : null
}

function getAlertThreshold(item) {
  const rawThreshold = item.seuilAlerte ?? item.alertThreshold
  if (rawThreshold === undefined || rawThreshold === null || rawThreshold === '') {
    return null
  }
  const threshold = Number(rawThreshold)
  return Number.isInteger(threshold) && threshold >= 0 ? threshold : null
}

function getInventoryStatus(item) {
  const quantity = getInventoryQuantity(item)
  const threshold = getAlertThreshold(item)

  if (quantity === null) {
    return 'Données à vérifier'
  }
  if (quantity === 0) {
    return 'Rupture de Stock'
  }
  if (threshold === null) {
    return 'Données à vérifier'
  }
  if (quantity <= threshold) {
    return 'Stock Faible'
  }
  return 'En Stock'
}

function getLocation(item) {
  return String(item.emplacement || item.location || '')
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

function StatusBadge({ status }) {
  const styles = {
    'Rupture de Stock': {
      badge: 'bg-red-50 text-red-800 ring-red-600/20',
      dot: 'bg-red-500',
    },
    'Stock Faible': {
      badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
      dot: 'bg-amber-500',
    },
    'En Stock': {
      badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
      dot: 'bg-emerald-500',
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
        <Package aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
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

function SummaryCard({ label, value, icon: Icon, tone }) {
  const tones = {
    blue: 'border-blue-100 text-blue-700',
    red: 'border-red-100 text-red-700',
    amber: 'border-amber-100 text-amber-700',
    emerald: 'border-emerald-100 text-emerald-700',
  }

  return (
    <article className={`rounded-xl border bg-white p-4 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </article>
  )
}

function formatQuantity(quantity) {
  if (quantity === null) {
    return '—'
  }
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(quantity)
}

export default function Inventory() {
  const { currentUser } = useAuth()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState('')
  const [modalItem, setModalItem] = useState(null)
  const [adjustingItems, setAdjustingItems] = useState(() => new Set())
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'inventory'),
      (snapshot) => {
        setItems(
          snapshot.docs.map((itemDocument) => ({
            ...itemDocument.data(),
            id: itemDocument.id,
          })),
        )
        setInventoryError('')
        setIsLoading(false)
      },
      (error) => {
        setInventoryError(
          error instanceof Error ? error.message : 'Impossible de charger le stock.',
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

  const filteredItems = useMemo(() => {
    const queryText = normalizeSearch(search)
    return items
      .filter((item) => {
        const status = getInventoryStatus(item)
        if (statusFilter !== 'Tous' && status !== statusFilter) {
          return false
        }
        if (!queryText) {
          return true
        }
        return [
          getInventoryReference(item),
          getInventoryDesignation(item),
          getInventoryCategory(item),
          getLocation(item),
        ].some((value) => normalizeSearch(value).includes(queryText))
      })
      .sort((first, second) =>
        getInventoryReference(first).localeCompare(getInventoryReference(second), 'fr', {
          sensitivity: 'base',
        }),
      )
  }, [items, search, statusFilter])

  const lowStockCount = items.filter(
    (item) => getInventoryStatus(item) === 'Stock Faible',
  ).length
  const outOfStockCount = items.filter(
    (item) => getInventoryStatus(item) === 'Rupture de Stock',
  ).length
  const availableCount = items.filter((item) => getInventoryStatus(item) === 'En Stock').length

  function showToast(type, message) {
    setToast({ type, message })
  }

  function handleSaved(action) {
    setModalItem(null)
    showToast(
      'success',
      action === 'updated' ? 'L’article a été modifié.' : 'L’article a été ajouté au stock.',
    )
  }

  async function handleDelete(item) {
    const reference = getInventoryReference(item)
    if (!window.confirm(`Supprimer définitivement l’article « ${reference} » ?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'inventory', item.id))
      showToast('success', `L’article « ${reference} » a été supprimé.`)
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `Suppression impossible : ${error.message}`
          : 'Suppression impossible. Veuillez réessayer.',
      )
    }
  }

  async function handleAdjustStock(item, adjustment) {
    setAdjustingItems((previous) => new Set(previous).add(item.id))

    try {
      const itemRef = doc(db, 'inventory', item.id)
      const updatedQuantity = await runTransaction(db, async (transaction) => {
        const itemSnapshot = await transaction.get(itemRef)
        if (!itemSnapshot.exists()) {
          throw new Error('Cet article n’existe plus dans le stock.')
        }

        const currentItem = itemSnapshot.data()
        const currentQuantity = getInventoryQuantity(currentItem)
        if (currentQuantity === null) {
          throw new Error('La quantité actuelle est invalide. Modifiez l’article avant de l’ajuster.')
        }

        const nextQuantity = currentQuantity + adjustment
        if (nextQuantity < 0) {
          throw new Error('La quantité en stock ne peut pas être négative.')
        }
        if (nextQuantity > 1000000) {
          throw new Error('La quantité dépasse la limite autorisée.')
        }

        const updatePayload = {
          quantite: nextQuantity,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null,
        }
        if (Object.prototype.hasOwnProperty.call(currentItem, 'quantity')) {
          updatePayload.quantity = nextQuantity
        }
        if (Object.prototype.hasOwnProperty.call(currentItem, 'quantiteActuelle')) {
          updatePayload.quantiteActuelle = nextQuantity
        }
        transaction.update(itemRef, updatePayload)
        return nextQuantity
      })

      showToast(
        'success',
        `${getInventoryReference(item)} : stock ${adjustment > 0 ? 'augmenté' : 'diminué'} à ${updatedQuantity}.`,
      )
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `Ajustement impossible : ${error.message}`
          : 'Ajustement impossible. Veuillez réessayer.',
      )
    } finally {
      setAdjustingItems((previous) => {
        const next = new Set(previous)
        next.delete(item.id)
        return next
      })
    }
  }

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <Toast onClose={() => setToast(null)} toast={toast} />

      {modalItem !== null && (
        <InventoryForm
          item={modalItem}
          onClose={() => setModalItem(null)}
          onSaved={handleSaved}
        />
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <Archive aria-hidden="true" className="h-4 w-4" />
            Logistique
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Stock & Inventaire
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Gérez les articles du magasin, ajustez les quantités et repérez les réapprovisionnements nécessaires.
          </p>
        </div>
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 sm:w-auto"
          onClick={() => setModalItem({})}
          type="button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Ajouter un article
        </button>
      </header>

      <section aria-label="Synthèse du stock" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Boxes} label="Articles référencés" tone="blue" value={items.length} />
        <SummaryCard
          icon={Package}
          label="En stock"
          tone="emerald"
          value={availableCount}
        />
        <SummaryCard
          icon={AlertCircle}
          label="Stock faible"
          tone="amber"
          value={lowStockCount}
        />
        <SummaryCard
          icon={Archive}
          label="Ruptures"
          tone="red"
          value={outOfStockCount}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-slate-900">Registre du magasin</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredItems.length} article{filteredItems.length === 1 ? '' : 's'} affiché
              {filteredItems.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(230px,1fr)_210px] sm:w-[min(100%,36rem)]">
            <label className="relative block">
              <span className="sr-only">Rechercher un article</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Réf, désignation, catégorie..."
                type="search"
                value={search}
              />
            </label>
            <label>
              <span className="sr-only">Filtrer les articles par statut de stock</span>
              <select
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="Tous">Tous les statuts</option>
                {INVENTORY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
                <option value="Données à vérifier">Données à vérifier</option>
              </select>
            </label>
          </div>
        </div>

        {inventoryError && (
          <div
            className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Chargement du stock impossible : {inventoryError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center">
            <LoaderCircle aria-hidden="true" className="h-7 w-7 animate-spin text-blue-700" />
            <p className="text-sm text-slate-500">Chargement de l’inventaire...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <Package aria-hidden="true" className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              {inventoryError ? 'L’inventaire est indisponible' : 'Aucun article à afficher'}
            </h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
              {inventoryError
                ? 'Vérifiez votre connexion ou vos autorisations Firestore, puis réessayez.'
                : search
                  ? 'Aucun article ne correspond à votre recherche.'
                  : statusFilter === 'Tous'
                    ? 'Ajoutez un article pour commencer à suivre le stock.'
                    : 'Aucun article ne correspond à ce statut.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">Réf Article</th>
                  <th className="px-5 py-3.5">Désignation</th>
                  <th className="px-5 py-3.5">Catégorie</th>
                  <th className="px-5 py-3.5 text-right">Quantité actuelle</th>
                  <th className="px-5 py-3.5 text-right">Seuil d’alerte</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const quantity = getInventoryQuantity(item)
                  const threshold = getAlertThreshold(item)
                  const status = getInventoryStatus(item)
                  const isAdjusting = adjustingItems.has(item.id)
                  const canAdjust = quantity !== null && !isAdjusting

                  return (
                    <tr className="transition hover:bg-slate-50/80" key={item.id}>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-sm font-semibold text-slate-900">
                          {getInventoryReference(item)}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-5 py-4">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {getInventoryDesignation(item)}
                        </span>
                        {getLocation(item) && (
                          <span className="mt-1 block truncate text-xs text-slate-500">
                            Emplacement : {getLocation(item)}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          <Archive aria-hidden="true" className="h-3.5 w-3.5 text-slate-500" />
                          {getInventoryCategory(item)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold tabular-nums text-slate-900">
                        {formatQuantity(quantity)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm tabular-nums text-slate-600">
                        {formatQuantity(threshold)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <div
                            aria-label={`Ajuster le stock de ${getInventoryReference(item)}`}
                            className="mr-1 inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5"
                            role="group"
                          >
                            <button
                              aria-label={`Décrémenter ${getInventoryReference(item)} d’une unité`}
                              className="grid h-8 w-8 place-items-center rounded-md text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={!canAdjust || quantity === 0}
                              onClick={() => handleAdjustStock(item, -1)}
                              title="Décrémenter d’une unité"
                              type="button"
                            >
                              {isAdjusting ? (
                                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowDown aria-hidden="true" className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              aria-label={`Incrémenter ${getInventoryReference(item)} d’une unité`}
                              className="grid h-8 w-8 place-items-center rounded-md text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={!canAdjust}
                              onClick={() => handleAdjustStock(item, 1)}
                              title="Incrémenter d’une unité"
                              type="button"
                            >
                              <ArrowUp aria-hidden="true" className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            aria-label={`Modifier ${getInventoryReference(item)}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => setModalItem(item)}
                            title="Modifier"
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <button
                            aria-label={`Supprimer ${getInventoryReference(item)}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(item)}
                            title="Supprimer"
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
    </div>
  )
}
