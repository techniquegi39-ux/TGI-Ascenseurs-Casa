import { StyleSheet, Text, View } from '@react-pdf/renderer'

const BORDER = '#E2E8F0'
const MUTED = '#475569'
const NAVY = '#1E3A8A'

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    color: '#0F172A',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
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
  tableCell: {
    paddingRight: 4,
    color: '#1E293B',
    fontSize: 7.5,
  },
  emptyRow: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  emptyText: {
    color: MUTED,
    fontSize: 8,
    textAlign: 'center',
  },
  totalsHeading: {
    marginBottom: 7,
    color: '#0F172A',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  totalsWrap: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  totals: {
    width: '52%',
    padding: 10,
    backgroundColor: '#F8FAFC',
  },
  totalRow: {
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: MUTED,
    fontSize: 8,
  },
  totalValue: {
    color: '#0F172A',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  grandTotal: {
    marginTop: 5,
    paddingVertical: 8,
    paddingHorizontal: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
  },
  grandTotalLabel: {
    color: NAVY,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalValue: {
    color: NAVY,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
})

function formatAmount(value) {
  const amount = Number(value)
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function formatCurrency(value) {
  return `${formatAmount(value)} MAD`
}

function formatQuantity(value) {
  const quantity = Number(value)
  return new Intl.NumberFormat('fr-MA', {
    maximumFractionDigits: 3,
  }).format(Number.isFinite(quantity) ? quantity : 0)
}

const COLUMNS = [
  { label: '#', width: '4%', align: 'left' },
  { label: 'Désignation', width: '31%', align: 'left' },
  { label: 'Qté', width: '8%', align: 'right' },
  { label: 'P.U. HT (DH)', width: '17%', align: 'right' },
  { label: 'Remise', width: '14%', align: 'right' },
  { label: 'Total HT (DH)', width: '26%', align: 'right' },
]

export default function PdfFinancialDetails({
  items = [],
  totals,
  vatLabel = 'TVA',
  includePaymentBalance = false,
}) {
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DÉTAIL DES ARTICLES ET PRESTATIONS</Text>
        <View style={styles.table}>
          <View fixed style={styles.tableHeader}>
            {COLUMNS.map((column) => (
              <Text
                key={column.label}
                style={[
                  styles.headerCell,
                  { width: column.width, textAlign: column.align },
                ]}
              >
                {column.label}
              </Text>
            ))}
          </View>
          {items.length === 0 ? (
            <View style={styles.emptyRow} wrap={false}>
              <Text style={styles.emptyText}>Aucun article renseigné.</Text>
            </View>
          ) : (
            items.map((item, index) => (
              <View
                key={`${item.designation}-${index}`}
                style={styles.tableRow}
                wrap={false}
              >
                <Text style={[styles.tableCell, { width: '4%' }]}>{index + 1}</Text>
                <Text style={[styles.tableCell, { width: '31%' }]}>{item.designation}</Text>
                <Text style={[styles.tableCell, { width: '8%', textAlign: 'right' }]}>
                  {formatQuantity(item.quantity)}
                </Text>
                <Text style={[styles.tableCell, { width: '17%', textAlign: 'right' }]}>
                  {formatAmount(item.unitPrice)}
                </Text>
                <Text style={[styles.tableCell, { width: '14%', textAlign: 'right' }]}>
                  {formatAmount(item.discount)}
                </Text>
                <Text style={[styles.tableCell, { width: '26%', textAlign: 'right' }]}>
                  {formatAmount(item.totalHT)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.totalsWrap}>
        <Text style={styles.totalsHeading}>RÉCAPITULATIF FINANCIER</Text>
        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total brut HT</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.grossHT)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Remise</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.discount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Net HT</Text>
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
          {includePaymentBalance && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Montant payé</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.amountPaid)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Reste à payer</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.remaining)}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </>
  )
}
