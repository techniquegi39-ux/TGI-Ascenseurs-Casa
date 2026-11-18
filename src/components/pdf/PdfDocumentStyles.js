import { StyleSheet } from '@react-pdf/renderer'

export const pdfColors = {
  primary: '#0A2540',
  secondary: '#6B7280',
  accent: '#0A2540',
  highlight: '#F59E0B',
  border: '#E2E8F0',
  tableRule: '#E2E8F0',
  tableRowAlternate: '#F1F5F9',
  tableHeader: '#0A2540',
  tableHeaderText: '#FFFFFF',
  tableHeaderBorder: '#0A2540',
}

export const pdfPageStyles = StyleSheet.create({
  page: {
    paddingTop: 170,
    paddingBottom: 90,
    paddingHorizontal: 40,
    backgroundColor: '#F8FAFC',
    color: pdfColors.primary,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
})

export const pdfCardStyles = StyleSheet.create({
  card: {
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderTopWidth: 3,
    borderTopColor: '#F59E0B',
  },
  cardHeaderText: {
    color: '#0A2540',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardRow: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cardRowAlternate: {
    backgroundColor: '#F1F5F9',
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
