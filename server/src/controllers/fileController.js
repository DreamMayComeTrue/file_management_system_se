const https         = require('https')
const fs            = require('fs')
const path          = require('path')
const pool          = require('../config/db')
const File          = require('../models/File')
const FileVersion   = require('../models/FileVersion')
const Section       = require('../models/Section')
const Subfolder     = require('../models/Subfolder')
const AuditLog      = require('../models/AuditLog')
const asyncHandler  = require('../utils/asyncHandler')
const cloudinarySvc = require('../services/cloudinaryService')

// Inline the app logo as a base64 data URI so the file-listing landing page
// renders the brand without needing the frontend to be reachable.
let LOGO_DATA_URI = ''
try {
  const logoPath = path.resolve(__dirname, '../../../client/public/logo.png')
  LOGO_DATA_URI = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
} catch (e) { /* logo missing — page renders without it */ }

// UC-08 — Upload initial file to a subfolder
// POST /api/subfolders/:subfolderId/files
exports.upload = asyncHandler(async (req, res) => {
  const { subfolderId } = req.params

  const subfolder = await Subfolder.findById(subfolderId)
  if (!subfolder) return res.status(404).json({ message: 'Subfolder not found' })

  const section = await Section.findById(subfolder.sectionId)
  if (!section) return res.status(404).json({ message: 'Section not found' })
  if (section.deadline && new Date() > new Date(section.deadline)) {
    return res.status(403).json({ message: 'Deadline has passed, uploads are blocked' })
  }

  const fileId = await File.create({
    originalName: req.file.originalname,
    subfolderId:  parseInt(subfolderId),
    sectionId:    subfolder.sectionId,
    uploadedBy:   req.user.id,
  })
  await FileVersion.addVersion({
    fileId,
    originalName:       req.file.originalname,
    url:                req.file.path,
    cloudinaryPublicId: req.file.filename,
    fileSize:           req.file.size || null,
    uploadedBy:         req.user.id,
  })
  await AuditLog.record({
    userId:      req.user.id,
    action:      'UPLOAD',
    fileId,
    subfolderId: parseInt(subfolderId),
    sectionId:   subfolder.sectionId,
    fileName:    req.file.originalname,
  })
  res.status(201).json({ fileId })
})

// UC-09 — Upload a new version of an existing file
// POST /api/files/:fileId/versions
exports.uploadVersion = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.fileId)
  if (!file) return res.status(404).json({ message: 'File not found' })

  const section = await Section.findById(file.sectionId)
  if (section.deadline && new Date() > new Date(section.deadline)) {
    return res.status(403).json({ message: 'Deadline has passed, uploads are blocked' })
  }
  await FileVersion.addVersion({
    fileId:             file.id,
    originalName:       req.file.originalname,
    url:                req.file.path,
    cloudinaryPublicId: req.file.filename,
    fileSize:           req.file.size || null,
    uploadedBy:         req.user.id,
  })
  // Keep the displayed file name in sync with the latest version's file
  await File.updateName(file.id, req.file.originalname)
  await AuditLog.record({
    userId:      req.user.id,
    action:      'UPLOAD',
    fileId:      file.id,
    subfolderId: file.subfolderId,
    sectionId:   file.sectionId,
    fileName:    req.file.originalname,
  })
  res.json({ message: 'New version uploaded' })
})

// UC-12 — Get version history for a file
// GET /api/files/:fileId/versions
exports.getVersions = asyncHandler(async (req, res) => {
  const versions = await FileVersion.findByFile(req.params.fileId)
  res.json(versions)
})

// UC-13 — Restore a previous version (creates a new version row)
// PUT /api/files/:fileId/versions/:versionId/restore
exports.restoreVersion = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.fileId)
  if (!file) return res.status(404).json({ message: 'File not found' })

  const section = await Section.findById(file.sectionId)
  if (section.deadline && new Date() > new Date(section.deadline)) {
    return res.status(403).json({ message: 'Deadline has passed, restores are blocked' })
  }
  const restored = await FileVersion.restore(req.params.versionId, req.user.id)
  // Sync the displayed file name to the restored version's name
  if (restored.originalName) {
    await File.updateName(file.id, restored.originalName)
  }
  await AuditLog.record({
    userId:      req.user.id,
    action:      'RESTORE',
    fileId:      file.id,
    subfolderId: file.subfolderId,
    sectionId:   file.sectionId,
    fileName:    restored.originalName || file.originalName,
  })
  res.json({ message: 'Version restored as new current version' })
})

