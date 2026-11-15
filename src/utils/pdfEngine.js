import { jsPDF } from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'
import { doc as firestoreDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

applyPlugin(jsPDF)

export const PDF_COMPANY_INFO = {
  name: 'TGI ASCENSEURS CASA',
  address: '',
  phone: '',
  email: '',
  ice: '',
  rc: '',
  patente: '',
}

const COLORS = {
  steelBlue: [70, 130, 180],
  ink: [35, 48, 61],
  muted: [98, 111, 123],
  border: [205, 214, 221],
  lightGray: [244, 247, 249],
  white: [255, 255, 255],
}

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 14
const MARGIN_RIGHT = 14
const FOOTER_TOP = 278
const FOOTER_SPACE = PAGE_HEIGHT - FOOTER_TOP + 4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

function normalizeCompanyInfo(settings = {}) {
  const getText = (key, fallback = '') =>
    typeof settings[key] === 'string' && settings[key].trim()
      ? settings[key].trim()
      : fallback

  return {
    name: getText('name', PDF_COMPANY_INFO.name),
    address: getText('address'),
    phone: getText('phone'),
    email: getText('email'),
    ice: getText('ice'),
    rc: getText('rc'),
    patente: getText('patente'),
  }
}

async function loadCompanyInfo() {
  const settingsSnapshot = await getDoc(firestoreDoc(db, 'settings', 'company'))
  return normalizeCompanyInfo(
    settingsSnapshot.exists() ? settingsSnapshot.data() : PDF_COMPANY_INFO,
  )
}

function normalizeKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getField(record, aliases) {
  if (!record || typeof record !== 'object') {
    return undefined
  }

  const normalizedRecord = new Map(
    Object.entries(record).map(([key, value]) => [normalizeKey(key), value]),
  )

  for (const alias of aliases) {
    const value = normalizedRecord.get(normalizeKey(alias))
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  return undefined
}

function parseNumber(value, label) {
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value
    }

    throw new TypeError(`${label} doit être un nombre fini.`)
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${label} doit être un nombre ou une chaîne numérique.`)
  }

  const compact = value.trim().replace(/\s/g, '')
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)[eE][+-]?\d+$/.test(compact)) {
    return Number(compact)
  }

  let normalized = compact.replace(/[^\d,.-]/g, '')

  if (!normalized || normalized === '-' || normalized === '.' || normalized === ',') {
    throw new TypeError(`${label} n'est pas un nombre valide.`)
  }

  const lastComma = normalized.lastIndexOf(',')
  const lastPeriod = normalized.lastIndexOf('.')

  if (lastComma >= 0 && lastPeriod >= 0) {
    if (lastComma > lastPeriod) {
      normalized = normalized.replace(/\./g, '').replace(',', '.')
    } else {
      normalized = normalized.replace(/,/g, '')
    }
  } else if (lastComma >= 0) {
    normalized = normalized.replace(',', '.')
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`${label} n'est pas un nombre valide.`)
  }

  return parsed
}

function optionalNumber(record, aliases, label) {
  const value = getField(record, aliases)
  return value === undefined ? undefined : parseNumber(value, label)
}

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  })
    .format(value)
    .replace(/[\u00a0\u202f]/g, ' ')
}

function formatAmount(value) {
  return `${formatNumber(value)} MAD`
}

function formatDate(value) {
  if (value === undefined || value === null || value === '') {
    return new Intl.DateTimeFormat('fr-MA', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }

  let dateValue = value
  if (typeof dateValue?.toDate === 'function') {
    dateValue = dateValue.toDate()
  }

  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    dateValue = `${dateValue}T12:00:00`
  }

  const parsedDate = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate)
}

function formatTaxRate(value, label) {
  if (value === undefined || value === null || value === '') {
    return 0
  }

  const isExplicitPercent = typeof value === 'string' && value.includes('%')
  const rate = parseNumber(String(value).replace('%', ''), label)
  return !isExplicitPercent && rate > 0 && rate <= 1 ? rate * 100 : rate
}

