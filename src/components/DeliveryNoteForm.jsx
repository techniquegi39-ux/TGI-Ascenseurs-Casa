import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  LoaderCircle,
  MapPin,
  Plus,
  Signature,
  Trash2,
  Truck,
  UserRound,
  X,
} from 'lucide-react'
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/useAuth.js'

const DELIVERY_NOTE_STATUSES = ['Brouillon', 'Validé & Livré', 'Annulé']

function createLineId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createEmptyLine() {
  return {
    id: createLineId(),
    inventoryItemId: '',
    designation: '',
    quantity: '1',
  }
}

function formatInputDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getInputDate(value, fallback = '') {
  if (!value) {
    return fallback
  }
  if (typeof value?.toDate === 'function') {
    return formatInputDate(value.toDate())
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatInputDate(value)
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }
  return fallback
}

function getClientName(client) {
  return String(client.nom || client.raisonSociale || client.name || 'Client sans nom')
}

function getInventoryReference(item) {
  return String(item.reference || item.refArticle || item.sku || item.id)
}

function getInventoryDesignation(item) {
  return String(item.designation || item.name || 'Article sans désignation')
}

function getInventoryQuantity(item) {
  const rawQuantity = item?.quantite ?? item?.quantiteActuelle ?? item?.quantity
  if (rawQuantity === undefined || rawQuantity === null || rawQuantity === '') {
    return null
  }
  const quantity = Number(rawQuantity)
  return Number.isInteger(quantity) && quantity >= 0 ? quantity : null
}

