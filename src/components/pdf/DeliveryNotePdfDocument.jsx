import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  PdfClientSummary,
  PdfDocumentFooter,
  PdfDocumentHeader,
  PdfSignatures,
} from './PdfDocumentChrome.jsx'
import { pdfPageStyles, pdfTableStyles } from './PdfDocumentStyles.js'
import { breakLongTextAtCharacters } from './pdfTextUtils.js'

const NAVY = '#1E1B4B'
const BORDER = '#E2E8F0'
const MUTED = '#64748B'

const styles = StyleSheet.create({
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
    maxWidth: 210,
    marginLeft: 16,
    color: '#FFFFFF',
    fontSize: 22,
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
  deliveryInfo: {
    width: '44%',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  deliveryInfoRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  deliveryInfoLabel: {
    width: '45%',
    paddingRight: 6,
    color: MUTED,
    fontSize: 8,
  },
  deliveryInfoValue: {
    width: '55%',
    color: '#0F172A',
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderTopWidth: 1,
    borderTopColor: NAVY,
    borderBottomWidth: 1,
    borderBottomColor: NAVY,
  },
  headerCell: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tableRow: {
    width: '100%',
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  alternateRow: {
    backgroundColor: '#F1F5F9',
  },
  cell: {
    color: '#0F172A',
    fontSize: 8,
  },
  cellContainer: {
    minWidth: 0,
    flexShrink: 0,
    overflow: 'hidden',
    paddingRight: 4,
  },
  tableSectionTitle: {
    marginBottom: 8,
    color: '#0F172A',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  emptyCell: {
    width: '100%',
    color: MUTED,
    fontSize: 10,
    textAlign: 'center',
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

function getNumber(value) {
  if (value === undefined || value === null || value === '') {
    return 0
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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

function formatQuantity(value) {
  return new Intl.NumberFormat('fr-MA', {
    maximumFractionDigits: 3,
  }).format(getNumber(value))
}

function getDeliveryNoteNumber(deliveryNote) {
  return (
    getText(deliveryNote, 'number', 'numero', 'deliveryNoteNumber') ||
    (deliveryNote.id
      ? `BL-${String(deliveryNote.id).slice(0, 7).toUpperCase()}`
      : 'Sans numéro')
  )
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
    legal.push('Bon de livraison généré par TGI Manager Pro')
  }

  return { banking, registrations, legal }
}

function getDeliveryNoteItems(deliveryNote) {
  return (Array.isArray(deliveryNote.items) ? deliveryNote.items : []).map((item) => ({
    designation: getText(item, 'designation', 'description') || 'Article',
    quantity: getNumber(item.quantity ?? item.quantite),
  }))
}

export default function DeliveryNotePdfDocument({ deliveryNote = {} }) {
  const companyInfo = deliveryNote.companyInfo || {}
  const clientInfo = deliveryNote.clientInfo || deliveryNote.client || {}
  const companyName = getText(companyInfo, 'name', 'nom') || 'TGI ASCENSEURS CASA'
  const clientName =
    getText(clientInfo, 'nom', 'name', 'raisonSociale') ||
    getText(deliveryNote, 'clientName') ||
    (typeof deliveryNote.client === 'string' ? deliveryNote.client.trim() : '') ||
    'Client non renseigné'
  const reference = getText(
    deliveryNote,
    'referenceDocument',
    'referenceLiee',
    'reference',
    'purchaseOrderReference',
    'purchaseOrderNumber',
    'bonCommandeNumero',
    'numeroBC',
  )
  const deliveryLocation = getText(deliveryNote, 'lieuLivraison', 'deliveryLocation')
  const carrierReceiver = getText(
    deliveryNote,
    'transporteurReceptionnaire',
    'carrierReceiver',
    'receptionnaire',
  )
  const clientDetails = [
    [
      'Représentant',
      getText(clientInfo, 'representant', 'représentant', 'representative', 'contactPerson'),
    ],
    ['ICE', getText(clientInfo, 'ice', 'identifiantFiscal')],
    ['Téléphone', getText(clientInfo, 'telephone', 'téléphone', 'phone')],
    ['Adresse', getText(clientInfo, 'adresse', 'address')],
    ['Lieu', deliveryLocation],
    ['Transporteur / Réceptionnaire', carrierReceiver],
    ['Référence', reference],
  ].filter(([, value]) => value)
  const legalDetails = getLegalDetails(companyInfo)
  const items = getDeliveryNoteItems(deliveryNote)
  const deliveryDate =
    deliveryNote.dateLivraison || deliveryNote.deliveryDate || deliveryNote.date

  return (
    <Document
      author={companyName}
      subject={`Bon de livraison ${getDeliveryNoteNumber(deliveryNote)}`}
      title={`Bon de livraison ${getDeliveryNoteNumber(deliveryNote)}`}
    >
      <Page size="A4" style={pdfPageStyles.page} wrap>
        <PdfDocumentHeader
          companyInfo={companyInfo}
          companyName={companyName}
          documentTitle={`Bon de livraison ${getDeliveryNoteNumber(deliveryNote)}`}
        />
        <PdfClientSummary
          clientName={clientName}
          clientDetails={clientDetails}
          metaRows={[
            { label: 'DATE', value: formatDate(deliveryDate) },
            { label: 'ÉCHÉANCE', value: '—' },
            { label: 'STATUT', value: getText(deliveryNote, 'status', 'statut') || 'Brouillon' },
          ]}
        />
        <View style={styles.tableWrap}>
          <Text style={styles.tableSectionTitle}>DÉTAIL DES ARTICLES ET PRESTATIONS</Text>
          <View style={[pdfTableStyles.table, styles.table]}>
            <View fixed style={[pdfTableStyles.row, styles.tableHeader]}>
              <View style={[pdfTableStyles.cell, { width: '8%' }]}>
                <Text style={[pdfTableStyles.cellText, styles.headerCell]}>#</Text>
              </View>
              <View style={[pdfTableStyles.cell, { width: '70%' }]}>
                <Text style={[pdfTableStyles.cellText, styles.headerCell]}>Désignation</Text>
              </View>
              <View style={[pdfTableStyles.cell, { width: '22%' }]}>
                <Text
                  style={[
                    pdfTableStyles.cellText,
                    styles.headerCell,
                    { textAlign: 'right' },
                  ]}
                >
                  Qté
                </Text>
              </View>
            </View>
            {items.length === 0 ? (
              <View style={styles.tableRow} wrap={false}>
                <Text style={styles.emptyCell}>Aucun article renseigné.</Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View
                  key={`${item.designation}-${index}`}
                  style={[styles.tableRow, index % 2 === 1 ? styles.alternateRow : null]}
                  wrap={false}
                >
                  <View
                    style={[
                      pdfTableStyles.cell,
                      styles.cellContainer,
                      { width: '8%' },
                    ]}
                  >
                    <Text style={[pdfTableStyles.cellText, styles.cell]}>{index + 1}</Text>
                  </View>
                  <View
                    style={[
                      pdfTableStyles.cell,
                      styles.cellContainer,
                      { width: '70%' },
                    ]}
                  >
                    <Text
                      style={[pdfTableStyles.cellText, styles.cell]}
                      hyphenationCallback={breakLongTextAtCharacters}
                    >
                      {item.designation}
                    </Text>
                  </View>
                  <View
                    style={[
                      pdfTableStyles.cell,
                      styles.cellContainer,
                      { width: '22%', paddingRight: 0 },
                    ]}
                  >
                    <Text
                      style={[
                        pdfTableStyles.cellText,
                        styles.cell,
                        { textAlign: 'right' },
                      ]}
                    >
                      {formatQuantity(item.quantity)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
        <PdfSignatures
          clientLabel="LE CLIENT (Nom, date, signature et cachet)"
          companyLabel="TGI ASCENSEURS (Signature et cachet)"
          clientHint="Accusé de réception"
          companyHint="Livraison conforme"
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
