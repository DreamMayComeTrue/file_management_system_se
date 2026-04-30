const Section      = require('../models/Section')
const Subfolder    = require('../models/Subfolder')
const DeadlineLog  = require('../models/DeadlineLog')
const asyncHandler = require('../utils/asyncHandler')

exports.getSections = asyncHandler(async (req, res) => {
  const sections = await Section.findBySubject(req.params.subjectId)
  res.json(sections)
})

exports.getSection = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id)
  if (!section) return res.status(404).json({ message: 'Section not found' })
  res.json(section)
})

// UC-07 — PIC: create section, auto-apply subfolder template
exports.createSection = asyncHandler(async (req, res) => {
  const id = await Section.create({
    name:      req.body.name,
    subjectId: req.params.subjectId,
    deadline:  req.body.deadline,
  })
  const template = await Subfolder.getTemplate()
  for (const tmpl of template) {
    await Subfolder.create({ name: tmpl.name, sectionId: id })
  }
  res.status(201).json({ id })
})

// UC-15 — PIC: set or extend deadline, always log the change
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