// UC-14 — Delete a file (and all its Cloudinary assets)
// DELETE /api/files/:fileId
exports.deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.fileId)
  if (!file) return res.status(404).json({ message: 'File not found' })

  const section = await Section.findById(file.sectionId)
  if (section.deadline && new Date() > new Date(section.deadline)) {
    return res.status(403).json({ message: 'Deadline has passed, deletion is blocked' })
  }
  // Record audit BEFORE deletion (file data disappears after)
  await AuditLog.record({
    userId:      req.user.id,
    action:      'DELETE',
    fileId:      file.id,
    subfolderId: file.subfolderId,
    sectionId:   file.sectionId,
    fileName:    file.originalName,
  })
  // Delete all Cloudinary assets for this file's versions
  const versions = await FileVersion.findByFile(file.id)
  for (const v of versions) {
    if (v.cloudinaryPublicId) {
      await cloudinarySvc.deleteResource(v.cloudinaryPublicId).catch(() => {})
    }
  }
  await File.deleteWithVersions(file.id)
  // Revert subfolder completion if no files remain
  const remaining = await File.findBySubfolder(file.subfolderId, file.sectionId)
  if (remaining.length === 0) {
    await Subfolder.markIncomplete(file.subfolderId)
  }
  res.json({ message: 'File deleted' })
})

