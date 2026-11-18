import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  PdfDocumentFooter,
  PdfDocumentHeader,
  PdfStatusBadge,
} from './PdfDocumentChrome.jsx'
import { pdfCardStyles, pdfPageStyles } from './PdfDocumentStyles.js'

const styles = StyleSheet.create({
  clientInformation: {
    marginBottom: 20,
  },
  clientInformationHeader: {
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
  },
  clientName: {
    width: '100%',
    padding: 12,
    color: '#0A2540',
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    borderBottomWidth: 0,
  },
  detailGrid: {
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  detailGridRow: {
    flexDirection: 'row',
  },
  detailCell: {
    width: '50%',
    marginBottom: 12,
    paddingHorizontal: 8,
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

function getClientStatus(client) {
  const status = client.active ?? client.actif ?? client.status ?? client.statut

  if (typeof status === 'boolean') {
    return status ? 'Actif' : 'Inactif'
  }

  if (typeof status === 'string') {
    const normalizedStatus = status
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr-FR')

    if (normalizedStatus.includes('attente') || normalizedStatus.includes('pending')) {
      return 'En attente'
    }
    if (
      normalizedStatus.includes('inactif') ||
      normalizedStatus.includes('inactive') ||
      normalizedStatus.includes('desactiv') ||
      normalizedStatus.includes('disabled') ||
      normalizedStatus.includes('annul') ||
      normalizedStatus.includes('refus') ||
      normalizedStatus === 'false' ||
      normalizedStatus === 'non'
    ) {
      return 'Inactif'
    }
    if (
      normalizedStatus.includes('actif') ||
      normalizedStatus.includes('active') ||
      normalizedStatus.includes('paye') ||
      normalizedStatus.includes('regle') ||
      normalizedStatus.includes('valide') ||
      normalizedStatus.includes('termine') ||
      normalizedStatus === 'true' ||
      normalizedStatus === 'oui'
    ) {
      return 'Actif'
    }
    if (normalizedStatus) {
      return status.trim()
    }
  }

  return 'Actif'
}

function getDetailRows(details) {
  const rows = []
  for (let index = 0; index < details.length; index += 2) {
    rows.push(details.slice(index, index + 2))
  }
  return rows
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
  const clientStatus = getClientStatus(client)

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
            <PdfStatusBadge value={clientStatus} />
          </View>
          <Text style={styles.clientName}>{clientName}</Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={pdfCardStyles.card}>
            <View style={pdfCardStyles.cardHeader} wrap={false}>
              <Text style={pdfCardStyles.cardHeaderText}>{section.title}</Text>
            </View>
            <View style={styles.detailGrid}>
              {getDetailRows(section.details).map((row, rowIndex) => (
                <View
                  key={`${section.title}-row-${rowIndex}`}
                  style={styles.detailGridRow}
                  wrap={false}
                >
                  {row.map(([label, value]) => (
                    <View key={label} style={styles.detailCell}>
                      <Text style={pdfCardStyles.cardLabel}>{label}</Text>
                      <Text style={pdfCardStyles.cardValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
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