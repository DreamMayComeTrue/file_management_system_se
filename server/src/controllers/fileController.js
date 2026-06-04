const https         = require('https')
const File          = require('../models/File')
const FileVersion   = require('../models/FileVersion')
const Section       = require('../models/Section')
const Subfolder     = require('../models/Subfolder')
const AuditLog      = require('../models/AuditLog')
const asyncHandler  = require('../utils/asyncHandler')
const cloudinarySvc = require('../services/cloudinaryService')

// UC-08 — Upload initial file to a subfolder
// POST /api/subfolders/:subfolderId/files
exports.upload = asyncHandler(async (req, res) => {
  const { subfolderId } = req.params

  const subfolder = await Subfolder.findById(subfolderId)
  if (!subfolder) return res.status(404).json({ message: 'Subfolder not found' })

  const section = await Section.findById(subfolder.sectionId)
  if (!section) return res.status(404).json({ message: 'Section not found' })
  if (section.deadline && new Date() > new Date(section.deadline)) {
    return res.status(403).json({ message: 'Deadline has passed — uploads are blocked' })
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
    return res.status(403).json({ message: 'Deadline has passed — uploads are blocked' })
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
    return res.status(403).json({ message: 'Deadline has passed — restores are blocked' })
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
    return res.status(403).json({ message: 'Deadline has passed — deletion is blocked' })
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
