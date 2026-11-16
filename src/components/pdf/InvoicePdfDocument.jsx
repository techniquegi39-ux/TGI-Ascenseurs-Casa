import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const NAVY = '#17365D'
const STEEL_BLUE = '#4682B4'
const BORDER = '#D5DEE8'
const MUTED = '#64748B'
const PALE_BLUE = '#EEF4F9'

const styles = StyleSheet.create({
  page: {
    paddingTop: 164,
    paddingRight: 38,
    paddingBottom: 92,
    paddingLeft: 38,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  header: {
    position: 'absolute',
    top: 24,
    right: 38,
    left: 38,
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: STEEL_BLUE,
  },
  logo: {
    width: 76,
    height: 60,
    objectFit: 'contain',
  },
  companyBlock: {
    flexGrow: 1,
    alignItems: 'flex-end',
    marginLeft: 18,
  },
  companyName: {
    marginBottom: 3,
    color: NAVY,
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
  },
  companyDetail: {
    marginTop: 2,
    color: MUTED,
    fontSize: 8,
    textAlign: 'right',
  },
  titleBlock: {
    position: 'absolute',
    top: 104,
    right: 38,
    left: 38,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: {
    color: NAVY,
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  invoiceDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  dateText: {
    color: MUTED,
    fontSize: 8,
  },
  sectionLabel: {
    marginBottom: 6,
    color: NAVY,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientInfo: {
    marginBottom: 14,
    padding: 11,
    backgroundColor: PALE_BLUE,
    borderLeftWidth: 3,
    borderLeftColor: STEEL_BLUE,
    borderRadius: 3,
  },
  clientName: {
    marginBottom: 5,
    color: NAVY,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  clientDetail: {
    marginTop: 2,
    color: '#475569',
    fontSize: 8,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
  },
  headerCell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  alternateRow: {
    backgroundColor: '#F8FAFC',
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    color: '#334155',
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  emptyCell: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 8,
    color: MUTED,
    fontSize: 9,
    textAlign: 'center',
  },
  afterTable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 13,
  },
  paymentNotes: {
    flexGrow: 1,
    marginRight: 16,
    paddingTop: 4,
  },
  note: {
    marginTop: 4,
    color: '#475569',
    fontSize: 8,
    lineHeight: 1.4,
  },
  documentConditions: {
    marginTop: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 3,
    borderLeftColor: STEEL_BLUE,
    borderRadius: 3,
    backgroundColor: '#F8FAFC',
  },
  conditionsHeading: {
    marginBottom: 5,
    color: NAVY,
    fontSize: 8,
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
    width: '29%',
    paddingRight: 8,
    color: MUTED,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  conditionValue: {
    flexGrow: 1,
    color: '#334155',
    fontSize: 8,
    lineHeight: 1.35,
  },
  totals: {
    width: 220,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    color: '#475569',
    fontSize: 8,
  },
  totalValue: {
    color: '#1E293B',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotal: {
    marginTop: 4,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  grandTotalLabel: {
    color: NAVY,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalValue: {
    color: NAVY,
    fontSize: 10,
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
    right: 38,
    bottom: 20,
    left: 38,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  footerDetails: {
    maxWidth: '80%',
  },
  legalText: {
    color: MUTED,
    fontSize: 7,
    lineHeight: 1.35,
  },
  pageNumber: {
    color: NAVY,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
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
  const details = [
    getText(companyInfo, 'banque', 'bank')
      ? `Banque : ${getText(companyInfo, 'banque', 'bank')}`
      : '',
    getText(invoice, 'rib') || getText(companyInfo, 'rib')
      ? `RIB : ${getText(invoice, 'rib') || getText(companyInfo, 'rib')}`
      : '',
    getText(companyInfo, 'capitalSocial', 'capital')
      ? `Capital social : ${getText(companyInfo, 'capitalSocial', 'capital')}`
      : '',
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

  return details.length
    ? details.join('  ·  ')
    : 'TGI Ascenseurs Casa · Document généré par TGI Manager Pro'
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
          <Image
            src={companyInfo.companyLogoBase64 || '/logo.png.jpeg'}
            style={styles.logo}
          />
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{companyName}</Text>
            {companyDetails.map((detail) => (
              <Text key={detail} style={styles.companyDetail}>
                {detail}
              </Text>
            ))}
          </View>
        </View>

        <View fixed style={styles.titleBlock}>
          <Text style={styles.title}>FACTURE N° {getInvoiceNumber(invoice)}</Text>
          <View style={styles.invoiceDates}>
            <Text style={styles.dateText}>
              Date de facturation : {formatDate(invoiceDate)}
            </Text>
            <Text style={styles.dateText}>
              Date d’échéance : {formatDate(dueDate)}
            </Text>
          </View>
        </View>

        <View style={styles.clientInfo} wrap={false}>
          <Text style={styles.sectionLabel}>Facturé à</Text>
          <Text style={styles.clientName}>{clientName}</Text>
          {clientDetails.map((detail) => (
            <Text key={detail} style={styles.clientDetail}>
              {detail}
            </Text>
          ))}
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
                    styles.lastCell,
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
            <Text style={styles.legalText}>{getLegalDetails(companyInfo, invoice)}</Text>
            <Text style={styles.legalText}>
              Merci de votre confiance. Pour toute question relative à cette facture, veuillez
              contacter TGI Ascenseurs Casa.
            </Text>
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
