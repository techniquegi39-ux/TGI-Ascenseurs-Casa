import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const NAVY = '#1E3A8A'
const BORDER = '#E2E8F0'
const MUTED = '#475569'
const PALE_BLUE = '#F8FAFC'

const styles = StyleSheet.create({
  page: {
    paddingTop: 226,
    paddingRight: 42,
    paddingBottom: 92,
    paddingLeft: 42,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    position: 'absolute',
    top: 22,
    right: 42,
    left: 42,
    height: 132,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  logo: {
    width: 86,
    height: 60,
    objectFit: 'contain',
  },
  companyBlock: {
    width: '48%',
  },
  companyName: {
    marginTop: 5,
    marginBottom: 2,
    color: NAVY,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  companyDetail: {
    marginTop: 1.5,
    color: MUTED,
    fontSize: 8,
  },
  clientInfo: {
    width: '48%',
    padding: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  sectionLabel: {
    marginBottom: 5,
    color: MUTED,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  clientName: {
    marginBottom: 3,
    color: NAVY,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  clientDetail: {
    marginTop: 1.5,
    color: MUTED,
    fontSize: 8,
  },
  titleBlock: {
    position: 'absolute',
    top: 174,
    right: 42,
    left: 42,
  },
  titleBanner: {
    minHeight: 42,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
    borderRadius: 2,
  },
  title: {
    flexGrow: 1,
    paddingRight: 8,
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
  invoiceDates: {
    alignItems: 'flex-end',
  },
  dateText: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 8,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
  },
  headerCell: {
    paddingVertical: 6,
    paddingHorizontal: 7,
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.6,
    borderBottomColor: BORDER,
  },
  alternateRow: {
    backgroundColor: PALE_BLUE,
  },
  cell: {
    paddingVertical: 7,
    paddingHorizontal: 7,
    color: '#334155',
    fontSize: 10,
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
    marginTop: 14,
  },
  paymentNotes: {
    width: '50%',
    paddingRight: 12,
    paddingTop: 4,
  },
  note: {
    marginTop: 4,
    color: MUTED,
    fontSize: 9,
    lineHeight: 1.4,
  },
  documentConditions: {
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    backgroundColor: PALE_BLUE,
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
    width: '32%',
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
  totals: {
    width: '50%',
    alignItems: 'stretch',
    paddingLeft: 8,
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
    color: '#1E293B',
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
  signatureArea: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  stampBox: {
    width: 190,
    height: 68,
    padding: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: 'dashed',
    borderRadius: 3,
  },
  stampLabel: {
    color: MUTED,
    fontSize: 7,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footer: {
    position: 'absolute',
    right: 42,
    bottom: 20,
    left: 42,
    paddingTop: 7,
    borderTopWidth: 2,
    borderTopColor: NAVY,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  footerDetails: {
    flexDirection: 'row',
    flexGrow: 1,
    paddingRight: 12,
  },
  footerColumn: {
    width: '50%',
    paddingRight: 8,
  },
  legalText: {
    color: MUTED,
    fontSize: 8,
    lineHeight: 1.3,
    marginTop: 1,
  },
  pageNumber: {
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
  const legal = [
    getText(companyInfo, 'identifiantFiscal', 'if', 'taxId')
      ? `IF : ${getText(companyInfo, 'identifiantFiscal', 'if', 'taxId')}`
      : '',
    getText(companyInfo, 'cnss', 'numeroCNSS')
      ? `CNSS : ${getText(companyInfo, 'cnss', 'numeroCNSS')}`
      : '',
    getText(companyInfo, 'rc') ? `RC : ${getText(companyInfo, 'rc')}` : '',
    getText(companyInfo, 'ice') ? `ICE : ${getText(companyInfo, 'ice')}` : '',
    getText(companyInfo, 'patente') ? `Patente : ${getText(companyInfo, 'patente')}` : '',
    getText(companyInfo, 'mentionsLegales', 'legalMentions'),
  ].filter(Boolean)

  if (banking.length === 0 && legal.length === 0) {
    banking.push('TGI Ascenseurs Casa')
    legal.push('Document généré par TGI Manager Pro')
  }

  return { banking, legal }
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
          <View style={styles.companyBlock}>
            <Image
              src={companyInfo.companyLogoBase64 || '/logo.png.jpeg'}
              style={styles.logo}
            />
            <Text style={styles.companyName}>{companyName}</Text>
            {companyDetails.map((detail) => (
              <Text key={detail} style={styles.companyDetail}>
                {detail}
              </Text>
            ))}
          </View>
          <View style={styles.clientInfo} wrap={false}>
            <Text style={styles.sectionLabel}>Facturé à :</Text>
            <Text style={styles.clientName}>{clientName}</Text>
            {clientDetails.map((detail) => (
              <Text key={detail} style={styles.clientDetail}>
                {detail}
              </Text>
            ))}
          </View>
        </View>

        <View fixed style={styles.titleBlock}>
          <View style={styles.titleBanner}>
            <Text style={styles.title}>FACTURE N° {getInvoiceNumber(invoice)}</Text>
            <View style={styles.invoiceDates}>
              <Text style={styles.dateText}>— {formatDate(invoiceDate)}</Text>
              <Text style={styles.dateText}>Échéance : {formatDate(dueDate)}</Text>
            </View>
          </View>
        </View>

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
                <Text
                  style={[
                    styles.cell,
                    { width: '23%', textAlign: 'right' },
                  ]}
                >
                  {formatCurrency(item.totalHT)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.afterTable}>
          <View style={styles.paymentNotes}>
            {invoice.referenceDevis && (
              <Text style={styles.note}>
                Référence du devis : {String(invoice.referenceDevis)}
              </Text>
            )}
            {invoice.notes && <Text style={styles.note}>{String(invoice.notes)}</Text>}
          </View>

          <View style={styles.totals} wrap={false}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{formatCurrency(totals.totalHT)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{vatLabel}</Text>
              <Text style={styles.totalValue}>{formatCurrency(totals.totalTVA)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Total TTC</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(totals.totalTTC)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Montant payé</Text>
              <Text style={styles.totalValue}>{formatCurrency(totals.amountPaid)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Reste à payer</Text>
              <Text style={styles.totalValue}>{formatCurrency(totals.remaining)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.signatureArea} wrap={false}>
          <View style={styles.stampBox}>
            <Text style={styles.stampLabel}>Cachet et signature</Text>
          </View>
        </View>

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

        <View fixed style={styles.footer}>
          <View style={styles.footerDetails}>
            <View style={styles.footerColumn}>
              {legalDetails.banking.map((detail) => (
                <Text key={detail} style={styles.legalText}>
                  {detail}
                </Text>
              ))}
            </View>
            <View style={styles.footerColumn}>
              {legalDetails.legal.map((detail) => (
                <Text key={detail} style={styles.legalText}>
                  {detail}
                </Text>
              ))}
              <Text style={styles.legalText}>
                Merci de votre confiance. Pour toute question relative à cette facture, veuillez
                contacter TGI Ascenseurs Casa.
              </Text>
            </View>
          </View>
          <Text
            fixed
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
            style={styles.pageNumber}
          />
        </View>
      </Page>
    </Document>
  )
}
