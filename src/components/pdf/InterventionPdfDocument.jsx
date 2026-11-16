import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const NAVY = '#17365D'
const STEEL_BLUE = '#4682B4'
const BORDER = '#D5DEE8'
const MUTED = '#64748B'
const PALE_BLUE = '#EEF4F9'
const PALE_GRAY = '#F8FAFC'

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
    letterSpacing: 0.35,
  },
  sectionLabel: {
    marginBottom: 7,
    color: NAVY,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 12,
  },
  infoCard: {
    flexGrow: 1,
    flexBasis: 0,
    padding: 10,
    backgroundColor: PALE_BLUE,
    borderLeftWidth: 3,
    borderLeftColor: STEEL_BLUE,
    borderRadius: 3,
  },
  infoCardSpaced: {
    marginRight: 10,
  },
  infoCardTitle: {
    marginBottom: 5,
    color: NAVY,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  infoText: {
    marginTop: 2,
    color: '#475569',
    fontSize: 8,
    lineHeight: 1.35,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    padding: 10,
    backgroundColor: PALE_GRAY,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
  },
  detailItem: {
    width: '33.33%',
    paddingRight: 8,
    paddingVertical: 3,
  },
  detailLabel: {
    marginBottom: 3,
    color: MUTED,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#1E293B',
    fontSize: 8,
  },
  maintenanceChecklist: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: PALE_BLUE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
  },
  checklistTitle: {
    marginBottom: 5,
    color: NAVY,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  checklistItem: {
    marginTop: 3,
    color: '#334155',
    fontSize: 8,
  },
  report: {
    marginBottom: 14,
    padding: 12,
    backgroundColor: PALE_GRAY,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 3,
    borderLeftColor: STEEL_BLUE,
    borderRadius: 3,
  },
  reportText: {
    color: '#334155',
    fontSize: 9,
    lineHeight: 1.55,
  },
  problem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 3,
  },
  problemTitle: {
    marginBottom: 4,
    color: '#92400E',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  problemText: {
    color: '#78350F',
    fontSize: 8,
    lineHeight: 1.4,
  },
  tableSection: {
    marginTop: 2,
    marginBottom: 14,
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
    backgroundColor: PALE_GRAY,
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: MUTED,
    fontSize: 8,
    textAlign: 'center',
  },
  signatures: {
    flexDirection: 'row',
    marginTop: 18,
  },
  signatureBox: {
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 112,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: 'dashed',
    borderRadius: 3,
  },
  signatureBoxSpaced: {
    marginRight: 12,
  },
  signatureTitle: {
    color: NAVY,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  signatureHint: {
    marginTop: 5,
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

function formatDateTime(value) {
  const date = getDate(value)
  return date
    ? new Intl.DateTimeFormat('fr-MA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    : '—'
}

function getInterventionNumber(intervention) {
  return (
    getText(intervention, 'number', 'numero', 'reference', 'interventionNumber') ||
    (intervention.id
      ? `INT-${String(intervention.id).slice(0, 7).toUpperCase()}`
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
    : 'TGI Ascenseurs Casa · Fiche technique générée par TGI Manager Pro'
}

function getParts(intervention) {
  const source =
    intervention.partsUsed ??
    intervention.piecesRemplacees ??
    intervention.partsReplaced ??
    []
  const entries = Array.isArray(source)
    ? source
    : String(source)
        .split(/\r?\n|;/)
        .map((part) => part.trim())
        .filter(Boolean)

  return entries
    .map((part) => {
      if (typeof part === 'string') {
        return { designation: part.trim(), quantity: 1 }
      }

      if (!part || typeof part !== 'object') {
        return null
      }

      const designation = getText(part, 'designation', 'name', 'nom', 'description', 'reference')
      const rawQuantity = part.quantity ?? part.quantite ?? part.qty ?? 1
      const parsedQuantity = Number(rawQuantity)
      return {
        designation: designation || 'Pièce remplacée',
        quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1,
      }
    })
    .filter((part) => part?.designation)
}

function formatQuantity(value) {
  const quantity = Number(value)
  return new Intl.NumberFormat('fr-MA', {
    maximumFractionDigits: 3,
  }).format(Number.isFinite(quantity) ? quantity : 0)
}

function getElapsedMinutes(intervention) {
  const savedMinutes = Number(intervention.tempsPasseMinutes)
  if (
    intervention.tempsPasseMinutes !== null &&
    intervention.tempsPasseMinutes !== undefined &&
    intervention.tempsPasseMinutes !== '' &&
    Number.isFinite(savedMinutes) &&
    savedMinutes >= 0
  ) {
    return savedMinutes
  }

  const arrival = getText(intervention, 'heureArrivee', 'arrivalTime')
  const departure = getText(intervention, 'heureDepart', 'departureTime')
  const parseTime = (time) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
    return match ? Number(match[1]) * 60 + Number(match[2]) : null
  }
  const arrivalMinutes = parseTime(arrival)
  const departureMinutes = parseTime(departure)
  if (arrivalMinutes === null || departureMinutes === null) {
    return null
  }

  return departureMinutes >= arrivalMinutes
    ? departureMinutes - arrivalMinutes
    : 24 * 60 - arrivalMinutes + departureMinutes
}

function formatElapsedTime(minutes) {
  if (minutes === null) {
    return '—'
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return [hours ? `${hours} h` : '', remainingMinutes ? `${remainingMinutes} min` : '']
    .filter(Boolean)
    .join(' ') || '0 min'
}

function getMaintenanceChecklist(intervention) {
  const source =
    intervention.checklistMaintenance || intervention.maintenanceChecklist || []
  const items = Array.isArray(source) ? source : String(source).split(/\r?\n|;/)

  return items
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim()
      }
      if (!item || typeof item !== 'object' || item.checked === false) {
        return ''
      }
      return getText(item, 'label', 'name', 'designation')
    })
    .filter(Boolean)
}

export default function InterventionPdfDocument({ intervention = {} }) {
  const companyInfo = intervention.companyInfo || {}
  const clientInfo = intervention.clientInfo || intervention.client || {}
  const equipmentInfo = intervention.equipmentInfo || intervention.elevator || {}
  const companyName = getText(companyInfo, 'name', 'nom') || 'TGI ASCENSEURS CASA'
  const clientName =
    getText(clientInfo, 'nom', 'name', 'raisonSociale') ||
    getText(intervention, 'clientName') ||
    'Client non renseigné'
  const clientPhone = getText(clientInfo, 'telephone', 'téléphone', 'phone')
  const clientAddress =
    getText(clientInfo, 'adresse', 'address') ||
    getText(intervention, 'clientAddress', 'adresseClient')
  const equipmentType =
    getText(equipmentInfo, 'type', 'equipmentType') ||
    getText(intervention, 'elevatorType', 'equipmentType') ||
    'Équipement'
  const equipmentReference =
    getText(
      equipmentInfo,
      'numeroSerie',
      'serialNumber',
      'reference',
      'serial',
    ) ||
    getText(intervention, 'elevatorReference', 'equipmentReference', 'numeroSerie')
  const equipmentAddress =
    getText(
      equipmentInfo,
      'adresseInstallation',
      'address',
      'adresse',
      'siteAddress',
    ) ||
    getText(intervention, 'adresseInstallation', 'equipmentAddress')
  const interventionDate =
    intervention.dateIntervention || intervention.dateHeure || intervention.date
  const interventionType = getText(intervention, 'type') || 'Intervention'
  const technician = getText(
    intervention,
    'technicien',
    'technician',
    'technicianName',
  )
  const workReport = getText(
    intervention,
    'travauxEffectues',
    'rapportTechnique',
    'rapport',
    'report',
    'workReport',
  )
  const problemDescription = getText(
    intervention,
    'descriptionProbleme',
    'probleme',
    'description',
    'problemDescription',
  )
  const parts = getParts(intervention)
  const maintenanceChecklist = getMaintenanceChecklist(intervention)
  const companyDetails = getCompanyDetails(companyInfo)

  return (
    <Document
      author={companyName}
      subject={`Fiche d’intervention ${getInterventionNumber(intervention)}`}
      title={`Fiche d’intervention ${getInterventionNumber(intervention)}`}
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
            FICHE D’INTERVENTION N° {getInterventionNumber(intervention)}
          </Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={[styles.infoCard, styles.infoCardSpaced]} wrap={false}>
            <Text style={styles.sectionLabel}>Client</Text>
            <Text style={styles.infoCardTitle}>{clientName}</Text>
            {clientPhone && <Text style={styles.infoText}>Tél. : {clientPhone}</Text>}
            {clientAddress && <Text style={styles.infoText}>{clientAddress}</Text>}
          </View>
          <View style={styles.infoCard} wrap={false}>
            <Text style={styles.sectionLabel}>Équipement concerné</Text>
            <Text style={styles.infoCardTitle}>{equipmentType}</Text>
            {equipmentReference && (
              <Text style={styles.infoText}>N° série / Référence : {equipmentReference}</Text>
            )}
            {equipmentAddress && (
              <Text style={styles.infoText}>Adresse : {equipmentAddress}</Text>
            )}
          </View>
        </View>

        <View style={styles.details} wrap={false}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date d’intervention</Text>
            <Text style={styles.detailValue}>{formatDateTime(interventionDate)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{interventionType}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Technicien</Text>
            <Text style={styles.detailValue}>{technician || '—'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Heure d’arrivée</Text>
            <Text style={styles.detailValue}>
              {getText(intervention, 'heureArrivee', 'arrivalTime') || '—'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Heure de départ</Text>
            <Text style={styles.detailValue}>
              {getText(intervention, 'heureDepart', 'departureTime') || '—'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Temps passé</Text>
            <Text style={styles.detailValue}>
              {formatElapsedTime(getElapsedMinutes(intervention))}
            </Text>
          </View>
        </View>

        {problemDescription && (
          <View style={styles.problem}>
            <Text style={styles.problemTitle}>Problème signalé</Text>
            <Text style={styles.problemText}>{problemDescription}</Text>
          </View>
        )}

        <View style={styles.report}>
          <Text style={styles.sectionLabel}>Travaux effectués</Text>
          <Text style={styles.reportText}>
            {workReport || 'Aucun rapport de travaux renseigné.'}
          </Text>
        </View>

        {maintenanceChecklist.length > 0 && (
          <View style={styles.maintenanceChecklist}>
            <Text style={styles.checklistTitle}>Checklist de maintenance réalisée</Text>
            {maintenanceChecklist.map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.checklistItem}>
                [x] {item}
              </Text>
            ))}
          </View>
        )}

        {parts.length > 0 && (
          <View style={styles.tableSection}>
            <Text style={styles.sectionLabel}>Pièces de rechange</Text>
            <View style={styles.table}>
              <View fixed style={styles.tableHeader}>
                <Text style={[styles.headerCell, { width: '76%' }]}>Désignation</Text>
                <Text
                  style={[styles.headerCell, { width: '24%', textAlign: 'right' }]}
                >
                  Quantité
                </Text>
              </View>
              {parts.map((part, index) => (
                <View
                  key={`${part.designation}-${index}`}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.alternateRow : null,
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.cell, { width: '76%' }]}>{part.designation}</Text>
                  <Text
                    style={[
                      styles.cell,
                      styles.lastCell,
                      { width: '24%', textAlign: 'right' },
                    ]}
                  >
                    {formatQuantity(part.quantity)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.signatures} wrap={false}>
          <View style={[styles.signatureBox, styles.signatureBoxSpaced]}>
            <Text style={styles.signatureTitle}>Signature du Technicien</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Signature du Client</Text>
            <Text style={styles.signatureHint}>Bon pour accord</Text>
          </View>
        </View>

        <View fixed style={styles.footer}>
          <View style={styles.footerDetails}>
            <Text style={styles.legalText}>{getLegalDetails(companyInfo)}</Text>
            <Text style={styles.legalText}>
              TGI Ascenseurs Casa · Rapport d’intervention destiné au suivi technique.
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
