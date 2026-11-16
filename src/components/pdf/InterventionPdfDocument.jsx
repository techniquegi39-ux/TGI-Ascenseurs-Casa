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
    paddingTop: 35,
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
    maxWidth: 240,
    marginLeft: 14,
    color: '#FFFFFF',
    fontSize: 20,
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
  infoGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  infoCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  infoCardTitle: {
    marginBottom: 4,
    color: '#111827',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  infoText: {
    marginTop: 2,
    color: '#1F2937',
    fontSize: 9,
    lineHeight: 1.4,
  },
  sectionLabel: {
    marginBottom: 7,
    color: MUTED,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  details: {
    marginTop: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
  },
  detailItem: {
    width: '33.33%',
    padding: 8,
    backgroundColor: PALE_GRAY,
  },
  detailLabel: {
    marginBottom: 4,
    color: MUTED,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#1E293B',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  maintenanceChecklist: {
    marginBottom: 14,
    padding: 12,
    backgroundColor: PALE_BLUE,
    borderRadius: 4,
  },
  checklistTitle: {
    marginBottom: 7,
    color: NAVY,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  checklistItem: {
    marginTop: 4,
    color: '#334155',
    fontSize: 9,
  },
  sectionWrap: {
    marginTop: 14,
  },
  report: {
    padding: 15,
    backgroundColor: PALE_GRAY,
    borderLeftWidth: 4,
    borderLeftColor: NAVY,
    borderRadius: 4,
  },
  reportText: {
    color: '#334155',
    fontSize: 10,
    lineHeight: 1.55,
  },
  problem: {
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 4,
  },
  problemTitle: {
    marginBottom: 5,
    color: '#92400E',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  problemText: {
    color: '#78350F',
    fontSize: 9,
    lineHeight: 1.4,
  },
  tableSection: {
    marginTop: 14,
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
    color: '#334155',
    fontSize: 10,
  },
  signatures: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '48%',
    minHeight: 110,
    padding: 14,
    backgroundColor: PALE_GRAY,
    borderRadius: 4,
  },
  signatureTitle: {
    color: '#111827',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'left',
  },
  signatureHint: {
    marginTop: 5,
    color: MUTED,
    fontSize: 8,
    textAlign: 'left',
  },
  signatureLine: {
    height: 42,
    marginTop: 8,
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
    legal.push('Fiche d’intervention générée par TGI Manager Pro')
  }

  return { banking, registrations, legal }
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
  const legalDetails = getLegalDetails(companyInfo)

  return (
    <Document
      author={companyName}
      subject={`Fiche d’intervention ${getInterventionNumber(intervention)}`}
      title={`Fiche d’intervention ${getInterventionNumber(intervention)}`}
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
            <Text style={styles.documentTitle}>FICHE D’INTERVENTION</Text>
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
          <View style={styles.infoGrid}>
            <View style={styles.infoCard} wrap={false}>
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

          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>N° d’intervention</Text>
              <Text style={styles.detailValue}>{getInterventionNumber(intervention)}</Text>
            </View>
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
            <View style={styles.sectionWrap}>
              <View style={styles.problem}>
                <Text style={styles.problemTitle}>Problème signalé</Text>
                <Text style={styles.problemText}>{problemDescription}</Text>
              </View>
            </View>
          )}

          <View style={styles.sectionWrap}>
            <View style={styles.report}>
              <Text style={styles.sectionLabel}>Rapport technique · Travaux effectués</Text>
              <Text style={styles.reportText}>
                {workReport || 'Aucun rapport de travaux renseigné.'}
              </Text>
            </View>
          </View>

          {maintenanceChecklist.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.maintenanceChecklist}>
                <Text style={styles.checklistTitle}>Checklist de maintenance réalisée</Text>
                {maintenanceChecklist.map((item, index) => (
                  <Text key={`${item}-${index}`} style={styles.checklistItem}>
                    [x] {item}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {parts.length > 0 && (
            <View style={styles.tableSection}>
              <Text style={styles.sectionLabel}>Pièces de rechange</Text>
              <View style={styles.table}>
                <View fixed style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { width: '76%' }]}>Désignation</Text>
                  <Text style={[styles.headerCell, { width: '24%', textAlign: 'right' }]}>
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
                    <Text style={[styles.cell, { width: '24%', textAlign: 'right' }]}>
                      {formatQuantity(part.quantity)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.signatures} wrap={false}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Signature du Technicien</Text>
              <View style={styles.signatureLine} />
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Signature du Client</Text>
              <Text style={styles.signatureHint}>Bon pour accord</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
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
          <View style={styles.footerPageColumn}>
            {legalDetails.legal.map((detail) => (
              <Text key={detail} style={styles.legalText}>
                {detail}
              </Text>
            ))}
            <Text style={styles.legalText}>
              TGI Ascenseurs Casa · Rapport d’intervention destiné au suivi technique.
            </Text>
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
