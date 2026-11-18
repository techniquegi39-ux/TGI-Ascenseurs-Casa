import { StyleSheet } from '@react-pdf/renderer'

export const pdfColors = {
  primary: '#1E1B4B',
  secondary: '#6B7280',
  accent: '#1E1B4B',
  highlight: '#D4AF37',
  border: '#E2E8F0',
  tableRule: '#E2E8F0',
  tableRowAlternate: '#F8FAFC',
  tableHeader: '#1E1B4B',
  tableHeaderText: '#FFFFFF',
  tableHeaderBorder: '#1E1B4B',
}

export const pdfPageStyles = StyleSheet.create({
  page: {
    paddingTop: 220,
    paddingBottom: 130,
    paddingHorizontal: 40,
    backgroundColor: '#FAFAFA',
    color: pdfColors.primary,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
})

export const pdfTableStyles = StyleSheet.create({
  table: {
    width: '100%',
    minWidth: 0,
  },
  row: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
  },
  cell: {
    minWidth: 0,
    flexShrink: 0,
    overflow: 'hidden',
  },
  cellText: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
})

export const pdfCardStyles = StyleSheet.create({
  card: {
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 4,
    borderTopColor: '#D4AF37',
  },
  cardHeader: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  cardHeaderText: {
    color: pdfColors.primary,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardRow: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cardRowAlternate: {
    backgroundColor: pdfColors.tableRowAlternate,
  },
  cardRowLast: {
    borderBottomWidth: 0,
  },
  cardLabel: {
    width: '100%',
    color: '#94A3B8',
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardValue: {
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
    flexWrap: 'wrap',
    marginTop: 2,
    color: '#0F172A',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.3,
  },
})

export const pdfBadgeStyles = StyleSheet.create({
  badgeActive: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeTextActive: {
    color: '#166534',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeTextPending: {
    color: '#B45309',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  badgeInactive: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeTextInactive: {
    color: '#991B1B',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  badgeInfo: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeTextInfo: {
    color: '#1D4ED8',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
})
