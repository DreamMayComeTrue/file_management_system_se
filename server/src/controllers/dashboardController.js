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

// Section comment — PIC/Lecturer writes notes per section
// GET /api/dashboard/sections/:sectionId/comment
exports.getComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findBySection(req.params.sectionId)
  res.json(comment || { body: '' })
})

// PUT /api/sections/:sectionId/comment  (also reachable via /api/dashboard/sections/:sectionId/comment)
exports.updateComment = asyncHandler(async (req, res) => {
  // client sends { text } — also accept legacy { body }
  const content = req.body.text ?? req.body.body ?? ''
  await Comment.upsert(req.params.sectionId, content, req.user.id)
  res.json({ message: 'Comment saved' })
})
