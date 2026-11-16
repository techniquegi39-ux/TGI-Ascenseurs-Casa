import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { pdfColors } from './PdfDocumentStyles.js'

const { primary, secondary, accent, tableRule, tableHeader, tableHeaderBorder } =
  pdfColors

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    color: primary,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    paddingVertical: 9,
    paddingHorizontal: 8,
    flexDirection: 'row',
    backgroundColor: tableHeader,
    borderTopWidth: 1,
    borderTopColor: tableHeaderBorder,
    borderBottomWidth: 1,
    borderBottomColor: tableHeaderBorder,
  },
  headerCell: {
    color: '#475569',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: tableRule,
  },
  tableCell: {
    paddingRight: 4,
    color: primary,
    fontSize: 8,
  },
  emptyRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: tableRule,
  },
  emptyText: {
    color: secondary,
    fontSize: 8,
    textAlign: 'center',
  },
  totalsHeading: {
    marginBottom: 7,
    color: secondary,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  totalsWrap: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  totals: {
    width: '45%',
  },
  totalRow: {
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: secondary,
    fontSize: 8,
  },
  totalValue: {
    color: primary,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  grandTotal: {
    marginTop: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tableHeader,
    borderLeftWidth: 3,
    borderLeftColor: accent,
  },
  grandTotalLabel: {
    color: primary,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.7,
  },
  grandTotalValue: {
    color: accent,
    fontSize: 12,
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
