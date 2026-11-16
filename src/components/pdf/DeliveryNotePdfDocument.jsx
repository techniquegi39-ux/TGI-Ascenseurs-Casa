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
    letterSpacing: 0.4,
  },
  documentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  detailText: {
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
  deliveryInfo: {
    marginBottom: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    backgroundColor: '#F8FAFC',
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    marginTop: 3,
  },
  deliveryInfoLabel: {
    width: 140,
    color: MUTED,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  deliveryInfoValue: {
    flexGrow: 1,
    color: '#334155',
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
    paddingVertical: 9,
    paddingHorizontal: 8,
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#334155',
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  emptyCell: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 8,
    color: MUTED,
    fontSize: 9,
    textAlign: 'center',
  },
  signatureArea: {
    marginTop: 26,
  },
  signatureBox: {
    minHeight: 150,
    padding: 14,
    borderWidth: 1.5,
    borderColor: STEEL_BLUE,
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  signatureTitle: {
    marginBottom: 8,
    color: NAVY,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  signatureHint: {
    color: MUTED,
    fontSize: 8,
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
    getText(companyInfo, 'banque', 'bank')
      ? `Banque : ${getText(companyInfo, 'banque', 'bank')}`
      : '',
    getText(companyInfo, 'rib') ? `RIB : ${getText(companyInfo, 'rib')}` : '',
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
    : 'TGI Ascenseurs Casa · Bon de livraison généré par TGI Manager Pro'
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
  const items = getDeliveryNoteItems(deliveryNote)
  const deliveryDate =
    deliveryNote.dateLivraison || deliveryNote.deliveryDate || deliveryNote.date
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

  return (
    <Document
      author={companyName}
      subject={`Bon de livraison ${getDeliveryNoteNumber(deliveryNote)}`}
      title={`Bon de livraison ${getDeliveryNoteNumber(deliveryNote)}`}
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
          <Text style={styles.title}>
            BON DE LIVRAISON N° {getDeliveryNoteNumber(deliveryNote)}
          </Text>
          <View style={styles.documentDetails}>
            <Text style={styles.detailText}>Date de livraison : {formatDate(deliveryDate)}</Text>
            {reference ? (
              <Text style={styles.detailText}>Référence commande : {reference}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.clientInfo} wrap={false}>
          <Text style={styles.sectionLabel}>Livré à</Text>
          <Text style={styles.clientName}>{clientName}</Text>
          {clientDetails.map((detail) => (
            <Text key={detail} style={styles.clientDetail}>
              {detail}
            </Text>
          ))}
        </View>

        <View style={styles.deliveryInfo}>
          <Text style={styles.sectionLabel}>Détails de livraison</Text>
          <View style={styles.deliveryInfoRow}>
            <Text style={styles.deliveryInfoLabel}>Lieu de livraison</Text>
            <Text style={styles.deliveryInfoValue}>{deliveryLocation || 'Non renseigné'}</Text>
          </View>
          <View style={styles.deliveryInfoRow}>
            <Text style={styles.deliveryInfoLabel}>Transporteur / Réceptionnaire</Text>
            <Text style={styles.deliveryInfoValue}>{carrierReceiver || 'Non renseigné'}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View fixed style={styles.tableHeader}>
            <Text style={[styles.headerCell, { width: '78%' }]}>Désignation</Text>
            <Text style={[styles.headerCell, { width: '22%', textAlign: 'right' }]}>
              Quantité
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
                <Text style={[styles.cell, { width: '78%' }]}>{item.designation}</Text>
                <Text
                  style={[
                    styles.cell,
                    styles.lastCell,
                    { width: '22%', textAlign: 'right' },
                  ]}
                >
                  {formatQuantity(item.quantity)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.signatureArea} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Accusé de réception</Text>
            <Text style={styles.signatureHint}>
              Nom, Date, Signature et Cachet du client
            </Text>
          </View>
        </View>

        <View fixed style={styles.footer}>
          <View style={styles.footerDetails}>
            <Text style={styles.legalText}>{getLegalDetails(companyInfo)}</Text>
            <Text style={styles.legalText}>
              Veuillez vérifier les quantités reçues et signaler toute réserve à la livraison.
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
