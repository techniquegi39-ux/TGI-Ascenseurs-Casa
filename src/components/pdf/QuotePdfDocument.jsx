import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  PdfClientSummary,
  PdfDocumentFooter,
  PdfDocumentHeader,
  PdfSignatures,
} from './PdfDocumentChrome.jsx'
import PdfFinancialDetails from './PdfFinancialDetails.jsx'
import { pdfPageStyles } from './PdfDocumentStyles.js'

const NAVY = '#0A2540'
const BORDER = '#E2E8F0'
const MUTED = '#64748B'
const PALE_BLUE = '#F8FAFC'

const styles = StyleSheet.create({
  page: {
    paddingTop: 130,
    paddingBottom: 90,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoFrame: {
    width: 82,
    height: 70,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  logo: {
    width: 72,
    height: 60,
    objectFit: 'contain',
  },
  documentTitle: {
    marginLeft: 16,
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
  },
  companyBlock: {
    width: '47%',
    alignItems: 'flex-end',
  },
  companyName: {
    marginBottom: 3,
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  companyDetail: {
    marginTop: 2,
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 8,
    textAlign: 'right',
  },
  clientDetails: {
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  clientBlock: {
    width: '48%',
    paddingTop: 4,
  },
  quoteInfo: {
    width: '42%',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
  },
  quoteInfoRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  quoteInfoLabel: {
    width: '43%',
    paddingRight: 6,
    color: MUTED,
    fontSize: 8,
  },
  quoteInfoValue: {
    width: '57%',
    color: '#0F172A',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  title: {
    marginBottom: 7,
    color: MUTED,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  clientName: {
    marginBottom: 4,
    color: '#0F172A',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  clientDetail: {
    marginTop: 2,
    color: '#1F2937',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderTopWidth: 1,
    borderTopColor: NAVY,
    borderBottomWidth: 1,
    borderBottomColor: NAVY,
  },
  headerCell: {
    paddingVertical: 9,
    paddingHorizontal: 8,
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  alternateRow: {
    backgroundColor: PALE_BLUE,
  },
  cell: {
    color: '#0F172A',
    fontSize: 8,
  },
  emptyCell: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 7,
    color: MUTED,
    fontSize: 10,
    textAlign: 'center',
  },
  afterTable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  note: {
    marginTop: 8,
    color: MUTED,
    fontSize: 8,
    lineHeight: 1.4,
  },
  documentConditions: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  conditionsHeading: {
    marginBottom: 5,
    color: NAVY,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 3,
  },
  conditionLabel: {
    width: '30%',
    paddingRight: 8,
    color: MUTED,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  conditionValue: {
    flexGrow: 1,
    color: '#0F172A',
    fontSize: 9,
    lineHeight: 1.35,
  },
  totals: {
    width: '48%',
    alignItems: 'stretch',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    color: MUTED,
    fontSize: 9,
  },
  totalValue: {
    color: '#0F172A',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotal: {
    marginTop: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: NAVY,
    borderRadius: 2,
  },
  grandTotalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  signatureBox: {
    minHeight: 135,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  signatureTitle: {
    marginBottom: 7,
    color: '#0F172A',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'left',
  },
  signatureHint: {
    color: MUTED,
    fontSize: 8,
    textAlign: 'left',
  },
  signatureLine: {
    height: 48,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#9CA3AF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    paddingHorizontal: 40,
    paddingTop: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerColumn: {
    width: '32%',
    paddingRight: 8,
  },
  legalText: {
    marginTop: 2,
    color: MUTED,
    fontSize: 7,
    lineHeight: 1.3,
  },
  tableWrap: {
    width: '100%',
  },
  footerPageColumn: {
    width: '32%',
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  footerPage: {
    color: NAVY,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
})

function getText(record, ...keys) {
  for (const key of keys) {
    const value = record?.[key]
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim()
    }
  }
  return ''
}

function getNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getDate(value) {
  if (!value) {
    return null
  }
  if (typeof value?.toDate === 'function') {
    value = value.toDate()
  } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    value = new Date(`${value}T12:00:00`)
  } else if (!(value instanceof Date)) {
    value = new Date(value)
  }
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null
}

function formatDate(value) {
  const date = getDate(value)
  return date
    ? new Intl.DateTimeFormat('fr-MA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date)
    : '—'
}

function normalizeTaxRate(value) {
  return getNumber(String(value ?? 0).replace('%', '').trim())
}

function getDiscountAmount(item, grossHT) {
  const rawDiscount =
    item.discountAmount ??
    item.remiseMontant ??
    item.discount ??
    item.remise
  if (rawDiscount === undefined || rawDiscount === null || rawDiscount === '') {
    return undefined
  }
  if (typeof rawDiscount === 'string' && rawDiscount.trim().endsWith('%')) {
    const percentage = getNumber(rawDiscount.trim().slice(0, -1))
    return Math.min(grossHT, Math.max(0, grossHT * (percentage / 100)))
  }
  return Math.min(grossHT, Math.max(0, getNumber(rawDiscount)))
}

function getItems(quote) {
  return (Array.isArray(quote?.items) ? quote.items : []).map((item) => {
    const quantity = getNumber(item.quantity ?? item.quantite)
    const unitPrice = getNumber(item.unitPrice ?? item.prixUnitaire ?? item.puHT)
    const grossHT = Math.max(0, quantity * unitPrice)
    const explicitDiscount = getDiscountAmount(item, grossHT)
    const defaultTotalHT = Math.max(0, grossHT - (explicitDiscount || 0))
    const taxRate = normalizeTaxRate(item.taxRate ?? item.tauxTVA ?? item.tva)
    const totalHT = getNumber(item.totalHT ?? item.totalHt, defaultTotalHT)
    const totalTVA = getNumber(
      item.totalTVA ?? item.totalTva,
      totalHT * (taxRate / 100),
    )

    return {
      designation: getText(item, 'designation', 'description') || '—',
      quantity,
      unitPrice,
      grossHT,
      discount: explicitDiscount ?? Math.max(0, grossHT - totalHT),
      totalHT,
      totalTVA,
      taxRate,
    }
  })
}

function getTotals(quote, items) {
  const computed = items.reduce(
    (totals, item) => ({
      totalHT: totals.totalHT + item.totalHT,
      grossHT: totals.grossHT + item.grossHT,
      totalTVA: totals.totalTVA + item.totalTVA,
    }),
    { totalHT: 0, grossHT: 0, totalTVA: 0 },
  )
  const totalHT = getNumber(quote.totalHT ?? quote.totaux?.totalHT, computed.totalHT)
  const totalTVA = getNumber(
    quote.totalTVA ?? quote.totaux?.totalTVA ?? quote.totaux?.totalTva,
    computed.totalTVA,
  )
  const totalTTC = getNumber(
    quote.totalTTC ?? quote.totaux?.totalTTC ?? quote.totaux?.totalTtc,
    totalHT + totalTVA,
  )
  return {
    totalHT,
    totalTVA,
    totalTTC,
    grossHT: computed.grossHT,
    discount: Math.max(0, computed.grossHT - totalHT),
  }
}

function getVatLabel(quote, items, totalHT, totalTVA) {
  const explicitRate = quote.tauxTVA ?? quote.taxRate
  if (explicitRate !== undefined && explicitRate !== null && explicitRate !== '') {
    return `TVA (${normalizeTaxRate(explicitRate)} %)`
  }

  const rates = [...new Set(items.map((item) => item.taxRate))]
  if (rates.length === 1) {
    return `TVA (${rates[0]} %)`
  }
  if (rates.length > 1 && totalHT > 0) {
    return `TVA (${new Intl.NumberFormat('fr-MA', {
      maximumFractionDigits: 2,
    }).format((totalTVA / totalHT) * 100)} %)`
  }
  return 'TVA'
}

function getLegalDetails(companyInfo) {
  const banking = [
    getText(companyInfo, 'banque', 'bank')
      ? `Banque : ${getText(companyInfo, 'banque', 'bank')}`
      : '',
    getText(companyInfo, 'rib') ? `RIB : ${getText(companyInfo, 'rib')}` : '',
    getText(companyInfo, 'capitalSocial', 'capital')
      ? `Capital social : ${getText(companyInfo, 'capitalSocial', 'capital')}`
      : '',
  ].filter(Boolean)
  const registrations = [
    getText(companyInfo, 'identifiantFiscal', 'if', 'taxId')
      ? `IF : ${getText(companyInfo, 'identifiantFiscal', 'if', 'taxId')}`
      : '',
    getText(companyInfo, 'cnss', 'numeroCNSS')
      ? `CNSS : ${getText(companyInfo, 'cnss', 'numeroCNSS')}`
      : '',
    getText(companyInfo, 'rc') ? `RC : ${getText(companyInfo, 'rc')}` : '',
    getText(companyInfo, 'ice') ? `ICE : ${getText(companyInfo, 'ice')}` : '',
    getText(companyInfo, 'patente') ? `Patente : ${getText(companyInfo, 'patente')}` : '',
  ].filter(Boolean)
  const legal = [
    getText(companyInfo, 'mentionsLegales', 'legalMentions'),
  ].filter(Boolean)

  if (banking.length === 0 && registrations.length === 0 && legal.length === 0) {
    banking.push('TGI Ascenseurs Casa')
    legal.push('Document généré par TGI Manager Pro')
  }

  return { banking, registrations, legal }
}

function getQuoteNumber(quote) {
  return getText(quote, 'number', 'numero', 'quoteNumber') || 'Sans numéro'
}

export default function QuotePdfDocument({ quote = {} }) {
  const companyInfo = quote.companyInfo || {}
  const clientInfo = quote.clientInfo || quote.client || {}
  const items = getItems(quote)
  const totals = getTotals(quote, items)
  const companyName = getText(companyInfo, 'name', 'nom') || 'TGI ASCENSEURS CASA'
  const clientName =
    getText(clientInfo, 'nom', 'name', 'raisonSociale') ||
    getText(quote, 'clientName') ||
    'Client non renseigné'
  const clientDetails = [
    getText(clientInfo, 'representant', 'représentant', 'representative', 'contactPerson')
      ? `Représentant : ${getText(clientInfo, 'representant', 'représentant', 'representative', 'contactPerson')}`
      : '',
    getText(clientInfo, 'ice', 'identifiantFiscal')
      ? `ICE : ${getText(clientInfo, 'ice', 'identifiantFiscal')}`
      : '',
    getText(clientInfo, 'telephone', 'téléphone', 'phone')
      ? `Téléphone : ${getText(clientInfo, 'telephone', 'téléphone', 'phone')}`
      : '',
    getText(clientInfo, 'adresse', 'address')
      ? `Adresse : ${getText(clientInfo, 'adresse', 'address')}`
      : '',
    getText(quote, 'delai', 'delaiLivraison', 'deliveryDelay')
      ? `Délai : ${getText(quote, 'delai', 'delaiLivraison', 'deliveryDelay')}`
      : '',
  ].filter(Boolean)
  const legalDetails = getLegalDetails(companyInfo)
  const issueDate = quote.dateEmission || quote.date
  const validityDate = quote.dateValidite || quote.validUntil || quote.validityDate
  const vatLabel = getVatLabel(quote, items, totals.totalHT, totals.totalTVA)
  const paymentTerms = getText(quote, 'conditionsPaiement', 'conditionsReglement', 'paymentTerms')
  const paymentMethod = getText(quote, 'paymentMethod', 'modeReglement')
  const specialConditions = getText(quote, 'conditionsParticulieres', 'specialConditions')

  return (
    <Document
      author={companyName}
      subject={`Devis ${getQuoteNumber(quote)}`}
      title={`Devis ${getQuoteNumber(quote)}`}
    >
      <Page size="A4" style={pdfPageStyles.page} wrap>
        <PdfDocumentHeader
          companyInfo={companyInfo}
          companyName={companyName}
          documentTitle={`Devis ${getQuoteNumber(quote)}`}
        />
        <PdfClientSummary
          clientName={clientName}
          clientDetails={clientDetails}
          metaRows={[
            { label: 'DATE', value: formatDate(issueDate) },
            { label: 'ÉCHÉANCE', value: formatDate(validityDate) },
            { label: 'STATUT', value: getText(quote, 'status', 'statut') || 'Brouillon' },
          ]}
        />
        <PdfFinancialDetails items={items} totals={totals} vatLabel={vatLabel} />

        <View style={styles.documentConditions}>
            <Text style={styles.conditionsHeading}>Conditions commerciales</Text>
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Conditions de règlement</Text>
              <Text style={styles.conditionValue}>{paymentTerms || 'Non renseignées'}</Text>
            </View>
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Mode de paiement</Text>
              <Text style={styles.conditionValue}>{paymentMethod || 'Non renseigné'}</Text>
            </View>
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Conditions particulières</Text>
              <Text style={styles.conditionValue}>{specialConditions || 'Aucune'}</Text>
            </View>
          </View>

          {(quote.reference || quote.notes) && (
            <View style={[styles.tableWrap, { marginTop: 12 }]}>
              {quote.reference && (
                <Text style={styles.note}>Référence : {String(quote.reference)}</Text>
              )}
              {quote.notes && <Text style={styles.note}>{String(quote.notes)}</Text>}
            </View>
          )}
        <PdfSignatures />
        <PdfDocumentFooter
          companyName={companyName}
          companyInfo={companyInfo}
          legalDetails={legalDetails}
        />
      </Page>
    </Document>
  )
}
