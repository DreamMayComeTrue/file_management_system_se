const Subject    = require('../models/Subject')
const asyncHandler = require('../utils/asyncHandler')

// UC-04 — PIC: get all subjects
exports.getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.findAll()
  res.json(subjects)
})

// UC-05 — Lecturer: get own subjects
exports.getMySubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.findByLecturer(req.user.id)
  res.json(subjects)
})

exports.getSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
  if (!subject) return res.status(404).json({ message: 'Subject not found' })
  res.json(subject)
})

// UC-06 — PIC: create subject
exports.createSubject = asyncHandler(async (req, res) => {
  const id = await Subject.create({
    name:       req.body.name,
    code:       req.body.code,
    lecturerId: req.body.lecturerId,
  })
  res.status(201).json({ id })
})
