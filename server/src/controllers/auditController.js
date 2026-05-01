const AuditLog   = require('../models/AuditLog')
const pool       = require('../config/db')
const asyncHandler = require('../utils/asyncHandler')

// UC-16 — PIC/Audit: view audit log with optional filters
// GET /api/audit-log?subjectId=&sectionId=&action=&from=&to=
exports.getAuditLog = asyncHandler(async (req, res) => {
  const { subjectId, sectionId, action, from, to } = req.query
  const rows = await AuditLog.find({ subjectId, sectionId, action, from, to })
  res.json(rows)
})

// Audit/PIC: export completion report as CSV
// GET /api/dashboard/export
exports.exportReport = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT
       sub.code, sub.name AS subjectName,
       sec.sectionNumber, sec.deadline,
       COUNT(DISTINCT sf.id)                                              AS totalSubfolders,
       COUNT(DISTINCT CASE WHEN sf.isCompleted = 1 THEN sf.id END)       AS completed,
       CASE
         WHEN COUNT(DISTINCT sf.id) = 0 THEN 'N/A'
         WHEN COUNT(DISTINCT CASE WHEN sf.isCompleted = 1 THEN sf.id END) = COUNT(DISTINCT sf.id) THEN 'Complete'
         WHEN sec.deadline IS NOT NULL AND NOW() > sec.deadline THEN 'Overdue'
         ELSE 'Incomplete'
       END AS status
     FROM SUBJECT sub
     JOIN SECTION sec  ON sec.subjectId = sub.id
     LEFT JOIN SUBFOLDER sf ON sf.sectionId = sec.id
     GROUP BY sub.id, sec.id
     ORDER BY sub.code, sec.sectionNumber`
  )
  const header  = 'Subject Code,Subject Name,Section,Deadline,Total Subfolders,Completed,Status\n'
  const csvBody = rows.map(r =>
    [r.code, r.subjectName, r.sectionNumber, r.deadline ?? '', r.totalSubfolders, r.completed, r.status].join(',')
  ).join('\n')
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="completion-report.csv"')
  res.send(header + csvBody)
})
