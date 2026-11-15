import { useState } from 'react'
import { AlertCircle, Download, LoaderCircle } from 'lucide-react'

export default function TablePdfExportButton({
  columns,
  filename,
  rows,
  title,
  label = 'Exporter PDF',
  disabled = false,
}) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  async function handleExport() {
    setIsExporting(true)
    setError('')

    try {
      const { generateTablePDF } = await import('../utils/tablePdf.js')
      await generateTablePDF({ title, filename, columns, rows })
    } catch (exportError) {
      console.error(`Erreur lors de l’export PDF « ${title} » :`, exportError)
      setError(
        exportError instanceof Error
          ? exportError.message
          : 'La génération du PDF a échoué. Veuillez réessayer.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        aria-label={`${label} : ${title}`}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || isExporting || rows.length === 0}
        onClick={() => void handleExport()}
        type="button"
      >
        {isExporting ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Download aria-hidden="true" className="h-4 w-4" />
        )}
        {isExporting ? 'Génération...' : label}
      </button>
      {error && (
        <p className="flex max-w-xs items-center gap-1 text-right text-xs text-red-700" role="alert">
          <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