// Tiny HTML landing page used by Excel hyperlinks: lists every file in a
// subfolder with individual download buttons. Lets the auditor reach EVERY
// file (Excel cells can only carry one hyperlink, so a single cell can't make
// each filename clickable directly).
// GET /api/public/subfolders/:subfolderId/files
exports.listSubfolderFiles = asyncHandler(async (req, res) => {
  const subfolderId = req.params.subfolderId
  const sf = await Subfolder.findById(subfolderId)
  if (!sf) return res.status(404).send('Subfolder not found')

  const [files] = await pool.query(
    `SELECT f.id AS fileId, f.originalName, fv.uploadedAt, fv.fileSize
     FROM FILE f
     JOIN FILEVERSION fv ON fv.fileId = f.id AND fv.isCurrent = 1
     WHERE f.subfolderId = ?
     ORDER BY fv.uploadedAt DESC`,
    [subfolderId]
  )

  // Also fetch section + subject for breadcrumb context
  const [ctx] = await pool.query(
    `SELECT sec.sectionNumber, sub.code AS subjectCode, sub.name AS subjectName
     FROM SECTION sec JOIN SUBJECT sub ON sub.id = sec.subjectId
     WHERE sec.id = ?`,
    [sf.sectionId]
  )
  const c = ctx[0] || {}

  const apiBase = `${req.protocol}://${req.get('host')}`
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]))
  const fmt = (b) => !b ? '—' : b < 1024 ? `${b} B`
    : b < 1024**2 ? `${(b/1024).toFixed(1)} KB`
    : `${(b/1024**2).toFixed(1)} MB`
  const fmtDate = (d) => !d ? '—' : new Date(d).toLocaleString('en-GB',
    { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>${esc(sf.name)} : Files</title>
${LOGO_DATA_URI ? `<link rel="icon" type="image/png" href="${LOGO_DATA_URI}">` : ''}
<style>
  :root { color-scheme: dark; }
  body { font-family: Inter, system-ui, sans-serif; background: #0f1320; color: #e8eef8;
         padding: 2.5rem 2rem; margin: 0; min-height: 100vh; box-sizing: border-box; }
  .wrap { max-width: 820px; margin: 0 auto; }
  .brand { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem; }
  .brand img { width: 44px; height: 44px; object-fit: contain; }
  .brand-text { font-size: 0.95rem; font-weight: 700; color: #fff; letter-spacing: 0.01em; }
  .brand-sub  { font-size: 0.75rem; color: #9aa5b5; }
  .crumb { color: #6e7a90; font-size: 0.85rem; margin-bottom: 0.4rem; }
  h1 { margin: 0 0 0.4rem; font-size: 1.75rem; color: #fff; }
  .meta { color: #9aa5b5; margin: 0 0 2rem; font-size: 0.9rem; }
  .file { display: flex; align-items: center; gap: 1.25rem; padding: 1rem 1.25rem;
          background: #1a2233; border: 1px solid #2a3447; border-radius: 10px;
          margin-bottom: 0.75rem; }
  .file-info { flex: 1; min-width: 0; }
  .file-name { font-weight: 600; word-break: break-all; margin-bottom: 0.25rem; }
  .file-meta { font-size: 0.78rem; color: #9aa5b5; }
  .btn { display: inline-flex; align-items: center; gap: 0.4rem;
         padding: 0.55rem 1rem; background: #D7298B; color: #fff;
         text-decoration: none; border-radius: 7px; font-weight: 600;
         font-size: 0.875rem; white-space: nowrap; }
  .btn:hover { background: #b32072; }
  .empty { color: #9aa5b5; font-style: italic; padding: 2rem; text-align: center;
           border: 1px dashed #2a3447; border-radius: 10px; }
</style>
</head><body>
  <div class="wrap">
    <div class="brand">
      ${LOGO_DATA_URI ? `<img src="${LOGO_DATA_URI}" alt="Logo">` : ''}
      <div>
        <div class="brand-text">File Management System</div>
        <div class="brand-sub">SE Course Documentation</div>
      </div>
    </div>
    <div class="crumb">${esc(c.subjectCode || '')} : ${esc(c.subjectName || '')} · Section ${esc(c.sectionNumber || '')}</div>
    <h1>${esc(sf.name)}</h1>
    <p class="meta">${files.length} file${files.length === 1 ? '' : 's'} in this subfolder · sorted newest first</p>
    ${files.length === 0
      ? '<div class="empty">No files uploaded.</div>'
      : files.map(f => `
        <div class="file">
          <div class="file-info">
            <div class="file-name">${esc(f.originalName)}</div>
            <div class="file-meta">${fmt(f.fileSize)} · uploaded ${fmtDate(f.uploadedAt)}</div>
          </div>
          <a class="btn" href="${apiBase}/api/public/files/${f.fileId}/download">⬇ Download</a>
        </div>
      `).join('')
    }
  </div>
</body></html>`
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

// Public proxy: stream a file from Cloudinary with the right filename so it
// downloads as e.g. "Phase 0.pdf" instead of the random Cloudinary public_id.
// Used by the Excel report hyperlinks (Cloudinary's fl_attachment doesn't
// reliably accept filenames containing dots, especially for raw resources).
// GET /api/public/files/:fileId/download
exports.downloadFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.fileId)
  if (!file) return res.status(404).send('File not found')
  const versions = await FileVersion.findByFile(file.id)
  const current  = versions.find(v => v.isCurrent === 1) || versions[0]
  if (!current) return res.status(404).send('No file content')

  const rawName = current.originalName || file.originalName || `file_${file.id}`
  // Strip characters that would break a Content-Disposition filename header.
  const safeName = rawName.replace(/["\\\r\n]/g, '_')

  const upstream = https.get(current.url, (upRes) => {
    if (upRes.statusCode !== 200) {
      if (!res.headersSent) res.status(502).send('Upstream fetch failed')
      upRes.resume()
      return
    }
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`)
    res.setHeader('Content-Type', upRes.headers['content-type'] || 'application/octet-stream')
    if (upRes.headers['content-length']) {
      res.setHeader('Content-Length', upRes.headers['content-length'])
    }
    upRes.pipe(res)
  })
  upstream.on('error', () => {
    if (!res.headersSent) res.status(502).send('Failed to reach storage')
  })
})

// Lecturer manually marks subfolder as complete
// PATCH /api/files/subfolders/:subfolderId/complete
exports.markSubfolderComplete = asyncHandler(async (req, res) => {
  const subfolder = await Subfolder.findById(req.params.subfolderId)
  if (!subfolder) return res.status(404).json({ message: 'Subfolder not found' })
  const section = await Section.findById(subfolder.sectionId)
  if (section.deadline && new Date() > new Date(section.deadline)) {
    return res.status(403).json({ message: 'Deadline has passed' })
  }
  await Subfolder.markComplete(req.params.subfolderId, req.user.id)
  res.json({ message: 'Subfolder marked as complete' })
})

// Lecturer manually reverts subfolder to incomplete
// PATCH /api/files/subfolders/:subfolderId/incomplete
exports.markSubfolderIncomplete = asyncHandler(async (req, res) => {
  const subfolder = await Subfolder.findById(req.params.subfolderId)
  if (!subfolder) return res.status(404).json({ message: 'Subfolder not found' })
  await Subfolder.markIncomplete(req.params.subfolderId)
  res.json({ message: 'Subfolder marked as incomplete' })
})