function normalizeItems(items) {
  return items.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new TypeError(`La ligne ${index + 1} doit être un objet valide.`)
    }

    const designation = getField(item, ['designation', 'description', 'libelle', 'name'])
    const quantityValue = getField(item, ['quantite', 'quantity', 'qte'])
    const unitPriceValue = getField(item, [
      'prixUnitaireHT',
      'prixUnitaireHt',
      'prixUnitaire',
      'puHT',
      'pu',
      'unitPrice',
    ])
    const lineTotalValue = getField(item, ['totalHT', 'totalHt', 'montantHT', 'lineTotal'])
    const taxValue = getField(item, ['tva', 'tauxTVA', 'tauxTva', 'vatRate'])

    const quantity =
      quantityValue === undefined
        ? 0
        : parseNumber(quantityValue, `Quantité de la ligne ${index + 1}`)
    const unitPrice =
      unitPriceValue === undefined
        ? 0
        : parseNumber(unitPriceValue, `Prix unitaire de la ligne ${index + 1}`)
    const taxRate = formatTaxRate(taxValue, `TVA de la ligne ${index + 1}`)
    const totalHT =
      lineTotalValue === undefined
        ? quantity * unitPrice
        : parseNumber(lineTotalValue, `Total HT de la ligne ${index + 1}`)

    return {
      designation: String(designation ?? '—'),
      quantity,
      unitPrice,
      taxRate,
      totalHT,
      totalTVA: totalHT * (taxRate / 100),
      detail: String(getField(item, ['value', 'detail']) ?? '—'),
    }
  })
}

function getDocumentTotals(totaux, normalizedItems) {
  const computedHT = normalizedItems.reduce((sum, item) => sum + item.totalHT, 0)
  const computedTVA = normalizedItems.reduce((sum, item) => sum + item.totalTVA, 0)
  const totalHT =
    optionalNumber(totaux, ['totalHT', 'sousTotalHT', 'subtotalHT', 'ht'], 'Total HT') ??
    computedHT
  const totalTVA =
    optionalNumber(totaux, ['totalTVA', 'totalTva', 'tva'], 'Total TVA') ?? computedTVA
  const totalTTC =
    optionalNumber(totaux, ['totalTTC', 'totalTtc', 'ttc'], 'Total TTC') ??
    totalHT + totalTVA

  return { totalHT, totalTVA, totalTTC }
}

function drawCompanyHeader(doc, typeDocument, numero, date, clientInfo, companyInfo) {
  const leftX = MARGIN_LEFT
  const rightX = PAGE_WIDTH - MARGIN_RIGHT
  let companyY = 16

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.ink)
  doc.text(companyInfo.name, leftX, companyY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLORS.muted)

  const companyLines = [
    ['Adresse', companyInfo.address],
    ['Tél.', companyInfo.phone],
    ['Email', companyInfo.email],
  ]

  for (const [label, value] of companyLines) {
    companyY += 5
    doc.text(`${label} : ${value || 'À renseigner'}`, leftX, companyY)
  }

  const title = `${typeDocument.toLocaleUpperCase('fr-FR')} N° ${numero}`
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...COLORS.steelBlue)
  const titleLines = doc.splitTextToSize(title, 82)
  doc.text(titleLines, rightX, 18, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.muted)
  doc.text(`Date : ${formatDate(date)}`, rightX, 18 + titleLines.length * 5 + 2, {
    align: 'right',
  })

  const clientBoxY = 48
  const clientBoxHeight = 33
  const clientName = getField(clientInfo, ['nom', 'name', 'raisonSociale']) || '—'
  const clientAddress = getField(clientInfo, ['adresse', 'address']) || '—'
  const clientIce = getField(clientInfo, ['ice']) || '—'

  doc.setFillColor(...COLORS.lightGray)
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.35)
  doc.roundedRect(
    MARGIN_LEFT,
    clientBoxY,
    CONTENT_WIDTH,
    clientBoxHeight,
    1.5,
    1.5,
    'FD',
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLORS.steelBlue)
  doc.text('CLIENT', MARGIN_LEFT + 5, clientBoxY + 6)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...COLORS.ink)
  doc.text(
    doc.splitTextToSize(String(clientName), CONTENT_WIDTH - 10).slice(0, 2),
    MARGIN_LEFT + 5,
    clientBoxY + 12,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  const addressLines = doc.splitTextToSize(`Adresse : ${clientAddress}`, 112).slice(0, 2)
  doc.text(addressLines, MARGIN_LEFT + 5, clientBoxY + 24)
  doc.text(`ICE : ${clientIce}`, MARGIN_LEFT + 122, clientBoxY + 24)
}

function drawContinuationHeader(doc, typeDocument, numero) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.steelBlue)
  doc.text(`${typeDocument.toLocaleUpperCase('fr-FR')} N° ${numero} — Suite`, MARGIN_LEFT, 12)
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_LEFT, 15, PAGE_WIDTH - MARGIN_RIGHT, 15)
}

