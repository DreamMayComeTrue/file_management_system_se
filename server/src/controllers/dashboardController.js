const Subject    = require('../models/Subject')
const Comment    = require('../models/Comment')
const asyncHandler = require('../utils/asyncHandler')

// UC-12 — Lecturer/PIC: my own subjects + sections with completion overview
// GET /api/dashboard/mine
// Returns: { subjects: [ { id, code, name, programme, semester, academicYear, sections: [...] } ] }
exports.getMyDashboard = asyncHandler(async (req, res) => {
  const subjects = await Subject.findByLecturerWithSections(req.user.id)
  res.json({ subjects })
})

// UC-14 — PIC/Audit: programme-wide completion overview
// GET /api/dashboard/programme
// Returns: { subjects: [...] }
exports.getProgrammeDashboard = asyncHandler(async (req, res) => {
  const subjects = await Subject.findAllWithSections()
  res.json({ subjects })
})

// List all comments on a section
// GET /api/sections/:sectionId/comments
exports.getComments = asyncHandler(async (req, res) => {
  const list = await Comment.findBySection(req.params.sectionId)
  res.json(list)
})

// Post a new comment (PIC, Lecturer & Audit all welcome)
// POST /api/sections/:sectionId/comments  body: { text }
exports.addComment = asyncHandler(async (req, res) => {
  const content = (req.body.text ?? req.body.body ?? '').trim()
  if (!content) return res.status(400).json({ message: 'Comment text is required.' })
  const id = await Comment.add(req.params.sectionId, content, req.user.id)
  res.status(201).json({ id })
})

// Delete one of YOUR OWN comments
// DELETE /api/sections/:sectionId/comments/:commentId
exports.deleteComment = asyncHandler(async (req, res) => {
  const affected = await Comment.deleteByIdAndAuthor(req.params.commentId, req.user.id)
  if (!affected) return res.status(403).json({ message: 'You can only delete your own comments.' })
  res.json({ message: 'Comment deleted.' })
})
