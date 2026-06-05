const ExcelJS    = require('exceljs')
const AuditLog   = require('../models/AuditLog')
const Comment    = require('../models/Comment')
const pool       = require('../config/db')
const asyncHandler = require('../utils/asyncHandler')

// UC-16 — PIC/Audit: view audit log with optional filters
// GET /api/audit-log?subjectId=&sectionId=&action=&from=&to=
exports.getAuditLog = asyncHandler(async (req, res) => {
  const { subjectId, sectionId, action, from, to } = req.query
  const rows = await AuditLog.find({ subjectId, sectionId, action, from, to })
  res.json(rows)
})

// ── colour palette for the workbook ──────────────────────────
const CLR = {
  navy:  'FF0F2A52',
  navy2: 'FF1B3A66',
  head:  'FFFFFFFF',
  band:  'FFEEF2F8',
  done:  'FF1E7F3C',
  miss:  'FFC0392B',
  amber: 'FFB8860B',
  link:  'FF0563C1',
  muted: 'FF9AA5B5',
  text:  'FF1A1A1A',
  // Per-role accent for comment column headers
  roleLecturer: 'FF1F5FA8',
  rolePIC:      'FFD7298B',
  roleAudit:    'FFB8860B',
}
const thinBorder = {
  top:    { style: 'thin', color: { argb: 'FFB9C4D6' } },
  left:   { style: 'thin', color: { argb: 'FFB9C4D6' } },
  bottom: { style: 'thin', color: { argb: 'FFB9C4D6' } },
  right:  { style: 'thin', color: { argb: 'FFB9C4D6' } },
}
const FIXED = ['Subject Code', 'Subject Name', 'Section', 'Lecturer Name', 'Lecturer Email', 'Deadline']

// Hyperlinks inside the Excel report point at our backend proxy:
//   GET /api/public/files/:fileId/download
// The proxy streams the Cloudinary file with a proper Content-Disposition
// header so the browser saves it with the real filename + extension.
function downloadProxyUrl(apiBase, fileId) {
  return `${apiBase}/api/public/files/${fileId}/download`
}

// Excel cells can only carry ONE hyperlink. When a subfolder has multiple
// files, clicking the cell opens this tiny HTML page that lists every file
// with an individual download button.
function subfolderListUrl(apiBase, subfolderId) {
  return `${apiBase}/api/public/subfolders/${subfolderId}/files`
}

function colLetter(n) {
  let s = ''
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26 }
  return s
}

/**
 * Build one worksheet. Trailing columns can be either:
 *   • single-value:  { header, valueFor(sec) -> descriptor }       (renders on row 0 only)
 *   • multi-value :  { header, valuesFor(sec) -> [descriptor,…] }  (one per row, blank past array end)
 * Sections expand to as many rows as the longest multi-value array for that section.
 */
