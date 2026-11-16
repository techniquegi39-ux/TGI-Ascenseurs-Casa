import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

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
    padding: 10,
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  headerCell: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    padding: 10,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  alternateRow: {
    backgroundColor: PALE_BLUE,
  },
  cell: {
    color: '#1F2937',
    fontSize: 10,
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

function formatCurrency(value) {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(getNumber(value))} MAD`
}

function formatQuantity(value) {
  return new Intl.NumberFormat('fr-MA', {
    maximumFractionDigits: 3,
  }).format(getNumber(value))
}

function normalizeTaxRate(value) {
  return getNumber(String(value ?? 0).replace('%', '').trim())
}

function getItems(invoice) {
  return (Array.isArray(invoice?.items) ? invoice.items : []).map((item) => {
    const quantity = getNumber(item.quantity ?? item.quantite)
    const unitPrice = getNumber(item.unitPrice ?? item.prixUnitaire ?? item.puHT)
    const taxRate = normalizeTaxRate(item.taxRate ?? item.tauxTVA ?? item.tva)
    const totalHT = getNumber(item.totalHT ?? item.totalHt, quantity * unitPrice)

    return {
      designation: getText(item, 'designation', 'description') || '—',
      quantity,
      unitPrice,
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
      totalTVA: totals.totalTVA + totalTVA,
    }
  }, { totalHT: 0, totalTVA: 0 })
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

function getCompanyDetails(companyInfo) {
  return [
    getText(companyInfo, 'address', 'adresse'),
    getText(companyInfo, 'rc') ? `RC : ${getText(companyInfo, 'rc')}` : '',
    getText(companyInfo, 'ice') ? `ICE : ${getText(companyInfo, 'ice')}` : '',
    getText(companyInfo, 'phone', 'telephone', 'téléphone'),
    getText(companyInfo, 'email'),
  ].filter(Boolean)
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
    getText(clientInfo, 'ice', 'identifiantFiscal')
      ? `ICE : ${getText(clientInfo, 'ice', 'identifiantFiscal')}`
      : '',
    getText(clientInfo, 'telephone', 'téléphone', 'phone')
      ? `Téléphone : ${getText(clientInfo, 'telephone', 'téléphone', 'phone')}`
      : '',
    getText(clientInfo, 'adresse', 'address'),
  ].filter(Boolean)
  const companyDetails = getCompanyDetails(companyInfo)
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
      <Page size="A4" style={styles.page} wrap>
        <View fixed style={styles.header}>
          <View style={styles.headerIdentity}>
            <View style={styles.logoFrame}>
              <Image
                src={companyInfo.companyLogoBase64 || '/logo.png.jpeg'}
                style={styles.logo}
              />
            </View>
            <Text style={styles.documentTitle}>FACTURE</Text>
          </View>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{companyName}</Text>
            {companyDetails.map((detail) => (
              <Text key={detail} style={styles.companyDetail}>
                {detail}
              </Text>
            ))}
          </View>
        </View>

        <View>
          <View style={styles.clientDetails}>
            <View style={styles.clientBlock}>
              <Text style={styles.sectionLabel}>Facturé à :</Text>
              <Text style={styles.clientName}>{clientName}</Text>
              {clientDetails.map((detail) => (
                <Text key={detail} style={styles.clientDetail}>
                  {detail}
                </Text>
              ))}
            </View>
            <View style={styles.invoiceInfo}>
              <View style={styles.invoiceInfoRow}>
                <Text style={styles.invoiceInfoLabel}>Date de la facture</Text>
                <Text style={styles.invoiceInfoValue}>{formatDate(invoiceDate)}</Text>
              </View>
              <View style={styles.invoiceInfoRow}>
                <Text style={styles.invoiceInfoLabel}>N° de facture</Text>
                <Text style={styles.invoiceInfoValue}>{getInvoiceNumber(invoice)}</Text>
              </View>
              <View style={styles.invoiceInfoRow}>
                <Text style={styles.invoiceInfoLabel}>Date d’échéance</Text>
                <Text style={styles.invoiceInfoValue}>{formatDate(dueDate)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tableWrap}>
            <View style={styles.table}>
              <View fixed style={styles.tableHeader}>
                <Text style={[styles.headerCell, { width: '43%' }]}>Désignation</Text>
                <Text style={[styles.headerCell, { width: '12%', textAlign: 'right' }]}>
                  Qté
                </Text>
                <Text style={[styles.headerCell, { width: '22%', textAlign: 'right' }]}>
                  Prix unitaire HT
                </Text>
                <Text style={[styles.headerCell, { width: '23%', textAlign: 'right' }]}>
                  Total HT
                </Text>
              </View>
              {items.length === 0 ? (
                <View style={styles.tableRow} wrap={false}>
                  <Text style={styles.emptyCell}>Aucun article renseigné.</Text>
                </View>
              ) : (
                items.map((item, index) => (
                  <View
                    key={`${item.designation}-${index}`}
                    style={[
                      styles.tableRow,
                      index % 2 === 1 ? styles.alternateRow : null,
                    ]}
                    wrap={false}
                  >
                    <Text style={[styles.cell, { width: '43%' }]}>{item.designation}</Text>
                    <Text style={[styles.cell, { width: '12%', textAlign: 'right' }]}>
                      {formatQuantity(item.quantity)}
                    </Text>
                    <Text style={[styles.cell, { width: '22%', textAlign: 'right' }]}>
                      {formatCurrency(item.unitPrice)}
                    </Text>
                    <Text style={[styles.cell, { width: '23%', textAlign: 'right' }]}>
                      {formatCurrency(item.totalHT)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={[styles.tableWrap, styles.closingSection]}>
            <View style={styles.signatureBox} wrap={false}>
              <Text style={styles.signatureTitle}>Bon pour accord et signature</Text>
              <Text style={styles.signatureHint}>
                Nom, date, signature et cachet du client
              </Text>
              <View style={styles.signatureLine} />
            </View>

            <View style={styles.totals} wrap={false}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sous-total HT</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.totalHT)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{vatLabel}</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.totalTVA)}</Text>
              </View>
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>TOTAL TTC</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(totals.totalTTC)}</Text>
              </View>
              <View style={[styles.totalRow, styles.balanceRow]}>
                <Text style={styles.totalLabel}>Montant payé</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.amountPaid)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Reste à payer</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.remaining)}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.tableWrap, styles.documentConditions]}>
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
        </View>

        <View fixed style={styles.footer}>
          <View style={styles.footerColumn}>
            {legalDetails.banking.map((detail) => (
              <Text key={detail} style={styles.legalText}>
                {detail}
              </Text>
            ))}
          </View>
          <View style={styles.footerColumn}>
            {legalDetails.registrations.map((detail) => (
              <Text key={detail} style={styles.legalText}>
                {detail}
              </Text>
            ))}
          </View>
          <View style={[styles.footerColumn, { alignItems: 'flex-end' }]}>
            {legalDetails.legal.map((detail) => (
              <Text key={detail} style={styles.legalText}>
                {detail}
              </Text>
            ))}
            <Text
              fixed
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
              style={styles.footerPage}
            />
          </View>
        </View>
      </Page>
    </Document>
  )
}
