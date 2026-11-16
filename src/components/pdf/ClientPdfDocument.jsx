import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  PdfDocumentFooter,
  PdfDocumentHeader,
} from './PdfDocumentChrome.jsx'
import { pdfPageStyles } from './PdfDocumentStyles.js'

const NAVY = '#0284C7'
const BORDER = '#E2E8F0'
const MUTED = '#64748B'
const PALE = '#F8FAFC'

const styles = StyleSheet.create({
  clientInformation: {
    marginBottom: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  clientInformationTitle: {
    color: NAVY,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
  },
  inactiveStatusBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    color: '#166534',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  inactiveStatusText: {
    color: '#991B1B',
  },
  sectionHeader: {
    marginTop: 10,
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
    letterSpacing: 1.2,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  return [
    {
      title: 'Identité & Contact',
      details: [
        ['Nom / Raison sociale', getText(client, 'nom', 'raisonSociale', 'name') || 'Client sans nom'],
        ['Type de client', getText(client, 'type') || '—'],
        ['ICE / Identifiant fiscal', getText(client, 'ice', 'identifiantFiscal') || '—'],
        ['Téléphone', getText(client, 'telephone', 'téléphone', 'phone') || '—'],
        ['E-mail', getText(client, 'email') || '—'],
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
}) {
  const companyName = getText(companyInfo, 'name', 'nom') || 'TGI ASCENSEURS CASA'
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
      <Page size="A4" style={pdfPageStyles.page} wrap>
        <PdfDocumentHeader
          companyInfo={companyInfo}
          companyName={companyName}
          documentTitle={`Fiche Client ${clientReference}`}
        />
        <View style={styles.clientInformation} wrap={false}>
          <Text style={styles.clientInformationTitle}>INFORMATIONS DU CLIENT</Text>
          <View
            style={[
              styles.statusBadge,
              !isClientActive(client) && styles.inactiveStatusBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                !isClientActive(client) && styles.inactiveStatusText,
              ]}
            >
              {isClientActive(client) ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>

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