function buildSheet(wb, { name, title, legend, trailingCols, sections, checklist, auditor, scope, cellFor, headerColors }) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 6 }] })
  const headers = [...FIXED, ...checklist, ...trailingCols.map(c => c.header)]
  const lastCol = headers.length
  const span = (r) => `A${r}:${colLetter(lastCol)}${r}`

  // Row 1 — title
  ws.mergeCells(span(1))
  const t = ws.getCell('A1')
  t.value = title
  t.font = { bold: true, size: 16, color: { argb: CLR.head } }
  t.alignment = { horizontal: 'center', vertical: 'middle' }
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR.navy } }
  ws.getRow(1).height = 30

  // Row 2 — auditor
  ws.mergeCells(span(2))
  const a = ws.getCell('A2')
  a.value = `Auditor:  ${auditor || '—'}`
  a.font = { bold: true, size: 11, color: { argb: CLR.navy } }
  a.alignment = { horizontal: 'left', vertical: 'middle' }
  a.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR.band } }
  ws.getRow(2).height = 20

  // Row 3 — generated/scope
  ws.mergeCells(span(3))
  const g = ws.getCell('A3')
  g.value = `Generated: ${new Date().toLocaleString('en-GB')}    |    Scope: ${scope}    |    Sections: ${sections.length}`
  g.font = { size: 9, italic: true, color: { argb: 'FF5C677D' } }
  g.alignment = { horizontal: 'left', vertical: 'middle' }
  g.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR.band } }
  ws.getRow(3).height = 16

  // Row 4 spacer
  ws.getRow(4).height = 6

  // Row 5 — legend
  ws.mergeCells(span(5))
  const lg = ws.getCell('A5')
  lg.value = legend
  lg.font = { size: 9, italic: true, color: { argb: 'FF5C677D' } }
  lg.alignment = { horizontal: 'left', vertical: 'middle' }
  ws.getRow(5).height = 16

  // Row 6 — column headers
  const headerRow = ws.getRow(6)
  headers.forEach((h, i) => {
    const c = headerRow.getCell(i + 1)
    c.value = h
    c.font = { bold: true, size: 12, color: { argb: CLR.head } }
    // Per-column header colour override (used for the 3 role comment columns)
    const fg = (headerColors && headerColors[i]) ? headerColors[i] : CLR.navy2
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fg } }
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    c.border = thinBorder
  })
  headerRow.height = 42

  // Column widths
  const widths = [
    14, 30, 9, 24, 30, 14,
    ...checklist.map(() => 22),
    ...trailingCols.map(c => c.width || 14),
  ]
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w })

  // ── Data ────────────────────────────────────────────────
  let rowIdx = 7
  sections.forEach((sec, secIdx) => {
    // Resolve each trailing col's values once
    const colData = trailingCols.map(tc => {
      if (tc.valuesFor) return tc.valuesFor(sec)       // multi-row col
      const v = tc.valueFor(sec)                        // single col
      return v === undefined || v === null ? [] : [v]
    })
    // Resolve each checklist cell once — cellFor may return a single descriptor
    // OR an array (for the "Uploaded Files" sheet, one entry per file in the
    // subfolder so each file gets its own clickable row).
    const checklistData = checklist.map(name => {
      const r = cellFor(sec, name)
      return Array.isArray(r) ? r : (r === undefined || r === null ? [] : [r])
    })
    const maxRows = Math.max(
      1,
      ...colData.map(a => a.length),
      ...checklistData.map(a => a.length),
    )
    const bandThisSection = (secIdx % 2 === 1)   // alternate per-section band

    for (let ri = 0; ri < maxRows; ri++) {
      const row = ws.getRow(rowIdx)
      const isFirst = ri === 0

      // Fixed cells — only on the first row of a section
      const fixedVals = isFirst ? [
        sec.subjectCode,
        sec.subjectName,
        sec.sectionNumber,
        sec.lecturerName  || '—',
        sec.lecturerEmail || '—',
        sec.deadline ? new Date(sec.deadline).toLocaleDateString('en-GB',
          { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      ] : ['', '', '', '', '', '']
      fixedVals.forEach((v, i) => {
        const c = row.getCell(i + 1)
        c.value = v
        c.font = { size: 12 }
        c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
        c.border = thinBorder
      })

      // Checklist cells — each cell can render multiple values across rows
      // (Sheet 2 uses this to show one file per row when a subfolder has many).
      checklist.forEach((nameKey, i) => {
        const c = row.getCell(FIXED.length + 1 + i)
        const data = checklistData[i]
        if (ri < data.length) {
          const d = data[ri]
          c.value = d.hyperlink ? { text: d.value, hyperlink: d.hyperlink } : d.value
          c.font = {
            size: d.size || 12,
            bold: !!d.bold,
            underline: !!d.hyperlink,
            color: { argb: d.color || CLR.text },
          }
          c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        } else {
          c.value = ''
          c.font = { size: 12 }
        }
        c.border = thinBorder
      })

      // Trailing cols
      trailingCols.forEach((tc, ti) => {
        const colIdx = FIXED.length + checklist.length + 1 + ti
        const cell = row.getCell(colIdx)
        const data = colData[ti]
        const isMultiCol = !!tc.valuesFor
        const showInRow = isMultiCol || isFirst
        if (showInRow && ri < data.length) {
          const d = data[ri]
          cell.value = d.value
          cell.font = {
            size: d.size || 12,
            bold: d.bold === undefined ? !isMultiCol : d.bold,
            color: { argb: d.color || 'FF5C677D' },
          }
          cell.alignment = {
            horizontal: tc.align || 'center',
            vertical:   'middle',
            wrapText:   true,
          }
        } else {
          cell.value = ''
          cell.font = { size: 12 }
        }
        cell.border = thinBorder
      })

      // Alternate section band
      if (bandThisSection) {
        for (let col = 1; col <= lastCol; col++) {
          const cell = row.getCell(col)
          if (!cell.fill || cell.fill.type !== 'pattern') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR.band } }
          }
        }
      }

      // Row height — grow based on the maximum number of text lines in any
      // cell in this row (line breaks from stacked files / stacked comments).
      let maxLines = 1
      checklistData.forEach(arr => {
        if (ri < arr.length && typeof arr[ri].value === 'string') {
          maxLines = Math.max(maxLines, arr[ri].value.split('\n').length)
        }
      })
      colData.forEach(arr => {
        if (ri < arr.length && typeof arr[ri].value === 'string') {
          maxLines = Math.max(maxLines, arr[ri].value.split('\n').length)
        }
      })
      row.height = Math.min(360, Math.max(28, maxLines * 16 + 12))
      rowIdx++
    }
  })

  if (sections.length === 0) {
    ws.mergeCells(span(7))
    const e = ws.getCell('A7')
    e.value = 'No sections found.'
    e.font = { italic: true, color: { argb: CLR.muted } }
    e.alignment = { horizontal: 'center' }
  }
  return ws
}

