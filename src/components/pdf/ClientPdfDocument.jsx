import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const NAVY = '#1E3A8A'
const BORDER = '#E2E8F0'
const MUTED = '#475569'
const PALE_BLUE = '#F8FAFC'

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingTop: 40,
    paddingBottom: 40,
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
    marginLeft: 16,
    color: '#FFFFFF',
    fontSize: 24,
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
  content: {
    paddingTop: 28,
    paddingBottom: 120,
    paddingHorizontal: 40,
  },
  documentMeta: {
    marginBottom: 18,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  metaItem: {
    width: '48%',
  },
  metaLabel: {
    marginBottom: 4,
    color: MUTED,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: {
    color: '#111827',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 16,
    borderRadius: 4,
    backgroundColor: PALE_BLUE,
  },
  sectionTitle: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 7,
    color: NAVY,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailRow: {
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  alternateRow: {
    backgroundColor: '#FFFFFF',
  },
  detailLabel: {
    width: '36%',
    paddingRight: 12,
    color: MUTED,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  detailValue: {
    flexGrow: 1,
    flexBasis: 0,
    color: '#1F2937',
    fontSize: 9,
    lineHeight: 1.35,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: NAVY,
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

function formatDate(value) {
  let date = value
  if (typeof date?.toDate === 'function') {
    date = date.toDate()
  } else if (!(date instanceof Date)) {
    date = new Date(date)
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getCompanyDetails(companyInfo) {
  return [
    getText(companyInfo, 'address', 'adresse'),
    getText(companyInfo, 'phone', 'telephone', 'téléphone'),
    getText(companyInfo, 'email'),
  ].filter(Boolean)
}

function getClientStatus(client) {
  const status = client.active ?? client.actif ?? client.status ?? client.statut

  if (typeof status === 'boolean') {
    return status ? 'Actif' : 'Inactif'
  }

  if (typeof status === 'string') {
    return ['inactif', 'inactive', 'false', 'non'].includes(
      status.trim().toLocaleLowerCase('fr-FR'),
    )
      ? 'Inactif'
      : 'Actif'
  }

  return 'Actif'
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
  const legal = [getText(companyInfo, 'mentionsLegales', 'legalMentions')].filter(Boolean)

  if (banking.length === 0 && registrations.length === 0 && legal.length === 0) {
    banking.push('TGI Ascenseurs Casa')
    legal.push('Document généré par TGI Manager Pro')
  }

  return { banking, registrations, legal }
}

function getClientSections(client) {
  const address = getText(client, 'adresse', 'address') || '—'
  const city = getText(client, 'ville', 'city') || '—'

  return [
    {
      title: 'Informations générales',
      details: [
        ['Nom / Raison sociale', getText(client, 'nom', 'raisonSociale', 'name') || 'Client sans nom'],
        ['Type de client', getText(client, 'type') || '—'],
        ['ICE / Identifiant fiscal', getText(client, 'ice', 'identifiantFiscal') || '—'],
        ['Téléphone', getText(client, 'telephone', 'téléphone', 'phone') || '—'],
        ['E-mail', getText(client, 'email') || '—'],
        ['Adresse complète', address],
        ['Ville', city],
        ['Statut', getClientStatus(client)],
      ],
    },
    {
      title: 'Contacts de l’immeuble',
      details: [
        ['Syndic', getText(client, 'syndicNom', 'nomSyndic', 'syndicName') || '—'],
        [
          'Téléphone du syndic',
          getText(client, 'syndicTelephone', 'telephoneSyndic', 'syndicPhone') || '—',
        ],
        ['Concierge', getText(client, 'conciergeNom', 'nomConcierge', 'conciergeName') || '—'],
        [
          'Téléphone du concierge',
          getText(client, 'conciergeTelephone', 'telephoneConcierge', 'conciergePhone') || '—',
        ],
      ],
    },
    {
      title: 'Localisation & conditions financières',
      details: [
        [
          'Google Maps',
          getText(client, 'googleMapsLink', 'localisationGoogleMaps', 'mapsUrl') || '—',
        ],
        ['Coordonnées GPS', getText(client, 'coordonneesGPS', 'gpsCoordinates') || '—'],
        [
          'Mode de paiement préféré',
          getText(client, 'modePaiementPrefere', 'preferredPaymentMethod') || '—',
        ],
        [
          'Conditions particulières',
          getText(client, 'conditionsParticulieres', 'specialConditions') || '—',
        ],
      ],
    },
  ]
}

export default function ClientPdfDocument({ client = {}, companyInfo = {}, generatedAt = new Date() }) {
  const companyName = getText(companyInfo, 'name', 'nom') || 'TGI ASCENSEURS CASA'
  const companyDetails = getCompanyDetails(companyInfo)
  const legalDetails = getLegalDetails(companyInfo)
  const clientName = getText(client, 'nom', 'raisonSociale', 'name') || 'Client sans nom'
  const clientReference =
    getText(client, 'reference', 'ref') ||
    (client.id ? `CL-${String(client.id).slice(0, 7).toUpperCase()}` : 'Sans référence')
  const sections = getClientSections(client)

  return (
    <Document
      author={companyName}
      subject={`Fiche client ${clientReference}`}
      title={`Fiche client ${clientName}`}
    >
      <Page size="A4" style={{ padding: 0, backgroundColor: '#FFFFFF' }} wrap>
        <View style={styles.header}>
          <View style={styles.headerIdentity}>
            <View style={styles.logoFrame}>
              <Image
                src={companyInfo.companyLogoBase64 || '/logo.png.jpeg'}
                style={styles.logo}
              />
            </View>
            <Text style={styles.documentTitle}>FICHE CLIENT</Text>
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

        <View style={styles.content}>
          <View style={styles.documentMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Client</Text>
              <Text style={styles.metaValue}>{clientName}</Text>
            </View>
            <View style={[styles.metaItem, { alignItems: 'flex-end' }]}>
              <Text style={[styles.metaLabel, { textAlign: 'right' }]}>Référence · Date d’édition</Text>
              <Text style={[styles.metaValue, { textAlign: 'right' }]}>
                {clientReference} · {formatDate(generatedAt)}
              </Text>
            </View>
          </View>

          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.details.map(([label, value], index) => (
                <View
                  key={label}
                  style={[styles.detailRow, index % 2 === 1 && styles.alternateRow]}
                >
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}
            </View>
          ))}
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
          <View style={[styles.footerColumn, { alignItems: 'flex-end' }]}>
            {legalDetails.legal.map((detail) => (
              <Text key={detail} style={styles.legalText}>
                {detail}
              </Text>
            ))}
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
