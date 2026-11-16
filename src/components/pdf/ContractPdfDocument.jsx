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
    backgroundColor: '#F1F5F9',
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
    color: '#334155',
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
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  equipmentRowAlternate: {
    backgroundColor: PALE_BLUE,
  },
  equipmentIndex: {
    width: 22,
    color: NAVY,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  equipmentDescription: {
    flexGrow: 1,
    color: '#334155',
    fontSize: 9,
    lineHeight: 1.4,
  },
  emptyText: {
    color: MUTED,
    fontSize: 9,
    fontStyle: 'italic',
  },
  financialGrid: {
    flexDirection: 'row',
    marginBottom: 9,
  },
  financialCard: {
    flexGrow: 1,
    flexBasis: 0,
    padding: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  financialCardSpaced: {
    marginRight: 9,
  },
  financialLabel: {
    marginBottom: 4,
    color: MUTED,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  financialValue: {
    color: '#1E293B',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotal: {
    padding: 6,
    color: '#FFFFFF',
    fontSize: 12,
    backgroundColor: NAVY,
    borderRadius: 3,
  },
  clauseBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  clauseText: {
    color: '#1E293B',
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
  const companyDetails = getCompanyDetails(companyInfo)
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
  const contractNature = getText(contract, 'type') || '—'
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

  return (
    <Document
      author={companyName}
      subject={`Contrat d’entretien ${getContractNumber(contract)}`}
      title={`Contrat d’entretien ${getContractNumber(contract)}`}
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
            <Text style={styles.documentTitle}>CONTRAT D’ENTRETIEN</Text>
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
          <View style={styles.contractMeta}>
            <View style={styles.contractMetaCard}>
              <View style={styles.contractMetaItem}>
                <Text style={styles.contractMetaLabel}>N° de contrat</Text>
                <Text style={styles.financialValue}>{getContractNumber(contract)}</Text>
              </View>
              <View style={styles.contractMetaItem}>
                <Text style={styles.contractMetaLabel}>Date de début</Text>
                <Text style={styles.financialValue}>{formatDate(dateDebut)}</Text>
              </View>
              <View style={styles.contractMetaItem}>
                <Text style={styles.contractMetaLabel}>Date de fin</Text>
                <Text style={styles.financialValue}>{formatDate(dateFin)}</Text>
              </View>
            </View>
          </View>

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
            {elevators.length > 0 ? (
              elevators.map((elevator, index) => (
                <View
                  key={elevator.id || `${getElevatorDescription(elevator)}-${index}`}
                  style={[
                    styles.equipmentRow,
                    index % 2 === 1 ? styles.equipmentRowAlternate : null,
                  ]}
                  wrap={false}
                >
                  <Text style={styles.equipmentIndex}>{index + 1}.</Text>
                  <Text style={styles.equipmentDescription}>
                    {getElevatorDescription(elevator)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Aucun équipement associé à ce contrat.</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Conditions financières et durée</Text>
            <View style={styles.financialGrid}>
              <View style={[styles.financialCard, styles.financialCardSpaced]}>
                <Text style={styles.financialLabel}>Montant HT</Text>
                <Text style={styles.financialValue}>{formatCurrency(totalHT)}</Text>
              </View>
              <View style={[styles.financialCard, styles.financialCardSpaced]}>
                <Text style={styles.financialLabel}>TVA ({vatRate} %)</Text>
                <Text style={styles.financialValue}>
                  {formatCurrency(totalTTC - totalHT)}
                </Text>
              </View>
              <View style={styles.financialCard}>
                <Text style={styles.financialLabel}>Montant TTC</Text>
                <Text style={[styles.financialValue, styles.grandTotal]}>
                  {formatCurrency(totalTTC)}
                </Text>
              </View>
            </View>
            <View style={styles.financialGrid}>
              <View style={[styles.financialCard, styles.financialCardSpaced]}>
                <Text style={styles.financialLabel}>Date de début</Text>
                <Text style={styles.financialValue}>{formatDate(dateDebut)}</Text>
              </View>
              <View style={[styles.financialCard, styles.financialCardSpaced]}>
                <Text style={styles.financialLabel}>Date de fin</Text>
                <Text style={styles.financialValue}>{formatDate(dateFin)}</Text>
              </View>
              <View style={styles.financialCard}>
                <Text style={styles.financialLabel}>Périodicité de paiement</Text>
                <Text style={styles.financialValue}>{frequency || '—'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Spécifications et engagements de service</Text>
            <View style={styles.financialGrid}>
              <View style={[styles.financialCard, styles.financialCardSpaced]}>
                <Text style={styles.financialLabel}>Type de contrat</Text>
                <Text style={styles.financialValue}>{serviceType}</Text>
              </View>
              <View style={[styles.financialCard, styles.financialCardSpaced]}>
                <Text style={styles.financialLabel}>Objet / nature</Text>
                <Text style={styles.financialValue}>{contractNature}</Text>
              </View>
              <View style={[styles.financialCard, styles.financialCardSpaced]}>
                <Text style={styles.financialLabel}>Délai d’intervention garanti (SLA)</Text>
                <Text style={styles.financialValue}>{responseSla}</Text>
              </View>
              <View style={styles.financialCard}>
                <Text style={styles.financialLabel}>Tacite reconduction</Text>
                <Text style={styles.financialValue}>
                  {automaticRenewal ? 'Oui — renouvellement automatique' : 'Non'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Clauses du contrat</Text>
            <View style={styles.clauseBox}>
              <Text style={styles.clauseText}>{clauses}</Text>
            </View>
          </View>

          <View style={styles.signatures} wrap={false}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Le Prestataire</Text>
              <Text style={styles.signatureHint}>{companyName}</Text>
              <View style={styles.signatureLine} />
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Le Client</Text>
              <Text style={styles.signatureHint}>Lu et approuvé</Text>
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
              Contrat d’entretien · Exemplaire destiné aux parties signataires.
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