// Audit/PIC: export completion report as a formatted .xlsx (2 sheets)
// GET /api/dashboard/export   (optional ?subjectId=)
exports.exportReport = asyncHandler(async (req, res) => {
  const { subjectId } = req.query

  // 1. Sections + subject + lecturer
  let sectionSql = `
    SELECT sec.id AS sectionId, sec.sectionNumber, sec.deadline,
           sub.id AS subjectId, sub.code AS subjectCode, sub.name AS subjectName,
           u.fullName AS lecturerName, u.email AS lecturerEmail
    FROM SECTION sec
    JOIN SUBJECT sub ON sub.id = sec.subjectId
    LEFT JOIN USER u ON u.id = sec.lecturerId`
  const params = []
  if (subjectId) { sectionSql += ' WHERE sub.id = ?'; params.push(subjectId) }
  sectionSql += ' ORDER BY sub.code, sec.sectionNumber'
  const [sections] = await pool.query(sectionSql, params)

  // 2. Subfolders
  let subfolders = []
  if (sections.length) {
    const [sf] = await pool.query(
      'SELECT id, sectionId, name, isCompleted FROM SUBFOLDER WHERE sectionId IN (?) ORDER BY name ASC',
      [sections.map(s => s.sectionId)]
    )
    subfolders = sf
  }

  // 3. Comments grouped by section AND role
  const commentsByRole = {}    // sectionId -> { Lecturer:[], PIC:[], Audit:[] }
  sections.forEach(s => {
    commentsByRole[s.sectionId] = { Lecturer: [], PIC: [], Audit: [] }
  })
  if (sections.length) {
    const cmts = await Comment.findBySections(sections.map(s => s.sectionId))
    cmts.forEach(c => {
      const slot = commentsByRole[c.sectionId]
      if (slot && slot[c.authorRole]) {
        slot[c.authorRole].push(c)
      }
    })
  }

  // 4. Latest files per subfolder
  let files = []
  if (subfolders.length) {
    const [fr] = await pool.query(
      `SELECT f.id AS fileId, f.subfolderId, f.originalName, fv.url, fv.uploadedAt
       FROM FILE f
       JOIN FILEVERSION fv ON fv.fileId = f.id AND fv.isCurrent = 1
       WHERE f.subfolderId IN (?)
       ORDER BY fv.uploadedAt DESC`,
      [subfolders.map(s => s.id)]
    )
    files = fr
  }
  const filesBySf = {}
  files.forEach(f => {
    if (!filesBySf[f.subfolderId]) filesBySf[f.subfolderId] = []
    filesBySf[f.subfolderId].push(f)
  })

  const sfMap = {}
  subfolders.forEach(sf => {
    if (!sfMap[sf.sectionId]) sfMap[sf.sectionId] = {}
    sfMap[sf.sectionId][sf.name] = {
      isCompleted: sf.isCompleted,
      files:       filesBySf[sf.id] || [],
    }
  })

  const checklist = [...new Set(subfolders.map(s => s.name))]
    .sort((a, b) => a.localeCompare(b))

  const auditor = req.user.fullName || '—'
  const scope   = subjectId && sections[0] ? `${sections[0].subjectCode} only` : 'All subjects'
  // Build absolute base URL for file-download hyperlinks (Excel needs absolute URLs)
  const apiBase = `${req.protocol}://${req.get('host')}`

  // ── Build workbook ─────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SE Course File Management System'
  wb.created = new Date()

  // Three comment columns — one per role; multi-row when one role has several
  const commentCols = [
    { header: 'Comment (Lecturer)', role: 'Lecturer', headerColor: CLR.roleLecturer },
    { header: 'Comment (PIC)',      role: 'PIC',      headerColor: CLR.rolePIC      },
    { header: 'Comment (Audit)',    role: 'Audit',    headerColor: CLR.roleAudit    },
  ].map(c => ({
    header: c.header,
    width:  44,
    align:  'left',
    headerColor: c.headerColor,
    // All comments for this role stacked into ONE cell, separated by a blank
    // line so each comment is visually distinct. No expansion of rows.
    valueFor: (sec) => {
      const list = commentsByRole[sec.sectionId]?.[c.role] || []
      if (list.length === 0) return { value: '—', color: CLR.muted, bold: false }
      const stacked = list.map(cm => cm.body).join('\n\n')
      return { value: stacked, color: CLR.text, bold: false }
    },
  }))
  const commentHeaderColors = commentCols.map(c => c.headerColor)

  // Sheet 1 — Completion Status
  const sheet1Trailing = [
    {
      header: 'Status',
      valueFor: (sec) => {
        const map   = sfMap[sec.sectionId] || {}
        const names = Object.keys(map)
        const total = names.length
        const done  = names.filter(n => map[n].isCompleted === 1).length
        const overdue = sec.deadline && new Date() > new Date(sec.deadline)
        let status
        if (total === 0)             status = 'No subfolders'
        else if (done === total)     status = 'Complete'
        else if (overdue)            status = 'Overdue'
        else                         status = 'Incomplete'
        const colour = { Complete: CLR.done, Overdue: CLR.miss, Incomplete: CLR.amber }[status] || CLR.muted
        return { value: status, color: colour, bold: true }
      },
    },
    ...commentCols,
  ]
  const sheet1HeaderColors = [
    ...new Array(FIXED.length + checklist.length).fill(null),
    null,                              // Status uses default
    ...commentHeaderColors,            // 3 role colours
  ]
  buildSheet(wb, {
    name:   'Completion Status',
    title:  'COURSE DOCUMENTATION: COMPLETION STATUS',
    legend: 'Legend:   ✓ = subfolder complete      ✗ = subfolder incomplete      – = subfolder not present',
    sections, checklist, auditor, scope,
    cellFor: (sec, nameKey) => {
      const entry = (sfMap[sec.sectionId] || {})[nameKey]
      if (!entry)               return { value: '–', color: CLR.muted, size: 14 }
      if (entry.isCompleted === 1) return { value: '✓', color: CLR.done, bold: true, size: 16 }
      return { value: '✗', color: CLR.miss, bold: true, size: 16 }
    },
    trailingCols: sheet1Trailing,
    headerColors: sheet1HeaderColors,
  })

  // Sheet 2 — Uploaded Files
  const sheet2Trailing = [
    {
      header: 'Total Files',
      valueFor: (sec) => {
        const map   = sfMap[sec.sectionId] || {}
        const count = Object.keys(map).reduce((sum, n) => sum + map[n].files.length, 0)
        return { value: count, color: count > 0 ? CLR.navy : CLR.muted, bold: true }
      },
    },
    ...commentCols,
  ]
  buildSheet(wb, {
    name:   'Uploaded Files',
    title:  'COURSE DOCUMENTATION: UPLOADED FILES',
    legend: 'Each cell shows the latest uploaded file in that subfolder. Click a file name to open it.   – = no file uploaded',
    sections, checklist, auditor, scope,
    cellFor: (sec, nameKey) => {
      const entry = (sfMap[sec.sectionId] || {})[nameKey]
      if (!entry || entry.files.length === 0) return { value: '–', color: CLR.muted }
      const stacked = entry.files.map(f => f.originalName).join('\n')
      // Single file → direct download. Multiple files → tiny landing page
      // so every file is reachable (Excel allows only one hyperlink per cell).
      const link = entry.files.length === 1
        ? downloadProxyUrl(apiBase, entry.files[0].fileId)
        : subfolderListUrl(apiBase, entry.files[0].subfolderId)
      return { value: stacked, hyperlink: link, color: CLR.link }
    },
    trailingCols: sheet2Trailing,
    headerColors: sheet1HeaderColors,
  })

  // ── send ──────────────────────────────────────────────────
  const stamp = new Date().toISOString().split('T')[0]
  let fileName
  if (subjectId && sections[0]) {
    const safeCode = String(sections[0].subjectCode).replace(/[^A-Za-z0-9 _-]/g, '').trim()
    fileName = `${safeCode} Section Report.xlsx`
  } else {
    fileName = `Completion Report ${stamp}.xlsx`
  }
  res.setHeader('Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition',
    `attachment; filename="${fileName}"`)
  await wb.xlsx.write(res)
  res.end()
})
