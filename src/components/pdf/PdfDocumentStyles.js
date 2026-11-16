import { StyleSheet } from '@react-pdf/renderer'

export const pdfColors = {
  primary: '#0A2540',
  secondary: '#6B7280',
  accent: '#0A2540',
  highlight: '#F59E0B',
  border: '#E5E7EB',
  tableRule: '#F3F4F6',
  tableRowAlternate: '#F1F5F9',
  tableHeader: '#0A2540',
  tableHeaderText: '#FFFFFF',
  tableHeaderBorder: '#0A2540',
}

export const pdfPageStyles = StyleSheet.create({
  page: {
    paddingTop: 150,
    paddingBottom: 90,
    paddingHorizontal: 40,
    backgroundColor: '#F3F4F6',
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 5,
    borderLeftColor: '#F59E0B',
  },
  cardHeaderText: {
    color: '#0A2540',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardRow: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  cardRowAlternate: {
    backgroundColor: '#F1F5F9',
  },
  cardRowLast: {
    borderBottomWidth: 0,
  },
  cardLabel: {
    width: '40%',
    paddingRight: 10,
    color: '#6B7280',
    fontSize: 9,
  },
  cardValue: {
    width: '60%',
    color: '#111827',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.3,
  },
})
