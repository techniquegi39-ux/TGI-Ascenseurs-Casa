import { StyleSheet } from '@react-pdf/renderer'

export const pdfColors = {
  primary: '#0F172A',
  secondary: '#64748B',
  accent: '#0284C7',
  border: '#E2E8F0',
  tableRule: '#F1F5F9',
  tableHeader: '#F8FAFC',
  tableHeaderBorder: '#CBD5E1',
}

export const pdfPageStyles = StyleSheet.create({
  page: {
    paddingTop: 140,
    paddingBottom: 100,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
    color: pdfColors.primary,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
})
