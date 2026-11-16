import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  PdfClientSummary,
  PdfDocumentFooter,
  PdfDocumentHeader,
  PdfSignatures,
} from './PdfDocumentChrome.jsx'
import PdfFinancialDetails from './PdfFinancialDetails.jsx'
import { pdfPageStyles } from './PdfDocumentStyles.js'

const NAVY = '#1E3A8A'
const BORDER = '#E2E8F0'
const MUTED = '#475569'
const PALE_BLUE = '#F8FAFC'
const PALE_GRAY = '#F3F4F6'

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
  sectionLabel: {
    marginBottom: 7,
    color: MUTED,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  clientName: {
    marginBottom: 4,
    color: '#111827',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  clientDetail: {
    marginTop: 2,
    color: '#1F2937',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  invoiceInfo: {
    width: '42%',
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  invoiceInfoRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  invoiceInfoLabel: {
    width: '43%',
    paddingRight: 6,
    color: MUTED,
    fontSize: 8,
  },
  invoiceInfoValue: {
    width: '57%',
    color: '#111827',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  tableWrap: {
    width: '100%',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
  },
  headerCell: {
    color: '#334155',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    paddingVertical: 7,
    paddingHorizontal: 5,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  alternateRow: {
    backgroundColor: PALE_BLUE,
  },
  cell: {
    color: '#1F2937',
    fontSize: 7.5,
  },
  emptyCell: {
    width: '100%',
    color: MUTED,
    fontSize: 10,
    textAlign: 'center',
  },
  closingSection: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    minHeight: 135,
    padding: 14,
    backgroundColor: PALE_GRAY,
    borderRadius: 4,
  },
  signatureTitle: {
    marginBottom: 7,
    color: '#111827',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  signatureHint: {
    color: MUTED,
    fontSize: 8,
    lineHeight: 1.35,
  },
  signatureLine: {
    height: 48,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#9CA3AF',
  },
  totals: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  totalRow: {
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: MUTED,
    fontSize: 9,
  },
  totalValue: {
    color: '#111827',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotal: {
    marginTop: 7,
    padding: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
    borderRadius: 4,
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
    textAlign: 'right',
  },
  balanceRow: {
    marginTop: 4,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  documentConditions: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
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
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  conditionLabel: {
    width: '30%',
    paddingRight: 8,
    color: MUTED,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  conditionValue: {
    flexGrow: 1,
    color: '#334155',
    fontSize: 9,
    lineHeight: 1.35,
  },
  notes: {
    marginTop: 12,
    color: MUTED,
    fontSize: 9,
    lineHeight: 1.4,
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

function getItems(invoice) {
  return (Array.isArray(invoice?.items) ? invoice.items : []).map((item) => {
    const quantity = getNumber(item.quantity ?? item.quantite)
    const unitPrice = getNumber(item.unitPrice ?? item.prixUnitaire ?? item.puHT)
    const grossHT = Math.max(0, quantity * unitPrice)
    const explicitDiscount = getDiscountAmount(item, grossHT)
    const defaultTotalHT = Math.max(0, grossHT - (explicitDiscount || 0))
    const taxRate = normalizeTaxRate(item.taxRate ?? item.tauxTVA ?? item.tva)
    const totalHT = getNumber(item.totalHT ?? item.totalHt, defaultTotalHT)

    return {
      designation: getText(item, 'designation', 'description') || '—',
      quantity,
      unitPrice,
      grossHT,
      discount: explicitDiscount ?? Math.max(0, grossHT - totalHT),
      totalHT,
      taxRate,
    }
  })
}

function getTotals(invoice, items) {
  const computed = items.reduce((totals, item, index) => {
    const storedItem = invoice.items?.[index]
    const totalTVA = getNumber(
      storedItem?.totalTVA ?? storedItem?.totalTva,
      item.totalHT * (item.taxRate / 100),
    )
    return {
      totalHT: totals.totalHT + item.totalHT,
      grossHT: totals.grossHT + item.grossHT,
      totalTVA: totals.totalTVA + totalTVA,
    }
  }, { totalHT: 0, grossHT: 0, totalTVA: 0 })
  const totalHT = getNumber(invoice.totalHT ?? invoice.totaux?.totalHT, computed.totalHT)
  const totalTVA = getNumber(
    invoice.totalTVA ?? invoice.totaux?.totalTVA ?? invoice.totaux?.totalTva,
    computed.totalTVA,
  )
  const totalTTC = getNumber(
    invoice.totalTTC ?? invoice.totaux?.totalTTC ?? invoice.totaux?.totalTtc,
    totalHT + totalTVA,
  )
  const amountPaid = Math.max(0, getNumber(invoice.amountPaid ?? invoice.montantPaye))

  return {
    totalHT,
    totalTVA,
    totalTTC,
    amountPaid,
    remaining: Math.max(0, totalTTC - amountPaid),
    grossHT: computed.grossHT,
    discount: Math.max(0, computed.grossHT - totalHT),
  }
}

function getVatLabel(invoice, items, totalHT, totalTVA) {
  const explicitRate = invoice.tauxTVA ?? invoice.taxRate
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

function getLegalDetails(companyInfo, invoice) {
  const banking = [
    getText(companyInfo, 'banque', 'bank')
      ? `Banque : ${getText(companyInfo, 'banque', 'bank')}`
      : '',
    getText(invoice, 'rib') || getText(companyInfo, 'rib')
      ? `RIB : ${getText(invoice, 'rib') || getText(companyInfo, 'rib')}`
      : '',
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

function getInvoiceNumber(invoice) {
  return getText(invoice, 'number', 'numero', 'invoiceNumber') || 'Sans numéro'
}

export default function InvoicePdfDocument({ invoice = {} }) {
  const companyInfo = invoice.companyInfo || {}
  const clientInfo = invoice.clientInfo || invoice.client || {}
  const items = getItems(invoice)
  const totals = getTotals(invoice, items)
  const companyName = getText(companyInfo, 'name', 'nom') || 'TGI ASCENSEURS CASA'
  const clientName =
    getText(clientInfo, 'nom', 'name', 'raisonSociale') ||
    getText(invoice, 'clientName') ||
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
    getText(invoice, 'delai', 'delaiLivraison', 'deliveryDelay')
      ? `Délai : ${getText(invoice, 'delai', 'delaiLivraison', 'deliveryDelay')}`
      : '',
  ].filter(Boolean)
  const legalDetails = getLegalDetails(companyInfo, invoice)
  const invoiceDate = invoice.dateFacture || invoice.dateEmission || invoice.date
  const dueDate = invoice.dateEcheance || invoice.dueDate
  const vatLabel = getVatLabel(invoice, items, totals.totalHT, totals.totalTVA)
  const paymentTerms = getText(
    invoice,
    'conditionsReglement',
    'conditionsPaiement',
    'paymentTerms',
  )
  const paymentMethod = getText(invoice, 'paymentMethod', 'modeReglement')
  const specialConditions = getText(invoice, 'conditionsParticulieres', 'specialConditions')

  return (
    <Document
      author={companyName}
      subject={`Facture ${getInvoiceNumber(invoice)}`}
      title={`Facture ${getInvoiceNumber(invoice)}`}
    >
      <Page size="A4" style={pdfPageStyles.page} wrap>
        <PdfDocumentHeader
          companyInfo={companyInfo}
          companyName={companyName}
          documentTitle={`Facture ${getInvoiceNumber(invoice)}`}
        />
        <PdfClientSummary
          clientName={clientName}
          clientDetails={clientDetails}
          metaRows={[
            { label: 'DATE', value: formatDate(invoiceDate) },
            { label: 'ÉCHÉANCE', value: formatDate(dueDate) },
            {
              label: 'STATUT',
              value: getText(invoice, 'status', 'statut', 'workflowStatus') || 'Brouillon',
            },
          ]}
        />
        <PdfFinancialDetails
          items={items}
          totals={totals}
          vatLabel={vatLabel}
          includePaymentBalance
        />

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

        {(invoice.referenceDevis || invoice.notes) && (
          <View style={[styles.tableWrap, styles.notes]}>
            {invoice.referenceDevis && (
              <Text style={styles.legalText}>
                Référence du devis : {String(invoice.referenceDevis)}
              </Text>
            )}
            {invoice.notes && <Text style={styles.legalText}>{String(invoice.notes)}</Text>}
          </View>
        )}
        <PdfSignatures
          clientHint="Nom, date, signature et cachet du client"
          companyHint="Signature et cachet"
        />
        <PdfDocumentFooter
          companyName={companyName}
          companyInfo={companyInfo}
          legalDetails={legalDetails}
        />
      </Page>
    </Document>
  )
}
