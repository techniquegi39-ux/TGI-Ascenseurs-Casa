import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  PdfClientSummary,
  PdfDocumentFooter,
  PdfDocumentHeader,
} from './PdfDocumentChrome.jsx'
import { pdfPageStyles } from './PdfDocumentStyles.js'

const NAVY = '#1E3A8A'
const BORDER = '#E2E8F0'
const MUTED = '#475569'
const PALE = '#F8FAFC'

const styles = StyleSheet.create({
  page: {
    paddingTop: 130,
    paddingBottom: 90,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontFamily: 'Helvetica',
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
  documentMeta: {
    marginBottom: 4,
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
  sectionHeader: {
    marginTop: 14,
    marginBottom: 4,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sectionTitle: {
    color: NAVY,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  alternateRow: {
    backgroundColor: PALE,
  },
  label: {
    width: '40%',
    paddingRight: 10,
    color: MUTED,
    fontSize: 9,
  },
  value: {
    width: '60%',
    color: '#0F172A',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.35,
  },
  footer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
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

function isClientActive(client) {
  const status = client.active ?? client.actif ?? client.status ?? client.statut

  if (typeof status === 'boolean') {
    return status
  }

  if (typeof status === 'string') {
    return !['inactif', 'inactive', 'false', 'non'].includes(
      status.trim().toLocaleLowerCase('fr-FR'),
    )
  }

  return true
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
  const active = isClientActive(client)

  return [
    {
      title: 'Identité & Contact',
      details: [
        ['Nom / Raison sociale', getText(client, 'nom', 'raisonSociale', 'name') || 'Client sans nom'],
        ['Type de client', getText(client, 'type') || '—'],
        ['ICE / Identifiant fiscal', getText(client, 'ice', 'identifiantFiscal') || '—'],
        ['Téléphone', getText(client, 'telephone', 'téléphone', 'phone') || '—'],
        ['E-mail', getText(client, 'email') || '—'],
        ['Statut', active ? 'Actif' : 'Inactif'],
      ],
    },
    {
      title: 'Localisation',
      details: [
        ['Adresse complète', getText(client, 'adresse', 'address') || '—'],
        ['Ville', getText(client, 'ville', 'city') || '—'],
        [
          'Google Maps',
          getText(client, 'googleMapsLink', 'localisationGoogleMaps', 'mapsUrl') || '—',
        ],
        ['Coordonnées GPS', getText(client, 'coordonneesGPS', 'gpsCoordinates') || '—'],
      ],
    },
    {
      title: 'Gestion de l’Immeuble',
      details: [
        ['Syndic', getText(client, 'syndicNom', 'nomSyndic', 'syndicName') || '—'],
        [
          'Téléphone du syndic',
          getText(client, 'syndicTelephone', 'telephoneSyndic', 'syndicPhone') || '—',
        ],
        ['Concierge', getText(client, 'conciergeNom', 'nomConcierge', 'conciergeName') || '—'],
        [
          'Téléphone du concierge',
          getText(client, 'conciergeTelephone', 'telephoneConcierge', 'conciergePhone') ||
            '—',
        ],
      ],
    },
    {
      title: 'Conditions Financières',
      details: [
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

export default function ClientPdfDocument({
  client = {},
  companyInfo = {},
  generatedAt = new Date(),
}) {
  const companyName = getText(companyInfo, 'name', 'nom') || 'TGI ASCENSEURS CASA'
  const legalDetails = getLegalDetails(companyInfo)
  const clientName = getText(client, 'nom', 'raisonSociale', 'name') || 'Client sans nom'
  const clientReference =
    getText(client, 'reference', 'ref') ||
    (client.id ? `CL-${String(client.id).slice(0, 7).toUpperCase()}` : 'Sans référence')
  const sections = getClientSections(client)
  const clientDetails = [
    getText(client, 'ice', 'identifiantFiscal')
      ? `ICE : ${getText(client, 'ice', 'identifiantFiscal')}`
      : '',
    getText(client, 'telephone', 'téléphone', 'phone')
      ? `Téléphone : ${getText(client, 'telephone', 'téléphone', 'phone')}`
      : '',
    getText(client, 'adresse', 'address')
      ? `Adresse : ${getText(client, 'adresse', 'address')}`
      : '',
  ].filter(Boolean)

  return (
    <Document
      author={companyName}
      subject={`Fiche client ${clientReference}`}
      title={`Fiche client ${clientName}`}
    >
      <Page size="A4" style={pdfPageStyles.page} wrap>
        <PdfDocumentHeader
          companyInfo={companyInfo}
          companyName={companyName}
          documentTitle={`Fiche client ${clientReference}`}
        />
        <PdfClientSummary
          clientName={clientName}
          clientDetails={clientDetails}
          metaRows={[
            { label: 'DATE', value: formatDate(generatedAt) },
            { label: 'ÉCHÉANCE', value: '—' },
            { label: 'STATUT', value: isClientActive(client) ? 'Actif' : 'Inactif' },
          ]}
        />

        {sections.map((section) => (
          <View key={section.title}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {section.details.map(([label, value], index) => (
              <View
                key={label}
                style={[styles.row, index % 2 === 1 && styles.alternateRow]}
              >
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}
          </View>
        ))}

        <PdfDocumentFooter
          companyName={companyName}
          companyInfo={companyInfo}
          legalDetails={legalDetails}
        />
      </Page>
    </Document>
  )
}