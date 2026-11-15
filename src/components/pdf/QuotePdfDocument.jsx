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
  quoteDates: {
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
  quoteNotes: {
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
  signatureBox: {
    width: 220,
    height: 82,
    padding: 9,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: 'dashed',
    borderRadius: 3,
  },
  signatureTitle: {
    marginBottom: 5,
    color: NAVY,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  signatureHint: {
    color: MUTED,
    fontSize: 7,
    textAlign: 'center',
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

function getItems(quote) {
  return (Array.isArray(quote?.items) ? quote.items : []).map((item) => {
    const quantity = getNumber(item.quantity ?? item.quantite)
    const unitPrice = getNumber(item.unitPrice ?? item.prixUnitaire ?? item.puHT)
    const taxRate = normalizeTaxRate(item.taxRate ?? item.tauxTVA ?? item.tva)
    const totalHT = getNumber(item.totalHT ?? item.totalHt, quantity * unitPrice)
    const totalTVA = getNumber(
      item.totalTVA ?? item.totalTva,
      totalHT * (taxRate / 100),
    )

    return {
      designation: getText(item, 'designation', 'description') || '—',
      quantity,
      unitPrice,
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
      totalTVA: totals.totalTVA + item.totalTVA,
    }),
    { totalHT: 0, totalTVA: 0 },
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
  return { totalHT, totalTVA, totalTTC }
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

function getCompanyDetails(companyInfo) {
  return [
    getText(companyInfo, 'address', 'adresse'),
    getText(companyInfo, 'rc') ? `RC : ${getText(companyInfo, 'rc')}` : '',
    getText(companyInfo, 'ice') ? `ICE : ${getText(companyInfo, 'ice')}` : '',
    getText(companyInfo, 'phone', 'telephone', 'téléphone'),
    getText(companyInfo, 'email'),
  ].filter(Boolean)
}

function getLegalDetails(companyInfo) {
  const details = [
    getText(companyInfo, 'rib') ? `RIB : ${getText(companyInfo, 'rib')}` : '',
    getText(companyInfo, 'capital') ? `Capital : ${getText(companyInfo, 'capital')}` : '',
    getText(companyInfo, 'patente') ? `Patente : ${getText(companyInfo, 'patente')}` : '',
    getText(companyInfo, 'mentionsLegales', 'legalMentions'),
  ].filter(Boolean)

  return details.length
    ? details.join('  ·  ')
    : 'TGI Ascenseurs Casa · Document généré par TGI Manager Pro'
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
    getText(clientInfo, 'ice', 'identifiantFiscal')
      ? `ICE : ${getText(clientInfo, 'ice', 'identifiantFiscal')}`
      : '',
    getText(clientInfo, 'telephone', 'téléphone', 'phone')
      ? `Téléphone : ${getText(clientInfo, 'telephone', 'téléphone', 'phone')}`
      : '',
    getText(clientInfo, 'adresse', 'address'),
  ].filter(Boolean)
  const companyDetails = getCompanyDetails(companyInfo)
  const issueDate = quote.dateEmission || quote.date
  const validityDate = quote.dateValidite || quote.validUntil || quote.validityDate
  const vatLabel = getVatLabel(quote, items, totals.totalHT, totals.totalTVA)

  return (
    <Document
      author={companyName}
      subject={`Devis ${getQuoteNumber(quote)}`}
      title={`Devis ${getQuoteNumber(quote)}`}
    >
      <Page size="A4" style={styles.page} wrap>
        <View fixed style={styles.header}>
          <Image src="/logo.png.jpeg" style={styles.logo} />
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
          <Text style={styles.title}>DEVIS N° {getQuoteNumber(quote)}</Text>
          <View style={styles.quoteDates}>
            <Text style={styles.dateText}>Date d’émission : {formatDate(issueDate)}</Text>
            <Text style={styles.dateText}>
              Date de validité : {formatDate(validityDate)}
            </Text>
          </View>
        </View>

        <View style={styles.clientInfo} wrap={false}>
          <Text style={styles.sectionLabel}>Proposé à</Text>
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
          <View style={styles.quoteNotes}>
            {quote.reference && (
              <Text style={styles.note}>Référence : {String(quote.reference)}</Text>
            )}
            {(quote.conditionsPaiement || quote.paymentTerms) && (
              <Text style={styles.note}>
                Conditions de paiement : {String(quote.conditionsPaiement || quote.paymentTerms)}
              </Text>
            )}
            {quote.notes && <Text style={styles.note}>{String(quote.notes)}</Text>}
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
          </View>
        </View>

        <View style={styles.signatureArea} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Bon pour accord</Text>
            <Text style={styles.signatureHint}>
              Nom, date, signature et cachet du client
            </Text>
          </View>
        </View>

        <View fixed style={styles.footer}>
          <View style={styles.footerDetails}>
            <Text style={styles.legalText}>{getLegalDetails(companyInfo)}</Text>
            <Text style={styles.legalText}>
              Ce devis est valable jusqu’à la date indiquée ci-dessus, sous réserve de
              disponibilité des équipements.
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
