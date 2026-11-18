import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  PdfClientSummary,
  PdfDocumentFooter,
  PdfDocumentHeader,
} from './PdfDocumentChrome.jsx'
import { pdfPageStyles } from './PdfDocumentStyles.js'

const TGI_NAVY = '#0A2540'
const TGI_BLUE = '#0A2540'
const BORDER = '#E2E8F0'
const MUTED = '#64748B'

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 22,
    right: 30,
    left: 30,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: TGI_BLUE,
  },
  logo: {
    width: 68,
    height: 68,
    objectFit: 'contain',
  },
  companyBlock: {
    flexGrow: 1,
    alignItems: 'flex-end',
    marginLeft: 18,
  },
  companyName: {
    color: TGI_NAVY,
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
  },
  companyDetail: {
    marginTop: 3,
    color: MUTED,
    fontSize: 8,
    textAlign: 'right',
  },
  titleBlock: {
    position: 'absolute',
    top: 105,
    right: 30,
    left: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: {
    maxWidth: '75%',
    color: TGI_NAVY,
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  date: {
    color: MUTED,
    fontSize: 9,
    textAlign: 'right',
  },
  clientInfo: {
    marginBottom: 12,
    padding: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
  },
  clientName: {
    marginBottom: 3,
    color: TGI_NAVY,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  clientDetail: {
    marginTop: 2,
    color: '#475569',
    fontSize: 8,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: TGI_NAVY,
    borderTopWidth: 1,
    borderTopColor: TGI_NAVY,
    borderBottomWidth: 1,
    borderBottomColor: TGI_NAVY,
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  alternateRow: {
    backgroundColor: '#F1F5F9',
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#0F172A',
    fontSize: 8,
  },
  tableSectionTitle: {
    marginBottom: 8,
    color: '#0F172A',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  emptyCell: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: MUTED,
    fontSize: 9,
    textAlign: 'center',
  },
  totals: {
    width: 235,
    alignSelf: 'flex-end',
    marginTop: 14,
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
    fontSize: 9,
  },
  totalValue: {
    color: '#0F172A',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotal: {
    marginTop: 5,
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: TGI_NAVY,
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderLeftWidth: 4,
  },
  grandTotalLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalValue: {
    color: '#F59E0B',
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
  },
  notes: {
    marginTop: 12,
    color: '#475569',
    fontSize: 8,
    lineHeight: 1.35,
  },
  footer: {
    position: 'absolute',
    right: 30,
    bottom: 18,
    left: 30,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  legalText: {
    maxWidth: '78%',
    color: MUTED,
    fontSize: 7,
    lineHeight: 1.3,
  },
  pageNumber: {
    color: TGI_NAVY,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
})

function getCompanyValue(companyInfo, ...keys) {
  for (const key of keys) {
    const value = companyInfo?.[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function formatValue(value) {
  if (value === undefined || value === null || value === '') {
    return '—'
  }
  if (typeof value?.toDate === 'function') {
    value = value.toDate()
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? '—'
      : new Intl.DateTimeFormat('fr-MA').format(value)
  }
  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non'
  }
  return String(value)
}

function getColumnHeader(column, index) {
  if (typeof column === 'string') {
    return column
  }
  return String(column?.header || column?.label || column?.title || column?.key || `Colonne ${index + 1}`)
}

function getColumnWidth(column, columnCount) {
  if (typeof column?.width === 'number' && Number.isFinite(column.width)) {
    return `${column.width <= 1 ? column.width * 100 : column.width}%`
  }
  if (typeof column?.width === 'string' && column.width.trim()) {
    return column.width
  }
  return `${100 / columnCount}%`
}

function getCellValue(row, column, index) {
  if (Array.isArray(row)) {
    return formatValue(row[index])
  }
  if (typeof column === 'string') {
    return formatValue(row?.[column])
  }
  if (typeof column?.render === 'function') {
    return formatValue(column.render(row, index))
  }
  const accessor = column?.accessor ?? column?.key ?? column?.dataKey ?? column?.label
  if (typeof accessor === 'function') {
    return formatValue(accessor(row, index))
  }
  if (typeof accessor === 'string') {
    return formatValue(
      accessor.split('.').reduce((value, key) => value?.[key], row),
    )
  }
  return '—'
}

function getTotal(totals, ...keys) {
  for (const key of keys) {
    const value = totals?.[key]
    if (value !== undefined && value !== null && value !== '') {
      const number = Number(value)
      if (Number.isFinite(number)) {
        return number
      }
    }
  }
  return undefined
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MAD`
}

function formatDocumentDate(value) {
  let date = value || new Date()
  if (typeof date?.toDate === 'function') {
    date = date.toDate()
  } else if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = new Date(`${date}T12:00:00`)
  } else if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('fr-MA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date)
}

function getClientDetails(clientInfo = {}) {
  return [
    getCompanyValue(clientInfo, 'address', 'adresse'),
    getCompanyValue(clientInfo, 'phone', 'telephone', 'téléphone'),
    getCompanyValue(clientInfo, 'email'),
    getCompanyValue(clientInfo, 'ice'),
  ].filter(Boolean)
}

function getLegalDetails(companyInfo = {}) {
  const details = [
    ['Adresse', getCompanyValue(companyInfo, 'address', 'adresse')],
    ['RC', getCompanyValue(companyInfo, 'rc')],
    ['ICE', getCompanyValue(companyInfo, 'ice')],
    ['Tél.', getCompanyValue(companyInfo, 'phone', 'telephone', 'téléphone')],
    ['Banque', getCompanyValue(companyInfo, 'banque', 'bank')],
    ['RIB', getCompanyValue(companyInfo, 'rib')],
    ['Capital social', getCompanyValue(companyInfo, 'capitalSocial', 'capital')],
    ['IF', getCompanyValue(companyInfo, 'identifiantFiscal', 'if', 'taxId')],
    ['CNSS', getCompanyValue(companyInfo, 'cnss', 'numeroCNSS')],
    ['Patente', getCompanyValue(companyInfo, 'patente')],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label} : ${value}`)

  return details.length
    ? details.join('  ·  ')
    : 'TGI Ascenseurs Casa · Document généré par TGI Manager Pro'
}

function TotalsBlock({ totals }) {
  const totalHT = getTotal(totals, 'totalHT', 'montantHT')
  const totalTTC = getTotal(totals, 'totalTTC', 'montantTTC')
  const totalTVA =
    getTotal(totals, 'totalTVA', 'montantTVA', 'taxAmount') ??
    (totalHT !== undefined && totalTTC !== undefined ? totalTTC - totalHT : undefined)
  const amountPaid = getTotal(totals, 'amountPaid', 'montantPaye')
  const outstanding = getTotal(totals, 'outstandingBalance', 'resteAPayer')
  const rows = [
    totalHT !== undefined ? { label: 'Total HT', value: totalHT } : null,
    totalTVA !== undefined ? { label: 'TVA', value: totalTVA } : null,
    totalTTC !== undefined ? { label: 'Total TTC', value: totalTTC, grand: true } : null,
    amountPaid !== undefined ? { label: 'Montant payé', value: amountPaid } : null,
    outstanding !== undefined ? { label: 'Reste à payer', value: outstanding } : null,
  ].filter(Boolean)

  if (rows.length === 0) {
    return null
  }

  return (
    <View style={styles.totals} wrap={false}>
      {rows.map((row) => (
        <View
          key={row.label}
          style={[
            styles.totalRow,
            row.grand ? styles.grandTotal : null,
          ]}
        >
          <Text style={row.grand ? styles.grandTotalLabel : styles.totalLabel}>
            {row.label}
          </Text>
          <Text style={row.grand ? styles.grandTotalValue : styles.totalValue}>
            {formatCurrency(row.value)}
          </Text>
        </View>
      ))}
    </View>
  )
}

export default function MasterPdfTemplate({
  documentTitle,
  data = [],
  columns = [],
  clientInfo = {},
  totals,
  date,
  notes = '',
  companyInfo = {},
}) {
  const companyName =
    getCompanyValue(companyInfo, 'name', 'nom') || 'TGI Ascenseurs Casa'
  const clientName = getCompanyValue(clientInfo, 'nom', 'name', 'raisonSociale')
  const clientDetails = getClientDetails(clientInfo)
  const safeColumns = Array.isArray(columns) ? columns : []
  const safeData = Array.isArray(data) ? data : []

  return (
    <Document
      author={companyName}
      subject={documentTitle || 'Document TGI Ascenseurs Casa'}
      title={documentTitle || 'TGI Ascenseurs Casa'}
    >
      <Page size="A4" orientation="landscape" style={pdfPageStyles.page} wrap>
        <PdfDocumentHeader
          companyInfo={companyInfo}
          companyName={companyName}
          documentTitle={documentTitle || 'Document'}
        />

        <PdfClientSummary
          clientName={clientName || 'Tous les clients'}
          clientDetails={clientDetails}
          metaRows={[
            { label: 'DATE', value: formatDocumentDate(date) },
            { label: 'ÉCHÉANCE', value: '—' },
            { label: 'STATUT', value: '—' },
          ]}
        />

        {safeColumns.length > 0 && (
          <View style={styles.table}>
            <Text style={styles.tableSectionTitle}>DÉTAIL DES ARTICLES ET PRESTATIONS</Text>
            <View fixed style={styles.tableHeader}>
              {safeColumns.map((column, index) => (
                <Text
                  key={`${getColumnHeader(column, index)}-${index}`}
                  style={[
                    styles.headerCell,
                    { width: getColumnWidth(column, safeColumns.length) },
                    column?.align === 'right' ? { textAlign: 'right' } : null,
                  ]}
                >
                  {getColumnHeader(column, index)}
                </Text>
              ))}
            </View>
            {safeData.length === 0 ? (
              <View style={styles.tableRow} wrap={false}>
                <Text style={styles.emptyCell}>Aucune donnée à afficher.</Text>
              </View>
            ) : (
              safeData.map((row, rowIndex) => (
                <View
                  key={row?.id || rowIndex}
                  style={[
                    styles.tableRow,
                    rowIndex % 2 === 1 ? styles.alternateRow : null,
                  ]}
                  wrap={false}
                >
                  {safeColumns.map((column, columnIndex) => (
                    <Text
                      key={`${getColumnHeader(column, columnIndex)}-${columnIndex}`}
                      style={[
                        styles.cell,
                        { width: getColumnWidth(column, safeColumns.length) },
                        column?.align === 'right' ? { textAlign: 'right' } : null,
                      ]}
                    >
                      {getCellValue(row, column, columnIndex)}
                    </Text>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        <TotalsBlock totals={totals} />
        {notes && <Text style={styles.notes}>{notes}</Text>}

        <PdfDocumentFooter
          companyName={companyName}
          companyInfo={companyInfo}
          legalDetails={{ legal: [getLegalDetails(companyInfo)] }}
        />
      </Page>
    </Document>
  )
}
