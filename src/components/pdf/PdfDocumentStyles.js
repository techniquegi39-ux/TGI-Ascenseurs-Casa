import { StyleSheet } from '@react-pdf/renderer'

export const pdfColors = {
  primary: '#0F172A',
  secondary: '#64748B',
  accent: '#1E3A8A',
  highlight: '#F59E0B',
  border: '#E2E8F0',
  tableRule: '#E2E8F0',
  tableRowAlternate: '#F1F5F9',
  tableHeader: '#1E3A8A',
  tableHeaderText: '#FFFFFF',
  tableHeaderBorder: '#1E3A8A',
}

export const pdfPageStyles = StyleSheet.create({
  page: {
    paddingTop: 150,
    paddingBottom: 90,
    paddingHorizontal: 40,
    backgroundColor: '#F8FAFC',
    color: pdfColors.primary,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
})
