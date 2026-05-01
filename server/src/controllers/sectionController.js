const Section      = require('../models/Section')
const Subfolder    = require('../models/Subfolder')
const DeadlineLog  = require('../models/DeadlineLog')
const asyncHandler = require('../utils/asyncHandler')

// GET /api/subjects/:id/sections — list sections for a subject (flat with stats)
exports.getSections = asyncHandler(async (req, res) => {
  const sections = await Section.findBySubject(req.params.id)
  res.json(sections)
})

// GET /api/subjects/:id/sections/:sectionId — full section detail (used by SubfolderView & SectionDetail)
// Returns: { id, sectionNumber, deadline, subject: {...}, subfolders: [{ ...sf, files: [...] }] }
exports.getSection = asyncHandler(async (req, res) => {
  const sectionId = req.params.sectionId || req.params.id
  const section = await Section.findByIdWithDetails(sectionId)
  if (!section) return res.status(404).json({ message: 'Section not found' })
  res.json(section)
})

// POST /api/subjects/:id/sections — PIC creates a section, auto-applies subfolder template
exports.createSection = asyncHandler(async (req, res) => {
  const id = await Section.create({
    sectionNumber: req.body.sectionNumber,
    subjectId:     req.params.id,
    deadline:      req.body.deadline || null,
  })
  // Auto-apply subfolder template
  const template = await Subfolder.getTemplate()
  for (const tmpl of template) {
    await Subfolder.create({ name: tmpl.name, sectionId: id })
  }
  res.status(201).json({ id })
})

// PUT /api/sections/:id/deadline — PIC sets or extends deadline
exports.setDeadline = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id)
  if (!section) return res.status(404).json({ message: 'Section not found' })
  // Reason is required when extending an existing deadline
  if (section.deadline && !req.body.reason) {
    return res.status(400).json({ message: 'A reason is required when extending an existing deadline' })
  }
  await DeadlineLog.record({
    sectionId:        section.id,
    previousDeadline: section.deadline,
    newDeadline:      req.body.deadline,
    reason:           req.body.reason || null,
    changedBy:        req.user.id,
  })
  await Section.setDeadline(req.params.id, req.body.deadline)
  res.json({ message: 'Deadline updated' })
})

// POST /api/sections/:id/subfolders — PIC adds an extra subfolder to a section
exports.addSubfolder = asyncHandler(async (req, res) => {
  const id = await Subfolder.create({
    name:      req.body.name,
    sectionId: req.params.id,
  })
  res.status(201).json({ id })
})

// DELETE /api/subfolders/:id — PIC removes a subfolder (only if it has no files)
exports.removeSubfolder = asyncHandler(async (req, res) => {
  const sf = await Subfolder.findById(req.params.id)
  if (!sf) return res.status(404).json({ message: 'Subfolder not found' })
  await Subfolder.delete(req.params.id)
  res.json({ message: 'Subfolder removed' })
})