function normalizeStatus(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

function isDeliveredStatus(value) {
  const status = normalizeStatus(value)
  return (
    status === 'livre' ||
    status === 'delivered' ||
    /^(valide|validee)\s*(?:&|et)\s*livre(e)?$/.test(status)
  )
}

function getSavedItemQuantities(order) {
  const quantities = new Map()
  const items = Array.isArray(order?.items) ? order.items : []
  for (const item of items) {
    const inventoryItemId = String(item.inventoryItemId || item.articleId || '')
    const quantity = Number(item.quantity ?? item.quantite ?? 0)
    if (inventoryItemId && Number.isInteger(quantity) && quantity > 0) {
      quantities.set(inventoryItemId, (quantities.get(inventoryItemId) || 0) + quantity)
    }
  }
  return quantities
}

function getInitialFormData(deliveryNote) {
  const today = formatInputDate(new Date())
  const sourceItems = Array.isArray(deliveryNote?.items) ? deliveryNote.items : []

  return {
    clientId: String(deliveryNote?.clientId || ''),
    clientName: String(deliveryNote?.clientName || ''),
    numero: String(deliveryNote?.numero || deliveryNote?.deliveryNoteNumber || ''),
    dateLivraison: getInputDate(
      deliveryNote?.dateLivraison || deliveryNote?.deliveryDate || deliveryNote?.date,
      today,
    ),
    referenceDocument: String(
      deliveryNote?.referenceDocument || deliveryNote?.referenceLiee || deliveryNote?.reference || '',
    ),
    status: String(deliveryNote?.status || deliveryNote?.statut || DELIVERY_NOTE_STATUSES[0]),
    items: sourceItems.length
      ? sourceItems.map((item) => ({
          id: createLineId(),
          inventoryItemId: String(item.inventoryItemId || item.articleId || ''),
          designation: String(item.designation || item.description || ''),
          quantity: String(item.quantity ?? item.quantite ?? 1),
        }))
      : [createEmptyLine()],
    livreur: String(deliveryNote?.livreur || deliveryNote?.technicien || deliveryNote?.deliveredBy || ''),
    adresseLivraison: String(
      deliveryNote?.adresseLivraison || deliveryNote?.deliveryAddress || '',
    ),
    notes: String(deliveryNote?.notes || ''),
  }
}

function getDeliveryNoteValidationErrors(
  formData,
  clients,
  inventoryById,
  availableByInventoryId,
) {
  const nextErrors = {}
  if (!clients.some((client) => client.id === formData.clientId)) {
    nextErrors.clientId = 'Sélectionnez un client valide.'
  }
  if (!formData.dateLivraison) {
    nextErrors.dateLivraison = 'La date de livraison est obligatoire.'
  }
  if (!DELIVERY_NOTE_STATUSES.includes(formData.status)) {
    nextErrors.status = 'Sélectionnez un statut valide.'
  }
  if (formData.referenceDocument.trim().length > 120) {
    nextErrors.referenceDocument = 'La référence ne doit pas dépasser 120 caractères.'
  }

  const lineErrors = formData.items.map((line, index) => {
    const lineError = {}
    const quantity = Number(line.quantity)
    const hasValidQuantity =
      line.quantity.trim() !== '' &&
      Number.isInteger(quantity) &&
      quantity > 0 &&
      quantity <= 1000000

    if (!line.inventoryItemId || !inventoryById.has(line.inventoryItemId)) {
      lineError.inventoryItemId = `Sélectionnez un article du stock pour la ligne ${index + 1}.`
    }
    if (!hasValidQuantity) {
      lineError.quantity = 'La quantité livrée doit être un entier supérieur à zéro.'
    }

    if (line.inventoryItemId && inventoryById.has(line.inventoryItemId)) {
      const availableQuantity = availableByInventoryId.get(line.inventoryItemId)
      if (availableQuantity === undefined) {
        lineError.quantity = 'La quantité en stock de cet article est invalide.'
      } else if (hasValidQuantity) {
        const quantityInOtherLines = formData.items.reduce((sum, otherLine) => {
          if (
            otherLine.id === line.id ||
            otherLine.inventoryItemId !== line.inventoryItemId
          ) {
            return sum
          }
          const otherQuantity = Number(otherLine.quantity)
          return Number.isInteger(otherQuantity) && otherQuantity > 0
            ? sum + otherQuantity
            : sum
        }, 0)
        const maximumQuantity = Math.max(0, availableQuantity - quantityInOtherLines)
        if (quantity > maximumQuantity) {
          lineError.quantity = `Stock insuffisant. Maximum : ${maximumQuantity}.`
        }
      }
    }

    return lineError
  })

  if (formData.items.length === 0) {
    nextErrors.items = [{ inventoryItemId: 'Ajoutez au moins une ligne de livraison.' }]
  } else if (lineErrors.some((lineError) => Object.keys(lineError).length > 0)) {
    nextErrors.items = lineErrors
  }
  if (!formData.livreur.trim()) {
    nextErrors.livreur = 'Le nom du livreur ou technicien est obligatoire.'
  } else if (formData.livreur.trim().length > 120) {
    nextErrors.livreur = 'Le nom ne doit pas dépasser 120 caractères.'
  }
  if (formData.adresseLivraison.trim().length > 500) {
    nextErrors.adresseLivraison = 'L’adresse ne doit pas dépasser 500 caractères.'
  }
  if (formData.notes.trim().length > 3000) {
    nextErrors.notes = 'Les notes ne doivent pas dépasser 3 000 caractères.'
  }

  return nextErrors
}

function TextField({
  id,
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
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
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
        }`}
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-700" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

function DeliveryNoteTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'general', label: 'Infos générales', icon: FileText },
    { id: 'items', label: 'Lignes de livraison', icon: Truck },
    { id: 'signature', label: 'Signature & notes', icon: Signature },
  ]

  return (
    <div
      aria-label="Sections du bon de livraison"
      className="grid grid-cols-3 gap-1 border-b border-slate-200 px-4 sm:px-7"
      role="tablist"
    >
      {tabs.map(({ id, label, icon: Icon }, index) => {
        const isActive = activeTab === id
        return (
          <button
            aria-controls={`delivery-note-panel-${id}`}
            aria-label={`Étape ${index + 1} : ${label}`}
            aria-selected={isActive}
            className={`relative flex min-h-14 items-center justify-center gap-2 px-2 py-3 text-center text-xs font-semibold transition sm:min-h-16 sm:text-sm ${
              isActive ? 'text-blue-800' : 'text-slate-500 hover:text-slate-800'
            }`}
            id={`delivery-note-tab-${id}`}
            key={id}
            onClick={() => onChange(id)}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{index + 1}</span>
            {isActive && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-700" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function DeliveryNoteForm({ deliveryNote = null, onClose, onSaved }) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState(() => getInitialFormData(deliveryNote))
  const [clients, setClients] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const [isLoadingResources, setIsLoadingResources] = useState(true)
  const [resourceError, setResourceError] = useState('')
  const [resourceReloadKey, setResourceReloadKey] = useState(0)
  const [activeTab, setActiveTab] = useState('general')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let clientsLoaded = false
    let inventoryLoaded = false

    const unsubscribeClients = onSnapshot(
      collection(db, 'clients'),
      (snapshot) => {
        setClients(
          snapshot.docs
            .map((clientDocument) => ({
              ...clientDocument.data(),
              id: clientDocument.id,
            }))
            .sort((first, second) =>
              getClientName(first).localeCompare(getClientName(second), 'fr', {
                sensitivity: 'base',
              }),
            ),
        )
        clientsLoaded = true
        if (inventoryLoaded) {
          setIsLoadingResources(false)
        }
      },
      (error) => {
        setResourceError(
          error instanceof Error
            ? error.message
            : 'Impossible de charger la liste des clients.',
        )
        setIsLoadingResources(false)
      },
    )
    const unsubscribeInventory = onSnapshot(
      collection(db, 'inventory'),
      (snapshot) => {
        setInventoryItems(
          snapshot.docs
            .map((itemDocument) => ({
              ...itemDocument.data(),
              id: itemDocument.id,
            }))
            .sort((first, second) =>
              getInventoryReference(first).localeCompare(getInventoryReference(second), 'fr', {
                sensitivity: 'base',
              }),
            ),
        )
        inventoryLoaded = true
        if (clientsLoaded) {
          setIsLoadingResources(false)
        }
      },
      (error) => {
        setResourceError(
          error instanceof Error
            ? error.message
            : 'Impossible de charger les articles du stock.',
        )
        setIsLoadingResources(false)
      },
    )

    return () => {
      unsubscribeClients()
      unsubscribeInventory()
    }
  }, [resourceReloadKey])

  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )
  const inventoryById = useMemo(
    () => new Map(inventoryItems.map((item) => [item.id, item])),
    [inventoryItems],
  )
  const previouslyDeliveredQuantities = useMemo(
    () => (isDeliveredStatus(deliveryNote?.status || deliveryNote?.statut)
      ? getSavedItemQuantities(deliveryNote)
      : new Map()),
    [deliveryNote],
  )
  const availableByInventoryId = useMemo(() => {
    const availability = new Map()
    for (const item of inventoryItems) {
      const currentQuantity = getInventoryQuantity(item)
      if (currentQuantity !== null) {
        availability.set(
          item.id,
          currentQuantity + (previouslyDeliveredQuantities.get(item.id) || 0),
        )
      }
    }
    return availability
  }, [inventoryItems, previouslyDeliveredQuantities])
  const errors = useMemo(
    () =>
      getDeliveryNoteValidationErrors(
        formData,
        clients,
        inventoryById,
        availableByInventoryId,
      ),
    [availableByInventoryId, clients, formData, inventoryById],
  )

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'clientId'
        ? {
            clientName: value ? getClientName(clientsById.get(value) || {}) : '',
            adresseLivraison: value
              ? String(
                  clientsById.get(value)?.adresse ||
                    clientsById.get(value)?.address ||
                    clientsById.get(value)?.adresseComplete ||
                    '',
                )
              : '',
          }
        : {}),
    }))
    setFormError('')
  }

  function handleLineChange(lineId, field, value) {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.map((line) => {
        if (line.id !== lineId) {
          return line
        }
        if (field === 'inventoryItemId') {
          const inventoryItem = inventoryById.get(value)
          return {
            ...line,
            inventoryItemId: value,
            designation: inventoryItem ? getInventoryDesignation(inventoryItem) : '',
            quantity: line.quantity || '1',
          }
        }
        return { ...line, [field]: value }
      }),
    }))
    setFormError('')
  }

  function addLine() {
    setFormData((previous) => ({ ...previous, items: [...previous.items, createEmptyLine()] }))
    setActiveTab('items')
  }

  function removeLine(lineId) {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.filter((line) => line.id !== lineId),
    }))
  }

  function getAvailableQuantity(itemId) {
    return availableByInventoryId.get(itemId) ?? null
  }

  function validate() {
    if (errors.clientId || errors.dateLivraison || errors.status) {
      setActiveTab('general')
    } else if (errors.items) {
      setActiveTab('items')
    } else if (errors.livreur || errors.adresseLivraison || errors.notes) {
      setActiveTab('signature')
    }
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    if (isLoadingResources) {
      setFormError('Attendez le chargement des clients et des articles avant d’enregistrer.')
      return
    }
    if (resourceError) {
      setFormError('Rechargez les clients et les articles du stock avant d’enregistrer le BL.')
      return
    }
    if (!validate()) {
      return
    }

    const selectedClient = clientsById.get(formData.clientId)
    if (!selectedClient) {
      setFormError('Le client sélectionné est introuvable. Rechargez la liste puis réessayez.')
      setActiveTab('general')
      return
    }

    const savedItems = formData.items.map((line) => {
      const inventoryItem = inventoryById.get(line.inventoryItemId)
      return {
        inventoryItemId: line.inventoryItemId,
        reference: inventoryItem ? getInventoryReference(inventoryItem) : '',
        designation: inventoryItem
          ? getInventoryDesignation(inventoryItem)
          : line.designation.trim(),
        quantity: Number(line.quantity),
      }
    })
    const payload = {
      clientId: selectedClient.id,
      clientName: getClientName(selectedClient),
      numero: formData.numero.trim().toLocaleUpperCase('fr-FR'),
      dateLivraison: formData.dateLivraison,
      referenceDocument: formData.referenceDocument.trim(),
      status: formData.status,
      items: savedItems,
      livreur: formData.livreur.trim(),
      adresseLivraison: formData.adresseLivraison.trim(),
      notes: formData.notes.trim(),
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || null,
    }

    setIsSaving(true)
    let savedAction
    try {
      const deliveryRef = deliveryNote?.id
        ? doc(db, 'delivery_notes', deliveryNote.id)
        : doc(collection(db, 'delivery_notes'))
      await runTransaction(db, async (transaction) => {
        const previousSnapshot = await transaction.get(deliveryRef)
        if (deliveryNote?.id && !previousSnapshot.exists()) {
          throw new Error('Ce bon de livraison n’existe plus.')
        }
        const previousData = previousSnapshot.exists() ? previousSnapshot.data() : null
        const oldQuantities =
          previousData && isDeliveredStatus(previousData.status || previousData.statut)
            ? getSavedItemQuantities(previousData)
            : new Map()
        const newQuantities =
          isDeliveredStatus(formData.status) ? getSavedItemQuantities(payload) : new Map()
        const inventoryDeltas = new Map()

        for (const [itemId, quantity] of oldQuantities) {
          inventoryDeltas.set(itemId, (inventoryDeltas.get(itemId) || 0) + quantity)
        }
        for (const [itemId, quantity] of newQuantities) {
          inventoryDeltas.set(itemId, (inventoryDeltas.get(itemId) || 0) - quantity)
        }

        const inventoryUpdates = []
        for (const [itemId, delta] of inventoryDeltas) {
          if (delta === 0) {
            continue
          }
          const inventoryRef = doc(db, 'inventory', itemId)
          const inventorySnapshot = await transaction.get(inventoryRef)
          if (!inventorySnapshot.exists()) {
            throw new Error(`L’article ${itemId} n’existe plus dans l’inventaire.`)
          }
          const inventoryData = inventorySnapshot.data()
          const currentQuantity = getInventoryQuantity(inventoryData)
          if (currentQuantity === null) {
            throw new Error(`La quantité en stock de l’article ${itemId} est invalide.`)
          }
          const nextQuantity = currentQuantity + delta
          if (nextQuantity < 0) {
            const inventoryItem = inventoryById.get(itemId)
            const reference = inventoryItem ? getInventoryReference(inventoryItem) : itemId
            throw new Error(
              `Stock insuffisant pour ${reference}. Disponible : ${currentQuantity}, demandé : ${Math.abs(delta)}.`,
            )
          }
          inventoryUpdates.push({
            ref: inventoryRef,
            data: inventoryData,
            quantity: nextQuantity,
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

        const savedNumber =
          payload.numero ||
          previousData?.numero ||
          previousData?.deliveryNoteNumber ||
          `BL-${new Date(`${formData.dateLivraison}T12:00:00`).getFullYear()}-${deliveryRef.id
            .slice(0, 6)
            .toUpperCase()}`
        const savedPayload = {
          ...payload,
          numero: savedNumber,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null,
        }
        if (previousSnapshot.exists()) {
          transaction.update(deliveryRef, savedPayload)
        } else {
          transaction.set(deliveryRef, {
            ...savedPayload,
            createdAt: serverTimestamp(),
            createdBy: currentUser?.uid || null,
          })
        }
      })
      savedAction = deliveryNote?.id ? 'updated' : 'created'
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

  function retryResources() {
    setIsLoadingResources(true)
    setResourceError('')
    setResourceReloadKey((key) => key + 1)
  }

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape' && !isSaving) {
      onClose()
    }
  }

  const firstItemError = Array.isArray(errors.items)
    ? errors.items.find((lineError) => Object.keys(lineError).length > 0)
    : null
  const firstValidationMessage =
    errors.clientId ||
    errors.dateLivraison ||
    errors.status ||
    errors.referenceDocument ||
    firstItemError?.inventoryItemId ||
    firstItemError?.quantity ||
    errors.livreur ||
    errors.adresseLivraison ||
    errors.notes
  const validationTab = errors.clientId || errors.dateLivraison || errors.status
    ? 'general'
    : errors.items
      ? 'items'
      : 'signature'

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
        aria-labelledby="delivery-note-form-title"
        aria-modal="true"
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-950/25"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Truck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Logistique & livraison
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900" id="delivery-note-form-title">
                {deliveryNote ? 'Modifier le bon de livraison' : 'Nouveau bon de livraison'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {formData.numero || 'Le numéro BL sera généré à l’enregistrement.'}
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

        <DeliveryNoteTabs activeTab={activeTab} onChange={setActiveTab} />

        {resourceError && (
          <div className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-7">
            <span className="min-w-0 break-words">{resourceError}</span>
            <button
              className="shrink-0 font-semibold underline underline-offset-2"
              onClick={retryResources}
              type="button"
            >
              Réessayer
            </button>
          </div>
        )}

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {!isLoadingResources && !resourceError && firstValidationMessage && (
              <div
                className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                <span className="flex min-w-0 items-start gap-2">
                  <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{firstValidationMessage}</span>
                </span>
                <button
                  className="shrink-0 font-semibold underline underline-offset-2"
                  onClick={() => setActiveTab(validationTab)}
                  type="button"
                >
                  Afficher l’erreur
                </button>
              </div>
            )}
            <section
              aria-labelledby="delivery-note-tab-general"
              className={activeTab === 'general' ? 'space-y-5' : 'hidden'}
              id="delivery-note-panel-general"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="delivery-note-client"
                  >
                    Client
                    <span aria-hidden="true" className="ml-1 text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <UserRound
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      aria-describedby={errors.clientId ? 'delivery-note-client-error' : undefined}
                      aria-invalid={Boolean(errors.clientId)}
                      className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                        errors.clientId
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                      }`}
                      disabled={isSaving || isLoadingResources || clients.length === 0}
                      id="delivery-note-client"
                      name="clientId"
                      onChange={handleChange}
                      value={formData.clientId}
                    >
                      <option value="">
                        {isLoadingResources
                          ? 'Chargement des clients...'
                          : clients.length
                            ? 'Sélectionnez un client'
                            : 'Aucun client disponible'}
                      </option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {getClientName(client)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.clientId && (
                    <p className="mt-1.5 text-xs text-red-700" id="delivery-note-client-error">
                      {errors.clientId}
                    </p>
                  )}
                  {isLoadingResources && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                      Chargement des clients et articles du stock
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="delivery-note-number"
                  >
                    N° de BL
                  </label>
                  <input
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-600"
                    id="delivery-note-number"
                    readOnly
                    value={formData.numero || 'Généré à l’enregistrement'}
                  />
                </div>
                <TextField
                  error={errors.dateLivraison}
                  id="delivery-note-date"
                  label="Date de livraison"
                  name="dateLivraison"
                  onChange={handleChange}
                  required
                  type="date"
                  value={formData.dateLivraison}
                  disabled={isSaving}
                />
                <div className="sm:col-span-2">
                  <TextField
                    error={errors.referenceDocument}
                    id="delivery-note-reference"
                    label="Référence liée"
                    name="referenceDocument"
                    onChange={handleChange}
                    placeholder="Ex. Facture FAC-001 ou Devis DEV-001"
                    value={formData.referenceDocument}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="delivery-note-status"
                  >
                    Statut
                  </label>
                  <select
                    aria-describedby={errors.status ? 'delivery-note-status-error' : undefined}
                    aria-invalid={Boolean(errors.status)}
                    className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                      errors.status
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                    }`}
                    disabled={isSaving}
                    id="delivery-note-status"
                    name="status"
                    onChange={handleChange}
                    value={formData.status}
                  >
                    {DELIVERY_NOTE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="mt-1.5 text-xs text-red-700" id="delivery-note-status-error">
                      {errors.status}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section
              aria-labelledby="delivery-note-tab-items"
              className={activeTab === 'items' ? 'space-y-4' : 'hidden'}
              id="delivery-note-panel-items"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">Articles livrés</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Le stock disponible est actualisé en direct et contrôlé avant l’enregistrement.
                  </p>
                </div>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving || isLoadingResources}
                  onClick={addLine}
                  type="button"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Ajouter une ligne
                </button>
              </div>

              {firstItemError && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {firstItemError.inventoryItemId ||
                      firstItemError.quantity ||
                      'Vérifiez les lignes de livraison.'}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {formData.items.map((line, index) => {
                  const lineError = Array.isArray(errors.items) ? errors.items[index] || {} : {}
                  const inventoryItem = inventoryById.get(line.inventoryItemId)
                  const stockQuantity = inventoryItem ? getInventoryQuantity(inventoryItem) : null
                  const availableQuantity = line.inventoryItemId
                    ? getAvailableQuantity(line.inventoryItemId)
                    : null
                  const otherLineQuantity = formData.items.reduce((sum, otherLine) => {
                    if (otherLine.id === line.id || otherLine.inventoryItemId !== line.inventoryItemId) {
                      return sum
                    }
                    const quantity = Number(otherLine.quantity)
                    return Number.isInteger(quantity) && quantity > 0 ? sum + quantity : sum
                  }, 0)
                  const lineMaximum =
                    availableQuantity === null
                      ? undefined
                      : Math.max(0, availableQuantity - otherLineQuantity)

                  return (
                    <article
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                      key={line.id}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Ligne {index + 1}
                        </p>
                        <button
                          aria-label={`Supprimer la ligne ${index + 1}`}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isSaving}
                          onClick={() => removeLine(line.id)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(150px,1fr)]">
                        <div>
                          <label
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                            htmlFor={`delivery-note-item-${line.id}`}
                          >
                            Article du stock
                          </label>
                          <select
                            aria-describedby={
                              lineError.inventoryItemId
                                ? `delivery-note-item-error-${line.id}`
                                : undefined
                            }
                            aria-invalid={Boolean(lineError.inventoryItemId)}
                            className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-4 ${
                              lineError.inventoryItemId
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                            }`}
                            disabled={isSaving || isLoadingResources}
                            id={`delivery-note-item-${line.id}`}
                            onChange={(event) =>
                              handleLineChange(line.id, 'inventoryItemId', event.target.value)
                            }
                            value={line.inventoryItemId}
                          >
                            <option value="">
                              {isLoadingResources
                                ? 'Chargement des articles...'
                                : inventoryItems.length
                                  ? 'Sélectionnez un article'
                                  : 'Aucun article en stock'}
                            </option>
                            {inventoryItems.map((item) => {
                              const quantity = getInventoryQuantity(item)
                              return (
                                <option key={item.id} value={item.id}>
                                  {getInventoryReference(item)} — {getInventoryDesignation(item)} (
                                  {quantity === null ? 'stock invalide' : `${quantity} en stock`})
                                </option>
                              )
                            })}
                          </select>
                          {lineError.inventoryItemId && (
                            <p
                              className="mt-1 text-xs text-red-700"
                              id={`delivery-note-item-error-${line.id}`}
                            >
                              {lineError.inventoryItemId}
                            </p>
                          )}
                          {inventoryItem && (
                            <p className="mt-1.5 text-xs text-slate-500">
                              Stock actuel :{' '}
                              <strong className="font-semibold text-slate-700">
                                {stockQuantity === null ? 'à vérifier' : stockQuantity}
                              </strong>
                              {availableQuantity !== null &&
                                availableQuantity !== stockQuantity && (
                                  <>
                                    {' · '}
                                    Disponible pour ce BL :{' '}
                                    <strong className="font-semibold text-blue-800">
                                      {availableQuantity}
                                    </strong>
                                  </>
                                )}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                            htmlFor={`delivery-note-quantity-${line.id}`}
                          >
                            Quantité livrée
                          </label>
                          <input
                            aria-describedby={
                              lineError.quantity
                                ? `delivery-note-quantity-error-${line.id}`
                                : undefined
                            }
                            aria-invalid={Boolean(lineError.quantity)}
                            className={`h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-4 ${
                              lineError.quantity
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                            }`}
                            disabled={isSaving || !line.inventoryItemId}
                            id={`delivery-note-quantity-${line.id}`}
                            max={lineMaximum}
                            min="1"
                            onChange={(event) =>
                              handleLineChange(line.id, 'quantity', event.target.value)
                            }
                            step="1"
                            type="number"
                            value={line.quantity}
                          />
                          {lineError.quantity && (
                            <p
                              className="mt-1 text-xs text-red-700"
                              id={`delivery-note-quantity-error-${line.id}`}
                            >
                              {lineError.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <section
              aria-labelledby="delivery-note-tab-signature"
              className={activeTab === 'signature' ? 'space-y-5' : 'hidden'}
              id="delivery-note-panel-signature"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  error={errors.livreur}
                  id="delivery-note-carrier"
                  label="Nom du livreur / technicien"
                  name="livreur"
                  onChange={handleChange}
                  placeholder="Nom et prénom"
                  required
                  value={formData.livreur}
                  disabled={isSaving}
                />
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="delivery-note-address"
                  >
                    Adresse de livraison
                  </label>
                  <div className="relative">
                    <MapPin
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400"
                    />
                    <textarea
                      aria-describedby={
                        errors.adresseLivraison ? 'delivery-note-address-error' : undefined
                      }
                      aria-invalid={Boolean(errors.adresseLivraison)}
                      className={`min-h-24 w-full resize-y rounded-lg border bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        errors.adresseLivraison
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                      }`}
                      disabled={isSaving}
                      id="delivery-note-address"
                      name="adresseLivraison"
                      onChange={handleChange}
                      placeholder="Adresse complète de livraison"
                      rows={3}
                      value={formData.adresseLivraison}
                    />
                  </div>
                  {errors.adresseLivraison && (
                    <p
                      className="mt-1.5 text-xs text-red-700"
                      id="delivery-note-address-error"
                    >
                      {errors.adresseLivraison}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label
                    className="mb-2 block text-sm font-medium text-slate-700"
                    htmlFor="delivery-note-notes"
                  >
                    Notes
                  </label>
                  <textarea
                    aria-describedby={errors.notes ? 'delivery-note-notes-error' : undefined}
                    aria-invalid={Boolean(errors.notes)}
                    className={`min-h-28 w-full resize-y rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                      errors.notes
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/10'
                    }`}
                    disabled={isSaving}
                    id="delivery-note-notes"
                    name="notes"
                    onChange={handleChange}
                    placeholder="Ex. Remis en main propre au syndic..."
                    rows={4}
                    value={formData.notes}
                  />
                  {errors.notes && (
                    <p className="mt-1.5 text-xs text-red-700" id="delivery-note-notes-error">
                      {errors.notes}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {formError && (
              <div
                className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
                role="alert"
              >
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving || activeTab === 'general'}
              onClick={() =>
                setActiveTab(activeTab === 'signature' ? 'items' : 'general')
              }
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              Précédent
            </button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              {activeTab !== 'signature' ? (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                  onClick={() => setActiveTab(activeTab === 'general' ? 'items' : 'signature')}
                  type="button"
                >
                  Suivant
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    isSaving ||
                    isLoadingResources ||
                    Boolean(resourceError) ||
                    Object.keys(errors).length > 0
                  }
                  type="submit"
                >
                  {isSaving ? (
                    <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Truck aria-hidden="true" className="h-4 w-4" />
                  )}
                  {isSaving ? 'Enregistrement...' : 'Enregistrer le BL'}
                </button>
              )}
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
