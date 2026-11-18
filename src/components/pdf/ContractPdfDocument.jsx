import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  PdfClientSummary,
  PdfDocumentFooter,
  PdfDocumentHeader,
  PdfSignatures,
} from './PdfDocumentChrome.jsx'
import { pdfPageStyles } from './PdfDocumentStyles.js'

const NAVY = '#0A2540'
const BORDER = '#E2E8F0'
const MUTED = '#64748B'
const PALE_GRAY = '#FFFFFF'

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
    maxWidth: 220,
    marginLeft: 16,
    color: '#FFFFFF',
    fontSize: 21,
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
  contractMeta: {
  },
  contractMetaCard: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  contractMetaItem: {
    width: '32%',
  },
  contractMetaLabel: {
    marginBottom: 4,
    color: MUTED,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  intro: {
    marginTop: 16,
  },
  introCard: {
    padding: 14,
    backgroundColor: PALE_GRAY,
    borderLeftWidth: 4,
    borderLeftColor: NAVY,
    borderRadius: 4,
  },
  introLead: {
    marginBottom: 6,
    color: NAVY,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  introText: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 1.5,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 7,
    paddingBottom: 6,
    color: NAVY,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  equipmentRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  equipmentRowAlternate: {
    backgroundColor: '#F1F5F9',
  },
  equipmentIndex: {
    width: '8%',
    color: NAVY,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  equipmentDescription: {
    flexGrow: 1,
    color: '#0F172A',
    fontSize: 9,
    lineHeight: 1.4,
  },
  equipmentTableTitle: {
    marginBottom: 8,
    color: '#0F172A',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  equipmentTableHeader: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderTopWidth: 1,
    borderTopColor: NAVY,
    borderBottomWidth: 1,
    borderBottomColor: NAVY,
  },
  equipmentHeaderCell: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emptyText: {
    color: MUTED,
    fontSize: 9,
    fontStyle: 'italic',
  },
  financialGrid: {
    marginBottom: 9,
  },
  financialGridRow: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialCard: {
    width: '49%',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
  },
  financialLabel: {
    color: '#94A3B8',
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  financialValue: {
    marginTop: 2,
    color: '#0F172A',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  financialSummary: {
    width: '52%',
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 'auto',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
  },
  financialSummaryRow: {
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialSummaryLabel: {
    color: MUTED,
    fontSize: 8,
  },
  financialSummaryValue: {
    color: '#0F172A',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  financialSummaryGrand: {
    marginTop: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderLeftWidth: 4,
  },
  grandTotal: {
    padding: 6,
    color: '#FFFFFF',
    fontSize: 12,
    backgroundColor: NAVY,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderLeftWidth: 4,
  },
  clauseBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  clauseText: {
    color: '#0F172A',
    fontSize: 10,
    lineHeight: 1.55,
    textAlign: 'justify',
  },
  signatures: {
    flexDirection: 'row',
    marginTop: 18,
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '48%',
    minHeight: 120,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  signatureTitle: {
    color: '#0F172A',
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
    height: 50,
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

function getContractNumber(contract) {
  return getText(contract, 'number', 'numero', 'contractNumber') || 'Sans numéro'
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
    legal.push('Contrat généré par TGI Manager Pro')
  }

  return { banking, registrations, legal }
}

function getElevators(contract) {
  const details = contract.elevatorDetails || contract.equipmentDetails
  if (Array.isArray(details) && details.length > 0) {
    return details.filter((detail) => detail && typeof detail === 'object')
  }

  const ids = contract.elevatorIds || contract.equipementIds || contract.equipmentIds
  return Array.isArray(ids) ? ids.map((id) => ({ id: String(id) })) : []
}

function getElevatorDescription(elevator) {
  const reference = getText(
    elevator,
    'reference',
    'numeroSerie',
    'serialNumber',
    'serial',
  )
  const type = getText(elevator, 'type', 'equipmentType') || 'Équipement'
  const brand = getText(elevator, 'marque', 'brand')
  const address = getText(
    elevator,
    'adresseInstallation',
    'installationAddress',
    'address',
    'adresse',
  )
  const details = [
    reference ? `N° série / Référence : ${reference}` : '',
    `Type : ${type}`,
    brand ? `Marque : ${brand}` : '',
    address ? `Adresse : ${address}` : '',
  ].filter(Boolean)

  return details.join('  ·  ')
}

function getContractTotalHT(contract) {
  return getNumber(contract.montantHT ?? contract.amountHT ?? contract.totalHT, 0)
}

function getContractVatRate(contract) {
  return getNumber(contract.tauxTVA ?? contract.vatRate, 0)
}

function getContractTotalTTC(contract, totalHT, vatRate) {
  const explicitTotal = contract.totalTTC ?? contract.montantTTC ?? contract.amountTTC
  return getNumber(explicitTotal, totalHT * (1 + vatRate / 100))
}

function groupIntoPairs(items) {
  const rows = []
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2))
  }
  return rows
}

export default function ContractPdfDocument({ contract = {} }) {
  const companyInfo = contract.companyInfo || {}
  const clientInfo = contract.clientInfo || contract.client || {}
  const companyName = getText(companyInfo, 'name', 'nom') || 'TGI ASCENSEURS CASA'
  const clientName =
    getText(clientInfo, 'nom', 'name', 'raisonSociale') ||
    getText(contract, 'clientName') ||
    'Client non renseigné'
  const clientIce = getText(clientInfo, 'ice', 'identifiantFiscal') || 'non renseigné'
  const clientAddress = getText(clientInfo, 'adresse', 'address') || 'non renseignée'
  const companyAddress = getText(companyInfo, 'address', 'adresse') || '—'
  const companyIce = getText(companyInfo, 'ice')
  const companyRc = getText(companyInfo, 'rc')
  const companyPartyDetails = [
    companyAddress,
    companyRc ? `RC : ${companyRc}` : '',
    companyIce ? `ICE : ${companyIce}` : '',
  ].filter(Boolean)
  const legalDetails = getLegalDetails(companyInfo)
  const elevators = getElevators(contract)
  const dateDebut = contract.dateDebut || contract.startDate
  const dateFin = contract.dateFin || contract.endDate
  const totalHT = getContractTotalHT(contract)
  const vatRate = getContractVatRate(contract)
  const totalTTC = getContractTotalTTC(contract, totalHT, vatRate)
  const frequency = getText(
    contract,
    'frequenceFacturation',
    'billingFrequency',
    'paymentFrequency',
  )
  const serviceType = getText(contract, 'typeContrat', 'contractType') || 'Non renseigné'
  const contractNature = getText(
    contract,
    'type',
    'natureContrat',
    'objet',
    'nature',
  ) || '—'
  const isInstallation = contractNature
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR') === 'installation'
  const documentTitle = isInstallation ? 'CONTRAT D’INSTALLATION' : 'CONTRAT D’ENTRETIEN'
  const documentTitleSentence = isInstallation
    ? 'Contrat d’installation'
    : 'Contrat d’entretien'
  const clientRepresentative = getText(
    clientInfo,
    'representant',
    'représentant',
    'representative',
    'contactPerson',
  )
  const clientPhone = getText(clientInfo, 'telephone', 'téléphone', 'phone')
  const clientDetails = [
    ['Représentant', clientRepresentative],
    ['ICE', clientIce],
    ['Téléphone', clientPhone],
    ['Adresse', clientAddress],
  ].filter(([, value]) => value)
  const responseSla = getText(
    contract,
    'slaIntervention',
    'delaiInterventionGaranti',
    'responseTimeSla',
  ) || 'Non défini'
  const automaticRenewal = Boolean(
    contract.taciteReconduction ?? contract.automaticRenewal ?? false,
  )
  const clauses = getText(contract, 'clauses', 'conditions') || 'Aucune clause particulière.'
  const contractTerms = [
    ['Date de début', formatDate(dateDebut)],
    ['Date de fin', formatDate(dateFin)],
    ['Périodicité de paiement', frequency || '—'],
  ]
  const serviceTerms = [
    ['Type de contrat', serviceType],
    ['Objet / nature', contractNature],
    ['Délai d’intervention garanti (SLA)', responseSla],
    ['Tacite reconduction', automaticRenewal ? 'Oui — renouvellement automatique' : 'Non'],
  ]

  return (
    <Document
      author={companyName}
      subject={`${documentTitleSentence} ${getContractNumber(contract)}`}
      title={`${documentTitleSentence} ${getContractNumber(contract)}`}
    >
      <Page size="A4" style={pdfPageStyles.page} wrap>
        <PdfDocumentHeader
          companyInfo={companyInfo}
          companyName={companyName}
          documentTitle={`${documentTitle} ${getContractNumber(contract)}`}
        />
        <PdfClientSummary
          clientName={clientName}
          clientDetails={clientDetails}
          metaRows={[
            { label: 'DATE', value: formatDate(dateDebut) },
            { label: 'ÉCHÉANCE', value: formatDate(dateFin) },
            { label: 'STATUT', value: getText(contract, 'status', 'statut') || '—' },
          ]}
        />

        <View>
          <View style={styles.intro}>
            <View style={styles.introCard}>
              <Text style={styles.introLead}>Entre les soussignés :</Text>
              <Text style={styles.introText}>
                {companyName}
                {companyPartyDetails.length ? `, ${companyPartyDetails.join(' · ')}` : ''}, d’une part,
                et le Client {clientName}, ICE {clientIce}, domicilié à {clientAddress}, d’autre part.
                {'\n'}Il a été convenu ce qui suit :
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Objet du contrat et équipements concernés</Text>
            <Text style={styles.equipmentTableTitle}>
              DÉTAIL DES ARTICLES ET PRESTATIONS
            </Text>
            {elevators.length > 0 ? (
              <>
                <View fixed style={styles.equipmentTableHeader}>
                  <Text style={[styles.equipmentHeaderCell, { width: '8%' }]}>#</Text>
                  <Text style={[styles.equipmentHeaderCell, { width: '92%' }]}>
                    Désignation
                  </Text>
                </View>
                {elevators.map((elevator, index) => (
                  <View
                    key={elevator.id || `${getElevatorDescription(elevator)}-${index}`}
                    style={[
                      styles.equipmentRow,
                      index % 2 === 1 ? styles.equipmentRowAlternate : null,
                    ]}
                    wrap={false}
                  >
                    <Text style={styles.equipmentIndex}>{index + 1}</Text>
                    <Text style={styles.equipmentDescription}>
                      {getElevatorDescription(elevator)}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.emptyText}>Aucun équipement associé à ce contrat.</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Conditions financières et durée</Text>
            <Text style={styles.equipmentTableTitle}>RÉCAPITULATIF FINANCIER</Text>
            <View style={styles.financialSummary} wrap={false}>
              <View style={styles.financialSummaryRow}>
                <Text style={styles.financialSummaryLabel}>Total brut HT</Text>
                <Text style={styles.financialSummaryValue}>{formatCurrency(totalHT)}</Text>
              </View>
              <View style={styles.financialSummaryRow}>
                <Text style={styles.financialSummaryLabel}>Remise</Text>
                <Text style={styles.financialSummaryValue}>{formatCurrency(0)}</Text>
              </View>
              <View style={styles.financialSummaryRow}>
                <Text style={styles.financialSummaryLabel}>Net HT</Text>
                <Text style={styles.financialSummaryValue}>{formatCurrency(totalHT)}</Text>
              </View>
              <View style={styles.financialSummaryRow}>
                <Text style={styles.financialSummaryLabel}>TVA ({vatRate}%)</Text>
                <Text style={styles.financialSummaryValue}>
                  {formatCurrency(totalTTC - totalHT)}
                </Text>
              </View>
              <View style={styles.financialSummaryGrand}>
                <Text
                  style={[
                    styles.financialSummaryLabel,
                    { color: '#FFFFFF', fontFamily: 'Helvetica-Bold' },
                  ]}
                >
                  TOTAL TTC
                </Text>
                <Text
                  style={[
                    styles.financialSummaryValue,
                    { color: '#F59E0B', fontSize: 16, fontFamily: 'Helvetica-Bold' },
                  ]}
                >
                  {formatCurrency(totalTTC)}
                </Text>
              </View>
            </View>
            <View style={styles.financialGrid}>
              {groupIntoPairs(contractTerms).map((row, rowIndex) => (
                <View
                  key={`contract-term-row-${rowIndex}`}
                  style={styles.financialGridRow}
                  wrap={false}
                >
                  {row.map(([label, value]) => (
                    <View key={label} style={styles.financialCard}>
                      <Text style={styles.financialLabel}>{label}</Text>
                      <Text style={styles.financialValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Spécifications et engagements de service</Text>
            <View style={styles.financialGrid}>
              {groupIntoPairs(serviceTerms).map((row, rowIndex) => (
                <View
                  key={`service-term-row-${rowIndex}`}
                  style={styles.financialGridRow}
                  wrap={false}
                >
                  {row.map(([label, value]) => (
                    <View key={label} style={styles.financialCard}>
                      <Text style={styles.financialLabel}>{label}</Text>
                      <Text style={styles.financialValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Clauses du contrat</Text>
            <View style={styles.clauseBox}>
              <Text style={styles.clauseText}>{clauses}</Text>
            </View>
          </View>

          <PdfSignatures
            clientLabel="LE CLIENT (Nom, date, signature et cachet)"
            companyLabel="TGI ASCENSEURS (Signature et cachet)"
            clientHint="Lu et approuvé"
            companyHint={companyName}
          />
        </View>

        <PdfDocumentFooter
          companyName={companyName}
          companyInfo={companyInfo}
          legalDetails={legalDetails}
        />
      </Page>
    </Document>
  )
}