function drawTotals(doc, totals, y) {
  const blockWidth = 72
  const x = PAGE_WIDTH - MARGIN_RIGHT - blockWidth
  const rowHeight = 7

  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.35)
  doc.line(x, y, x + blockWidth, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.ink)
  doc.text('Total HT', x + 2, y + 5)
  doc.text(formatAmount(totals.totalHT), x + blockWidth - 2, y + 5, { align: 'right' })

  doc.text('Total TVA', x + 2, y + 5 + rowHeight)
  doc.text(formatAmount(totals.totalTVA), x + blockWidth - 2, y + 5 + rowHeight, {
    align: 'right',
  })

  doc.setFillColor(...COLORS.lightGray)
  doc.roundedRect(x, y + 10 + rowHeight, blockWidth, 9, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.steelBlue)
  doc.text('Total TTC', x + 2, y + 16 + rowHeight)
  doc.text(formatAmount(totals.totalTTC), x + blockWidth - 2, y + 16 + rowHeight, {
    align: 'right',
  })

  return y + 12 + rowHeight
}

function drawNotes(doc, notes, startY, typeDocument, numero) {
  const noteText = Array.isArray(notes) ? notes.map(String).join('\n') : String(notes ?? '').trim()
  if (!noteText) {
    return startY
  }

  const lineHeight = 4.5
  let y = startY

  if (y + 10 > FOOTER_TOP - 5) {
    doc.addPage()
    drawContinuationHeader(doc, typeDocument, numero)
    y = 23
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.ink)
  doc.text('Notes', MARGIN_LEFT, y + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLORS.muted)
  const paragraphs = noteText.split(/\r?\n/)
  const noteLines = paragraphs.flatMap((paragraph) =>
    paragraph ? doc.splitTextToSize(paragraph, CONTENT_WIDTH) : [' '],
  )

  y += 9
  for (const line of noteLines) {
    if (y + lineHeight > FOOTER_TOP - 5) {
      doc.addPage()
      drawContinuationHeader(doc, typeDocument, numero)
      y = 23
    }

    doc.text(line, MARGIN_LEFT, y)
    y += lineHeight
  }

  return y + 2
}

function drawSignature(doc, typeDocument, y, signatureLabelOverride) {
  const isQuote = normalizeKey(typeDocument).includes('devis')
  const label =
    typeof signatureLabelOverride === 'string' && signatureLabelOverride.trim()
      ? signatureLabelOverride.trim()
      : isQuote
        ? 'Bon pour accord'
        : 'La Direction'
  const boxWidth = 66
  const boxHeight = 27
  const x = PAGE_WIDTH - MARGIN_RIGHT - boxWidth

  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.35)
  doc.roundedRect(x, y, boxWidth, boxHeight, 1, 1, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLORS.ink)
  doc.text(label, x + boxWidth / 2, y + 6, { align: 'center' })
  doc.setDrawColor(...COLORS.muted)
  doc.line(x + 8, y + boxHeight - 5, x + boxWidth - 8, y + boxHeight - 5)
}

