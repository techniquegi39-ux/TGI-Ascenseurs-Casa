import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'
import { pdfColors } from './PdfDocumentStyles.js'

const { primary, secondary, accent, border } = pdfColors

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 130,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: accent,
  },
  headerIdentity: {
    width: '58%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoFrame: {
    width: 118,
    height: 48,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  logo: {
    width: 108,
    height: 38,
    objectFit: 'contain',
    objectPosition: 'left',
  },
  documentTitle: {
    maxWidth: '100%',
    marginTop: 5,
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.05,
    textTransform: 'uppercase',
  },
  documentNumber: {
    marginTop: 2,
    color: '#CBD5E1',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  companyBlock: {
    width: '39%',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  companyName: {
    marginBottom: 3,
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  companyDetail: {
    maxWidth: '100%',
    marginTop: 1,
    color: '#E2E8F0',
    fontSize: 7.5,
    lineHeight: 1.4,
    textAlign: 'right',
  },
  clientSummary: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientBlock: {
    width: '68%',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: border,
    borderRadius: 4,
  },
  sectionLabel: {
    marginBottom: 6,
    color: secondary,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clientName: {
    marginBottom: 3,
    color: accent,
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
  },
  clientDetail: {
    marginTop: 2,
    color: secondary,
    fontSize: 8.5,
    lineHeight: 1.25,
  },
  metaTable: {
    width: '30%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: border,
    borderLeftWidth: 3,
    borderLeftColor: accent,
    borderRadius: 4,
  },
  metaRow: {
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: border,
  },
  metaRowLast: {
    borderBottomWidth: 0,
  },
  metaLabel: {
    width: '38%',
    color: secondary,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
  },
  metaValue: {
    width: '62%',
    color: primary,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    paddingHorizontal: 40,
    paddingTop: 8,
    alignItems: 'center',
    backgroundColor: accent,
  },
  footerCompany: {
    marginBottom: 2,
    color: '#FFFFFF',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  footerText: {
    marginTop: 1,
    color: '#FFFFFF',
    fontSize: 6.5,
    lineHeight: 1.15,
    textAlign: 'center',
  },
  footerPage: {
    marginTop: 3,
    color: '#FFFFFF',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  signatures: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '48%',
    minHeight: 92,
    padding: 11,
    borderWidth: 1,
    borderColor: border,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  signatureTitle: {
    marginBottom: 4,
    color: primary,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  signatureHint: {
    color: secondary,
    fontSize: 7,
  },
  signatureLine: {
    height: 34,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.tableHeaderBorder,
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

function getCompanyHeaderDetails(companyInfo) {
  return [
    getText(companyInfo, 'address', 'adresse'),
    getText(companyInfo, 'phone', 'telephone', 'téléphone')
      ? `Tél. : ${getText(companyInfo, 'phone', 'telephone', 'téléphone')}`
      : '',
    getText(companyInfo, 'email') ? `Email : ${getText(companyInfo, 'email')}` : '',
    getText(companyInfo, 'ice') ? `ICE : ${getText(companyInfo, 'ice')}` : '',
    getText(companyInfo, 'rc') ? `RC : ${getText(companyInfo, 'rc')}` : '',
    getText(companyInfo, 'identifiantFiscal', 'if', 'taxId')
      ? `IF : ${getText(companyInfo, 'identifiantFiscal', 'if', 'taxId')}`
      : '',
    getText(companyInfo, 'patente') ? `Patente : ${getText(companyInfo, 'patente')}` : '',
  ].filter(Boolean)
}

function splitDocumentTitle(documentTitle) {
  const title = String(documentTitle || 'Document').trim()
  const match = /^(.*\S)\s+([A-Z]{1,8}[-/][A-Z0-9./_-]+)$/i.exec(title)

  if (!match) {
    return { type: title, number: '' }
  }

  return { type: match[1], number: match[2] }
}

export function PdfDocumentHeader({ companyInfo = {}, companyName, documentTitle }) {
  const { type, number } = splitDocumentTitle(documentTitle)

  return (
    <View fixed style={styles.header}>
      <View style={styles.headerIdentity}>
        <View style={styles.logoFrame}>
          <Image
            src={companyInfo.companyLogoBase64 || '/logo.png.jpeg'}
            style={styles.logo}
          />
        </View>
        <Text style={styles.documentTitle}>{type}</Text>
        {number ? <Text style={styles.documentNumber}>{number}</Text> : null}
      </View>
      <View style={styles.companyBlock}>
        <Text style={styles.companyName}>{companyName}</Text>
        {getCompanyHeaderDetails(companyInfo).map((detail, index) => (
          <Text key={`${detail}-${index}`} style={styles.companyDetail}>
            {detail}
          </Text>
        ))}
      </View>
    </View>
  )
}

export function PdfClientSummary({ clientName, clientDetails = [], metaRows = [] }) {
  return (
    <View style={styles.clientSummary}>
      <View style={styles.clientBlock}>
        <Text style={styles.sectionLabel}>ÉTABLI POUR :</Text>
        <Text style={styles.clientName}>{clientName}</Text>
        {clientDetails.map((detail, index) => (
          <Text key={`${detail}-${index}`} style={styles.clientDetail}>
            {detail}
          </Text>
        ))}
      </View>
      <View style={styles.metaTable}>
        {metaRows.map(({ label, value }, index) => (
          <View
            key={`${label}-${index}`}
            style={[styles.metaRow, index === metaRows.length - 1 ? styles.metaRowLast : null]}
          >
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={styles.metaValue}>{value || '—'}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export function PdfDocumentFooter({
  companyName,
  companyInfo = {},
  legalDetails = {},
}) {
  const contacts = [
    getText(companyInfo, 'phone', 'telephone', 'téléphone')
      ? `Tél. : ${getText(companyInfo, 'phone', 'telephone', 'téléphone')}`
      : '',
    getText(companyInfo, 'email') ? `Email : ${getText(companyInfo, 'email')}` : '',
  ].filter(Boolean)
  const legalLines = [
    ...(legalDetails.banking || []),
    ...(legalDetails.registrations || []),
    ...(legalDetails.legal || []),
  ]

  return (
    <View fixed style={styles.footer}>
      <Text style={styles.footerCompany}>{companyName}</Text>
      {contacts.length > 0 && (
        <Text style={styles.footerText}>{contacts.join(' · ')}</Text>
      )}
      {legalLines.length > 0 && (
        <Text style={styles.footerText}>{legalLines.join(' · ')}</Text>
      )}
      <Text
        fixed
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
        style={styles.footerPage}
      />
    </View>
  )
}

export function PdfSignatures({
  clientLabel = 'LE CLIENT (Nom, date, signature et cachet)',
  companyLabel = 'TGI ASCENSEURS (Signature et cachet)',
  clientHint = '',
  companyHint = '',
}) {
  return (
    <View style={styles.signatures} wrap={false}>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureTitle}>{clientLabel}</Text>
        {clientHint ? <Text style={styles.signatureHint}>{clientHint}</Text> : null}
        <View style={styles.signatureLine} />
      </View>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureTitle}>{companyLabel}</Text>
        {companyHint ? <Text style={styles.signatureHint}>{companyHint}</Text> : null}
        <View style={styles.signatureLine} />
      </View>
    </View>
  )
}
