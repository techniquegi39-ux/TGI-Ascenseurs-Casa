import html2pdf from 'html2pdf.js'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

function toCellText(value) {
  if (value === undefined || value === null || value === '') {
    return '—'
  }

  if (typeof value?.toDate === 'function') {
    value = value.toDate()
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? '—'
      : new Intl.DateTimeFormat('fr-MA').format(value)
  }

  return String(value)
}

function sanitizeFilename(value) {
  const normalized = String(value || 'export')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${normalized || 'export'}.pdf`
}

function createTextElement(tagName, text, styles = {}) {
  const element = document.createElement(tagName)
  element.textContent = text
  Object.assign(element.style, styles)
  return element
}

async function loadCompanySettings() {
  const settingsSnapshot = await getDoc(doc(db, 'settings', 'company'))
  return settingsSnapshot.exists() ? settingsSnapshot.data() : {}
}

function createReportElement({ title, columns, rows, company }) {
  const report = document.createElement('main')
  Object.assign(report.style, {
    boxSizing: 'border-box',
    width: '277mm',
    minHeight: '180mm',
    padding: '12mm',
    backgroundColor: '#ffffff',
    color: '#23303d',
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt',
  })

  const header = document.createElement('header')
  Object.assign(header.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    paddingBottom: '14px',
    borderBottom: '2px solid #4682b4',
  })

  const logo = document.createElement('img')
  logo.alt = 'Logo TGI Ascenseurs Casa'
  Object.assign(logo.style, {
    width: '64px',
    height: '64px',
    objectFit: 'contain',
    borderRadius: '8px',
  })
  header.append(logo)

  const companyBlock = document.createElement('div')
  companyBlock.append(
    createTextElement('p', company.name || 'TGI ASCENSEURS CASA', {
      margin: '0',
      color: '#1e3a5f',
      fontSize: '16pt',
      fontWeight: '700',
    }),
  )

  const companyDetails = [company.address, company.phone, company.email]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' · ')
  if (companyDetails) {
    companyBlock.append(
      createTextElement('p', companyDetails, {
        margin: '5px 0 0',
        color: '#64748b',
        fontSize: '9pt',
      }),
    )
  }
  header.append(companyBlock)
  report.append(header)

  report.append(
    createTextElement('h1', title, {
      margin: '18px 0 5px',
      color: '#1e293b',
      fontSize: '18pt',
    }),
    createTextElement(
      'p',
      `Généré le ${new Intl.DateTimeFormat('fr-MA', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date())}`,
      { margin: '0 0 16px', color: '#64748b', fontSize: '9pt' },
    ),
  )

  const table = document.createElement('table')
  Object.assign(table.style, {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'auto',
    fontSize: '9pt',
  })
  const tableHead = document.createElement('thead')
  tableHead.style.display = 'table-header-group'
  const headRow = document.createElement('tr')
  for (const column of columns) {
    const cell = createTextElement('th', column.label, {
      padding: '9px 8px',
      backgroundColor: '#eaf2f8',
      border: '1px solid #cdd6dd',
      color: '#1e3a5f',
      textAlign: 'left',
      fontWeight: '700',
    })
    headRow.append(cell)
  }
  tableHead.append(headRow)
  table.append(tableHead)

  const tableBody = document.createElement('tbody')
  const reportRows = rows.length ? rows : [null]
  for (const row of reportRows) {
    const tableRow = document.createElement('tr')
    tableRow.style.pageBreakInside = 'avoid'
    columns.forEach((column, index) => {
      const value = row
        ? typeof column.value === 'function'
          ? column.value(row)
          : row[column.value]
        : index === 0
          ? 'Aucune donnée'
          : ''
      const cell = createTextElement('td', toCellText(value), {
        padding: '8px',
        border: '1px solid #cdd6dd',
        color: '#23303d',
        verticalAlign: 'top',
      })
      tableRow.append(cell)
    })
    tableBody.append(tableRow)
  }
  table.append(tableBody)
  report.append(table)

  report.append(
    createTextElement('p', 'TGI Manager Pro · Document généré automatiquement', {
      margin: '18px 0 0',
      color: '#64748b',
      fontSize: '8pt',
      textAlign: 'center',
    }),
  )

  return { report, logo }
}

export async function generateTablePDF({ title, filename, columns, rows }) {
  if (typeof title !== 'string' || !title.trim()) {
    throw new TypeError('Le titre du rapport est obligatoire.')
  }
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new TypeError('Le rapport doit contenir au moins une colonne.')
  }
  if (!Array.isArray(rows)) {
    throw new TypeError('Les lignes du rapport doivent être fournies sous forme de tableau.')
  }

  const company = await loadCompanySettings()
  const { report, logo } = createReportElement({
    title: title.trim(),
    columns,
    rows,
    company,
  })
  Object.assign(report.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    zIndex: '-1',
    pointerEvents: 'none',
  })
  document.body.append(report)

  try {
    const logoLoaded = new Promise((resolve, reject) => {
      logo.onload = resolve
      logo.onerror = () => reject(new Error('Le logo de l’entreprise n’a pas pu être chargé.'))
      logo.src = '/logo.png.jpeg'
      if (logo.complete) {
        if (logo.naturalWidth > 0) {
          resolve()
        } else {
          reject(new Error('Le logo de l’entreprise n’a pas pu être chargé.'))
        }
      }
    })
    await logoLoaded

    await html2pdf()
      .set({
        margin: [10, 10, 12, 10],
        filename: sanitizeFilename(filename || title),
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(report)
      .save()
  } finally {
    report.remove()
  }
}
