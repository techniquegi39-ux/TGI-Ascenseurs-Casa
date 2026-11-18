import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  pdfBadgeStyles,
  pdfCardStyles,
  pdfColors,
} from './PdfDocumentStyles.js'

const { primary, secondary, accent, border } = pdfColors

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    paddingTop: 35,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: accent,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: pdfColors.highlight,
  },
  watermark: {
    position: 'absolute',
    top: 250,
    left: '15%',
    right: '15%',
    width: 400,
    opacity: 0.04,
    transform: 'rotate(-20deg)',
    zIndex: -1,
  },
  headerIdentity: {
    flex: 1,
    paddingRight: 10,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logo: {
    width: 150,
    height: 50,
    maxHeight: 50,
    objectFit: 'contain',
  },
  documentIdentity: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  documentTitle: {
    maxWidth: '100%',
    color: pdfColors.highlight,
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.05,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  documentTitleCompact: {
    fontSize: 21,
    letterSpacing: 1,
  },
  documentNumber: {
    marginTop: 2,
    color: '#CBD5E1',
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'right',
  },
  companyBlock: {
    width: '100%',
    marginTop: 8,
    alignItems: 'flex-start',
  },
  companyDetail: {
    maxWidth: '100%',
    color: '#94A3B8',
    fontSize: 8,
    lineHeight: 1.15,
    textAlign: 'left',
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
  clientDetailGrid: {
    marginTop: 8,
  },
  clientDetailGridRow: {
    flexDirection: 'row',
  },
  clientDetailCell: {
    width: '50%',
    paddingRight: 8,
    paddingBottom: 10,
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
  metaStatusValue: {
    width: '62%',
    alignItems: 'flex-end',
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
    borderTopWidth: 2,
    borderTopColor: pdfColors.highlight,
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
  const address = getText(companyInfo, 'address', 'adresse')
  const phone = getText(companyInfo, 'phone', 'telephone', 'téléphone')
  const email = getText(companyInfo, 'email')
  const ice = getText(companyInfo, 'ice')
  const rc = getText(companyInfo, 'rc')
  const taxId = getText(companyInfo, 'identifiantFiscal', 'if', 'taxId')
  const patente = getText(companyInfo, 'patente')

  return [
    address,
    [phone && `Tél. : ${phone}`, email && `Email : ${email}`].filter(Boolean).join(' · '),
    [
      ice && `ICE : ${ice}`,
      rc && `RC : ${rc}`,
      taxId && `IF : ${taxId}`,
      patente && `Patente : ${patente}`,
    ]
      .filter(Boolean)
      .join(' · '),
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

function getStatusBadgeStyles(value) {
  const status = String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')

  if (status.includes('attente') || status.includes('pending')) {
    return [pdfBadgeStyles.badgePending, pdfBadgeStyles.badgeTextPending]
  }
  if (
    status.includes('cloture') ||
    status.includes('closed') ||
    status.includes('finalise')
  ) {
    return [pdfBadgeStyles.badgeInfo, pdfBadgeStyles.badgeTextInfo]
  }
  if (
    status.includes('inactif') ||
    status.includes('inactive') ||
    status.includes('desactiv') ||
    status.includes('disabled') ||
    status.includes('annul') ||
    status.includes('refus') ||
    status === 'false' ||
    status === 'non'
  ) {
    return [pdfBadgeStyles.badgeInactive, pdfBadgeStyles.badgeTextInactive]
  }
  if (
    status.includes('actif') ||
    status.includes('active') ||
    status.includes('paye') ||
    status.includes('regle') ||
    status.includes('valide') ||
    status.includes('termine') ||
    status.includes('complete') ||
    status.includes('success') ||
    status.includes('livre') ||
    status === 'true' ||
    status === 'oui'
  ) {
    return [pdfBadgeStyles.badgeActive, pdfBadgeStyles.badgeTextActive]
  }
  return [pdfBadgeStyles.badgeInfo, pdfBadgeStyles.badgeTextInfo]
}

function isStatusLabel(label) {
  const normalizedLabel = String(label || '').trim().toLocaleLowerCase('fr-FR')
  return normalizedLabel === 'statut' || normalizedLabel === 'status'
}

function getClientDetailRows(clientDetails) {
  const fields = clientDetails.map((detail) => {
    if (Array.isArray(detail)) {
      return [String(detail[0] || 'Information'), String(detail[1] || '').trim()]
    }

    const text = String(detail)
    const separatorIndex = text.indexOf(':')
    return separatorIndex === -1
      ? ['Information', text.trim()]
      : [text.slice(0, separatorIndex).trim(), text.slice(separatorIndex + 1).trim()]
  })
  const rows = []

  for (let index = 0; index < fields.length; index += 2) {
    rows.push(fields.slice(index, index + 2))
  }

  return rows
}

export function PdfStatusBadge({ value }) {
  const [badgeStyle, textStyle] = getStatusBadgeStyles(value)

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{value || '—'}</Text>
    </View>
  )
}

export function PdfDocumentHeader({ companyInfo = {}, documentTitle }) {
  const { type, number } = splitDocumentTitle(documentTitle)
  const logoSource = companyInfo.companyLogoBase64 || '/logo.png.jpeg'

  return (
    <>
      <Image fixed src={logoSource} style={styles.watermark} />
      <View fixed style={styles.header}>
        <View style={styles.headerIdentity}>
          <Image src={logoSource} style={styles.logo} />
          <View style={styles.companyBlock}>
            {getCompanyHeaderDetails(companyInfo).map((detail, index) => (
              <Text key={`${detail}-${index}`} style={styles.companyDetail}>
                {detail}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.documentIdentity}>
          <Text
            style={[
              styles.documentTitle,
              type.length > 14 ? styles.documentTitleCompact : null,
            ]}
            wrap={false}
          >
            {type}
          </Text>
          {number ? <Text style={styles.documentNumber}>{number}</Text> : null}
        </View>
      </View>
      <View fixed style={styles.topAccent} />
    </>
  )
}

export function PdfClientSummary({ clientName, clientDetails = [], metaRows = [] }) {
  const detailRows = getClientDetailRows(clientDetails)

  return (
    <View style={styles.clientSummary}>
      <View style={styles.clientBlock}>
        <Text style={styles.sectionLabel}>ÉTABLI POUR :</Text>
        <Text style={styles.clientName}>{clientName}</Text>
        {detailRows.length > 0 && (
          <View style={styles.clientDetailGrid}>
            {detailRows.map((row, rowIndex) => (
              <View
                key={`client-detail-row-${rowIndex}`}
                style={styles.clientDetailGridRow}
                wrap={false}
              >
                {row.map(([label, value]) => (
                  <View key={`${label}-${value}`} style={styles.clientDetailCell}>
                    <Text style={pdfCardStyles.cardLabel}>{label}</Text>
                    <Text style={pdfCardStyles.cardValue}>{value || '—'}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.metaTable}>
        {metaRows.map(({ label, value }, index) => {
          const isStatus = isStatusLabel(label)

          return (
            <View
              key={`${label}-${index}`}
              style={[
                styles.metaRow,
                index === metaRows.length - 1 ? styles.metaRowLast : null,
              ]}
            >
              <Text style={styles.metaLabel}>{label}</Text>
              {isStatus ? (
                <View style={styles.metaStatusValue}>
                  <PdfStatusBadge value={value} />
                </View>
              ) : (
                <Text style={styles.metaValue}>{value || '—'}</Text>
              )}
            </View>
          )
        })}
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