function drawFooter(doc, pageNumber, pageCount, companyInfo) {
  const legalInfo = [
    `ICE : ${companyInfo.ice || 'À renseigner'}`,
    `RC : ${companyInfo.rc || 'À renseigner'}`,
    `Patente : ${companyInfo.patente || 'À renseigner'}`,
  ].join('  |  ')
  const legalLines = doc.splitTextToSize(legalInfo, CONTENT_WIDTH - 12).slice(0, 2)

  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.35)
  doc.line(MARGIN_LEFT, FOOTER_TOP, PAGE_WIDTH - MARGIN_RIGHT, FOOTER_TOP)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  doc.text(legalLines, PAGE_WIDTH / 2, FOOTER_TOP + 5, { align: 'center' })
  doc.text(`Page ${pageNumber}/${pageCount}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 5, {
    align: 'center',
  })
}

function makeFilename(typeDocument, numero) {
  const safePart = (value) =>
    String(value)
      .trim()
      .replace(/[<>:"/\\|?*]/g, '-')
      .split('')
      .filter((character) => character.charCodeAt(0) >= 32)
      .join('')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

  return `${safePart(typeDocument)}-${safePart(numero)}.pdf`
}

export async function generatePremiumPDF({
  typeDocument,
  numero,
  date,
  clientInfo = {},
  items,
  totaux = {},
  notes = '',
  companyInfo: companyInfoOverride,
  layout = 'commercial',
  signatureLabel,
  showTotals = true,
} = {}) {
  if (typeof typeDocument !== 'string' || !typeDocument.trim()) {
    throw new TypeError('Le type de document est obligatoire.')
  }

  if (numero === undefined || numero === null || String(numero).trim() === '') {
    throw new TypeError('Le numéro du document est obligatoire.')
  }

  if (!Array.isArray(items)) {
    throw new TypeError('Les lignes du document doivent être fournies sous forme de tableau.')
  }

  if (!['commercial', 'details'].includes(layout)) {
    throw new TypeError('La mise en page du document doit être "commercial" ou "details".')
  }

  const documentType = typeDocument.trim()
  const documentNumber = String(numero).trim()
  const companyInfo = companyInfoOverride
    ? normalizeCompanyInfo(companyInfoOverride)
    : await loadCompanyInfo()
  const normalizedItems = normalizeItems(items)
  const totals = getDocumentTotals(totaux, normalizedItems)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true,
  })

  doc.setProperties({
    title: `${documentType} N° ${documentNumber}`,
    subject: `${documentType} TGI Ascenseurs Casa`,
    author: companyInfo.name,
    creator: 'TGI Manager Pro',
  })

  drawCompanyHeader(doc, documentType, documentNumber, date, clientInfo, companyInfo)

  const tableHead =
    layout === 'details'
      ? [['Information', 'Détail']]
      : [['Désignation', 'Quantité', 'Prix Unitaire HT', 'TVA', 'Total HT']]
  const tableRows = normalizedItems.length
    ? normalizedItems.map((item) =>
        layout === 'details'
          ? [item.designation, item.detail]
          : [
              item.designation,
              formatNumber(item.quantity, 3),
              formatAmount(item.unitPrice),
              `${formatNumber(item.taxRate, 2)} %`,
              formatAmount(item.totalHT),
            ],
      )
    : [layout === 'details' ? ['Aucune information', '—'] : ['Aucune ligne', '—', '—', '—', '—']]

  doc.autoTable({
    startY: 88,
    margin: {
      top: 19,
      right: MARGIN_RIGHT,
      bottom: FOOTER_SPACE,
      left: MARGIN_LEFT,
    },
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    showHead: 'everyPage',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: COLORS.ink,
      lineColor: COLORS.border,
      lineWidth: 0.2,
      cellPadding: 2.2,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: COLORS.steelBlue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      minCellHeight: 9,
    },
    columnStyles:
      layout === 'details'
        ? {
            0: { cellWidth: 53, halign: 'left', fontStyle: 'bold' },
            1: { cellWidth: 129, halign: 'left' },
          }
        : {
            0: { cellWidth: 72, halign: 'left' },
            1: { cellWidth: 18, halign: 'center' },
            2: { cellWidth: 36, halign: 'center' },
            3: { cellWidth: 18, halign: 'center' },
            4: { cellWidth: 38, halign: 'center' },
          },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawContinuationHeader(doc, documentType, documentNumber)
      }
    },
  })

  if (layout !== 'details') {
    let cursorY = doc.lastAutoTable.finalY + 8
    cursorY = drawNotes(doc, notes, cursorY, documentType, documentNumber)

    if (showTotals) {
      if (cursorY + 27 > FOOTER_TOP - 5) {
        doc.addPage()
        drawContinuationHeader(doc, documentType, documentNumber)
        cursorY = 23
      }

      cursorY = drawTotals(doc, totals, cursorY)
    }

    if (cursorY + 30 > FOOTER_TOP - 5) {
      doc.addPage()
      drawContinuationHeader(doc, documentType, documentNumber)
      cursorY = 23
    }

    drawSignature(doc, documentType, cursorY + 3, signatureLabel)
  } else if (notes || signatureLabel) {
    let cursorY = doc.lastAutoTable.finalY + 8
    cursorY = drawNotes(doc, notes, cursorY, documentType, documentNumber)

    if (signatureLabel) {
      if (cursorY + 30 > FOOTER_TOP - 5) {
        doc.addPage()
        drawContinuationHeader(doc, documentType, documentNumber)
        cursorY = 23
      }

      drawSignature(doc, documentType, cursorY + 3, signatureLabel)
    }
  }

  const pageCount = doc.getNumberOfPages()
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber)
    drawFooter(doc, pageNumber, pageCount, companyInfo)
  }

  doc.save(makeFilename(documentType, documentNumber))
  return doc
}
