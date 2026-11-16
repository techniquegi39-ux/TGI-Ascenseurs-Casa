import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'

const NAVY = '#1E3A8A'
const MUTED = '#475569'
const BORDER = '#E2E8F0'

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 30,
    right: 30,
    height: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  headerIdentity: {
    width: '58%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logo: {
    width: 128,
    height: 55,
    objectFit: 'contain',
    objectPosition: 'left',
  },
  documentTitle: {
    maxWidth: '100%',
    marginTop: 4,
    color: '#0F172A',
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  companyBlock: {
    width: '39%',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  companyName: {
    marginBottom: 3,
    color: '#0F172A',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  companyDetail: {
    maxWidth: '100%',
    marginTop: 1,
    color: MUTED,
    fontSize: 7,
    lineHeight: 1.15,
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
    paddingRight: 12,
  },
  sectionLabel: {
    marginBottom: 6,
    color: '#64748B',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  clientName: {
    marginBottom: 3,
    color: '#0F172A',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  clientDetail: {
    marginTop: 2,
    color: MUTED,
    fontSize: 8,
    lineHeight: 1.25,
  },
  metaTable: {
    width: '30%',
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
  },
  metaRow: {
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  metaRowLast: {
    borderBottomWidth: 0,
  },
  metaLabel: {
    width: '38%',
    color: MUTED,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  metaValue: {
    width: '62%',
    color: '#0F172A',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 30,
    right: 30,
    height: 70,
    paddingTop: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  footerCompany: {
    marginBottom: 2,
    color: '#0F172A',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  footerText: {
    marginTop: 1,
    color: MUTED,
    fontSize: 6.5,
    lineHeight: 1.15,
    textAlign: 'center',
  },
  footerPage: {
    marginTop: 3,
    color: NAVY,
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
    borderColor: BORDER,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  signatureTitle: {
    marginBottom: 4,
    color: '#0F172A',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  signatureHint: {
    color: MUTED,
    fontSize: 7,
  },
  signatureLine: {
    height: 34,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
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

export function PdfDocumentHeader({ companyInfo = {}, companyName, documentTitle }) {
  return (
    <View fixed style={styles.header}>
      <View style={styles.headerIdentity}>
        <Image
          src={companyInfo.companyLogoBase64 || '/logo.png.jpeg'}
          style={styles.logo}
        />
        <Text style={styles.documentTitle}>{documentTitle}</Text>
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
        <Text style={styles.sectionLabel}>DOCUMENT ÉTABLI POUR</Text>
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
