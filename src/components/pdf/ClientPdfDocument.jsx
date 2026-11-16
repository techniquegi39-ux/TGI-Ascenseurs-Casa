import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  PdfDocumentFooter,
  PdfDocumentHeader,
} from './PdfDocumentChrome.jsx'
import { pdfCardStyles, pdfPageStyles } from './PdfDocumentStyles.js'

const styles = StyleSheet.create({
  clientInformation: {
    marginBottom: 20,
  },
  clientInformationHeader: {
    justifyContent: 'space-between',
  },
  clientName: {
    width: '100%',
    padding: 12,
    color: '#0A2540',
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    borderBottomWidth: 0,
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
        <View style={[pdfCardStyles.card, styles.clientInformation]} wrap={false}>
          <View
            style={[pdfCardStyles.cardHeader, styles.clientInformationHeader]}
          >
            <Text style={pdfCardStyles.cardHeaderText}>INFORMATIONS DU CLIENT</Text>
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
          <Text style={styles.clientName}>{clientName}</Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={pdfCardStyles.card}>
            <View style={pdfCardStyles.cardHeader} wrap={false}>
              <Text style={pdfCardStyles.cardHeaderText}>{section.title}</Text>
            </View>
            {section.details.map(([label, value], index) => (
              <View
                key={label}
                style={[
                  pdfCardStyles.cardRow,
                  index % 2 === 1 ? pdfCardStyles.cardRowAlternate : null,
                  index === section.details.length - 1
                    ? pdfCardStyles.cardRowLast
                    : null,
                ]}
                wrap={false}
              >
                <Text style={pdfCardStyles.cardLabel}>{label}</Text>
                <Text style={pdfCardStyles.cardValue}>{value}</Text>
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