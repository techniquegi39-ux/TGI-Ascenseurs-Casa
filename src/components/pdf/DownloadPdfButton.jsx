import { useEffect, useMemo, useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { AlertCircle, Download, LoaderCircle } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'
import MasterPdfTemplate from './MasterPdfTemplate.jsx'

const EMPTY_ARRAY = []
const EMPTY_OBJECT = {}

function getFilename(documentTitle) {
  const filename = String(documentTitle || 'document')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${filename || 'document'}.pdf`
}

export default function DownloadPdfButton({
  documentTitle,
  data = EMPTY_ARRAY,
  columns = EMPTY_ARRAY,
  clientInfo = EMPTY_OBJECT,
  totals,
  date,
  notes,
  companyInfo: companyInfoOverride,
  disabled = false,
}) {
  const [companySettings, setCompanySettings] = useState({
    data: companyInfoOverride || null,
    loading: !companyInfoOverride,
    error: '',
  })
  const companyInfo = companyInfoOverride || companySettings.data || EMPTY_OBJECT
  const isLoadingCompany = companyInfoOverride ? false : companySettings.loading
  const companyError = companyInfoOverride ? '' : companySettings.error

  useEffect(() => {
    if (companyInfoOverride) {
      return undefined
    }

    let isMounted = true
    getDoc(doc(db, 'settings', 'company'))
      .then((snapshot) => {
        if (isMounted) {
          setCompanySettings({
            data: snapshot.exists() ? snapshot.data() : {},
            loading: false,
            error: '',
          })
        }
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des informations de l’entreprise pour le PDF :', error)
        if (isMounted) {
          setCompanySettings({
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? `Impossible de charger les informations de l’entreprise : ${error.message}`
                : 'Impossible de charger les informations de l’entreprise.',
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [companyInfoOverride])

  const document = useMemo(
    () => (
      <MasterPdfTemplate
        clientInfo={clientInfo}
        columns={columns}
        companyInfo={companyInfo}
        data={data}
        date={date}
        documentTitle={documentTitle}
        notes={notes}
        totals={totals}
      />
    ),
    [clientInfo, columns, companyInfo, data, date, documentTitle, notes, totals],
  )
  const isDisabled = disabled || isLoadingCompany || Boolean(companyError)

  return (
    <PDFDownloadLink
      aria-disabled={isDisabled}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-600/10 ${
        isDisabled ? 'pointer-events-none cursor-not-allowed opacity-60' : ''
      }`}
      document={document}
      fileName={getFilename(documentTitle)}
      onClick={(event) => {
        if (disabled || isLoadingCompany || companyError) {
          event.preventDefault()
        }
      }}
      style={{ textDecoration: 'none' }}
    >
      {({ loading, error }) => {
        if (error || companyError) {
          return (
            <span className="inline-flex items-center gap-2 text-red-700" role="alert">
              <AlertCircle aria-hidden="true" className="h-4 w-4" />
              {companyError || 'Erreur PDF'}
            </span>
          )
        }
        if (loading || isLoadingCompany) {
          return (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              Génération...
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-2">
            <Download aria-hidden="true" className="h-4 w-4" />
            Exporter PDF
          </span>
        )
      }}
    </PDFDownloadLink>
  )
}
