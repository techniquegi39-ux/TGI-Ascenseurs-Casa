import {
  Image,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'
import {
  pdfBadgeStyles,
  pdfCardStyles,
  pdfColors,
  pdfHeaderStyles,
} from './PdfDocumentStyles.js'
import {
  breakLongTextAtCharacters,
  isPdfFieldFullWidth,
} from './pdfTextUtils.js'

const { primary, secondary, accent, border } = pdfColors

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    paddingTop: 38,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 200,
  },
  watermark: {
    position: 'absolute',
    top: '35%',
    left: '15%',
    width: '70%',
    opacity: 0.04,
    transform: 'rotate(-15deg)',
    zIndex: -1,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: pdfColors.highlight,
  },
  headerIdentity: {
    width: 210,
    flexGrow: 0,
    flexShrink: 0,
    paddingRight: 10,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logo: {
    width: 200,
    height: 75,
    maxHeight: 75,
    objectFit: 'contain',
    objectPosition: 'left center',
    marginLeft: 0,
    paddingLeft: 0,
  },
  documentIdentity: {
    position: 'absolute',
    top: 100,
    right: 40,
    width: 350,
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  documentTitle: {
    maxWidth: '100%',
    color: pdfColors.highlight,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.05,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  documentTitleCompact: {
    letterSpacing: 1,
  },
  documentNumber: {
    marginTop: 2,
    color: '#CBD5E1',
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'right',
  },
  certificationBadge: {
    position: 'absolute',
    top: 30,
    right: 40,
    borderWidth: 0.7,
    borderColor: pdfColors.highlight,
    borderRadius: 3,
  },
  certificationIcon: {
    width: 13,
    height: 13,
    marginRight: 5,
  },
  certificationText: {
    color: pdfColors.highlight,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    flexWrap: 'nowrap',
  },
  companyBlock: {
    width: '100%',
    marginTop: 8,
    alignItems: 'flex-start',
  },
  companyDetail: {
    maxWidth: '100%',
    flexShrink: 1,
    flexWrap: 'wrap',
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
    padding: 15,
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
    flexWrap: 'wrap',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  clientDetailGridRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  clientDetailGridRowFullWidth: {
    marginBottom: 0,
    paddingBottom: 0,
  },
  clientDetailCell: {
    width: '50%',
    paddingRight: 20,
  },
  clientDetailCellFullWidth: {
    width: '100%',
    marginBottom: 12,
  },
  dataLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataLabelIcon: {
    width: 10,
    height: 10,
    minWidth: 10,
    minHeight: 10,
    marginRight: 6,
    flexShrink: 0,
  },
  dataLabelText: {
    width: 'auto',
    flexGrow: 1,
    flexShrink: 1,
    marginTop: 0,
  },
  metaTable: {
    width: '30%',
    padding: 15,
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
    maxWidth: '100%',
    flexShrink: 1,
    flexWrap: 'wrap',
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
    height: 100,
    paddingHorizontal: 40,
    paddingTop: 10,
    backgroundColor: accent,
    borderTopWidth: 2,
    borderTopColor: pdfColors.highlight,
  },
  footerColumns: {
    flexDirection: 'row',
    width: '100%',
  },
  footerColumn: {
    flex: 1,
    paddingHorizontal: 8,
    borderRightWidth: 0.5,
    borderRightColor: '#475569',
  },
  footerColumnLast: {
    borderRightWidth: 0,
    paddingRight: 0,
  },
  footerColumnFirst: {
    paddingLeft: 0,
  },
  footerHeading: {
    marginBottom: 3,
    color: '#F8FAFC',
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  footerHeadingBank: {
    color: pdfColors.highlight,
  },
  footerContactText: {
    maxWidth: '100%',
    flexShrink: 1,
    flexWrap: 'wrap',
    marginTop: 1,
    color: '#F8FAFC',
    fontSize: 6,
    lineHeight: 1.15,
  },
  footerLegalText: {
    maxWidth: '100%',
    flexShrink: 1,
    flexWrap: 'wrap',
    marginTop: 1,
    color: '#94A3B8',
    fontSize: 6,
    lineHeight: 1.15,
  },
  footerBankText: {
    maxWidth: '100%',
    flexShrink: 1,
    flexWrap: 'wrap',
    marginTop: 1,
    color: pdfColors.highlight,
    fontSize: 6,
    lineHeight: 1.15,
  },
  footerPage: {
    position: 'absolute',
    right: 40,
    bottom: 6,
    color: '#CBD5E1',
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  signatures: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '48%',
    minHeight: 100,
    padding: 11,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
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
    borderBottomColor: '#CBD5E1',
  },
  signatureStamp: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 7,
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
      const label = String(detail[0] || 'Information')
      const value = String(detail[1] || '').trim()
      return [label, value, detail[2] === true || isPdfFieldFullWidth(label, value)]
    }

    const text = String(detail)
    const separatorIndex = text.indexOf(':')
    const label =
      separatorIndex === -1 ? 'Information' : text.slice(0, separatorIndex).trim()
    const value = separatorIndex === -1 ? text.trim() : text.slice(separatorIndex + 1).trim()
    return [label, value, isPdfFieldFullWidth(label, value)]
  })
  const rows = []
  let currentRow = []

  for (const field of fields) {
    if (field[2]) {
      if (currentRow.length > 0) {
        rows.push(currentRow)
        currentRow = []
      }
      rows.push([field])
      continue
    }

    currentRow.push(field)
    if (currentRow.length === 2) {
      rows.push(currentRow)
      currentRow = []
    }
  }

  if (currentRow.length > 0) rows.push(currentRow)
  return rows
}

function getDataIconPath(label) {
  const normalizedLabel = String(label || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')

  if (
    normalizedLabel.includes('adresse') ||
    normalizedLabel.includes('ville') ||
    normalizedLabel.includes('maps') ||
    normalizedLabel.includes('gps') ||
    normalizedLabel.includes('lieu')
  ) {
    return 'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0ZM12 10a2.5 2.5 0 1 0 0-.01Z'
  }
  if (normalizedLabel.includes('telephone') || normalizedLabel.includes('tel')) {
    return 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3.2a2 2 0 0 1-.6 1.7L7.7 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 1.7-.6l3.2.5a2 2 0 0 1 1.7 2.4Z'
  }
  if (normalizedLabel.includes('email') || normalizedLabel.includes('e-mail')) {
    return 'M3 5h18v14H3zM3 6l9 7 9-7'
  }
  if (
    normalizedLabel.includes('syndic') ||
    normalizedLabel.includes('concierge') ||
    normalizedLabel.includes('representant') ||
    normalizedLabel.includes('contact') ||
    normalizedLabel.includes('client') ||
    normalizedLabel.includes('nom')
  ) {
    return 'M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'
  }
  return 'M4 21h16M6 21V7l6-4 6 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01'
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
      <Svg fixed style={styles.headerGradient} viewBox="0 0 595 200">
        <Defs>
          <LinearGradient id="tgi-header-gradient" x1={0} y1={0} x2={1} y2={0}>
            <Stop offset="0%" stopColor="#0F172A" />
            <Stop offset="60%" stopColor="#0B1120" />
            <Stop offset="100%" stopColor="#020617" />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="595"
          height="200"
          fill="url(#tgi-header-gradient)"
        />
      </Svg>
      <View fixed style={styles.header}>
        <View style={styles.headerIdentity}>
          <Image src={logoSource} style={styles.logo} />
          <View style={styles.companyBlock}>
            {getCompanyHeaderDetails(companyInfo).map((detail, index) => (
              <Text
                key={`${detail}-${index}`}
                style={styles.companyDetail}
                hyphenationCallback={breakLongTextAtCharacters}
              >
                {detail}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.documentIdentity}>
          <Text
            style={[
              pdfHeaderStyles.documentTitle,
              styles.documentTitle,
              type.length > 14 ? styles.documentTitleCompact : null,
            ]}
            wrap={false}
          >
            {type}
          </Text>
          {number ? <Text style={styles.documentNumber}>{number}</Text> : null}
        </View>
        <View style={[pdfHeaderStyles.certificationBadge, styles.certificationBadge]}>
          <Svg viewBox="0 0 24 24" style={styles.certificationIcon}>
            <Path
              d="M12 2 20 5v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5l8-3Z"
              fill="none"
              stroke={pdfColors.highlight}
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.certificationText} wrap={false}>
            DOCUMENT TGI ASCENSEURS
          </Text>
        </View>
      </View>
      <View fixed style={styles.topAccent} />
    </>
  )
}

export function PdfClientSummary({ clientName, clientDetails = [], metaRows = [] }) {
  const detailRows = getClientDetailRows(clientDetails)

  return (
    <View style={styles.clientSummary} wrap={false}>
      <View style={styles.clientBlock}>
        <Text style={styles.sectionLabel}>ÉTABLI POUR :</Text>
        <Text style={styles.clientName}>{clientName}</Text>
        {detailRows.length > 0 && (
          <View style={styles.clientDetailGrid}>
            {detailRows.map((row, rowIndex) => (
              <View
                key={`client-detail-row-${rowIndex}`}
                style={[
                  styles.clientDetailGridRow,
                  row.length === 1 && row[0][2]
                    ? styles.clientDetailGridRowFullWidth
                    : null,
                  rowIndex === detailRows.length - 1
                    ? styles.clientDetailGridRowLast
                    : null,
                ]}
                wrap={false}
              >
                {row.map(([label, value, fullWidth]) => (
                  <View
                    key={`${label}-${value}`}
                    style={[
                      styles.clientDetailCell,
                      fullWidth ? styles.clientDetailCellFullWidth : null,
                    ]}
                  >
                    <PdfDataLabel label={label} />
                    <Text
                      style={pdfCardStyles.cardValue}
                      hyphenationCallback={breakLongTextAtCharacters}
                    >
                      {value || '—'}
                    </Text>
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
              wrap={false}
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

export function PdfDataLabel({ label }) {
  return (
    <View style={styles.dataLabelRow}>
      <Svg viewBox="0 0 24 24" style={styles.dataLabelIcon}>
        <Path
          d={getDataIconPath(label)}
          fill="none"
          stroke={pdfColors.highlight}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={[pdfCardStyles.cardLabel, styles.dataLabelText]}>{label}</Text>
    </View>
  )
}

export function PdfDocumentFooter({
  companyName,
  companyInfo = {},
  legalDetails = {},
}) {
  const contactLines = [
    getText(companyInfo, 'phone', 'telephone', 'téléphone')
      ? `Tél. : ${getText(companyInfo, 'phone', 'telephone', 'téléphone')}`
      : '',
    getText(companyInfo, 'email') ? `Email : ${getText(companyInfo, 'email')}` : '',
    getText(companyInfo, 'address', 'adresse'),
  ].filter(Boolean)
  const legalLines = [
    ...(legalDetails.registrations || []),
    ...(legalDetails.legal || []),
  ].filter(Boolean)
  const bankLines = [
    ...(legalDetails.banking || []),
  ]

  return (
    <View fixed style={styles.footer}>
      <View style={styles.footerColumns}>
        <View style={[styles.footerColumn, styles.footerColumnFirst]}>
          <Text style={styles.footerHeading}>CONTACT</Text>
          {companyName ? (
            <Text
              style={styles.footerContactText}
              hyphenationCallback={breakLongTextAtCharacters}
            >
              {companyName}
            </Text>
          ) : null}
          {contactLines.map((line, index) => (
            <Text
              key={`contact-${index}`}
              style={styles.footerContactText}
              hyphenationCallback={breakLongTextAtCharacters}
            >
              {line}
            </Text>
          ))}
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.footerHeading}>INFORMATIONS LÉGALES</Text>
          {legalLines.map((line, index) => (
            <Text
              key={`legal-${index}`}
              style={styles.footerLegalText}
              hyphenationCallback={breakLongTextAtCharacters}
            >
              {line}
            </Text>
          ))}
        </View>
        <View style={[styles.footerColumn, styles.footerColumnLast]}>
          <Text style={[styles.footerHeading, styles.footerHeadingBank]}>
            COORDONNÉES BANCAIRES
          </Text>
          {bankLines.map((line, index) => (
            <Text
              key={`bank-${index}`}
              style={styles.footerBankText}
              hyphenationCallback={breakLongTextAtCharacters}
            >
              {line}
            </Text>
          ))}
        </View>
      </View>
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
        <Text style={styles.signatureStamp}>Visa et Cachet TGI ASCENSEURS</Text>
      </View>
    </View>
  )
}
