const Subject    = require('../models/Subject')
const asyncHandler = require('../utils/asyncHandler')

// UC-04 — PIC: get all subjects with sections nested
exports.getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.findAllWithSections()
  res.json(subjects)
})

// UC-05 — Lecturer/PIC: get own subjects with sections nested
exports.getMySubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.findByLecturerWithSections(req.user.id)
  res.json(subjects)
})

// Get a single subject by id (used by CreateSection page to show subject info)
exports.getSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
  if (!subject) return res.status(404).json({ message: 'Subject not found' })
  res.json(subject)
})

// UC-06 — PIC: create a new subject
exports.createSubject = asyncHandler(async (req, res) => {
  const { name, code, programme, semester, academicYear, lecturerId } = req.body
  const id = await Subject.create({
    name,
    code,
    programme,
    semester,
    academicYear,
    // Default to the PIC creating it if no lecturerId provided
    lecturerId: lecturerId || req.user.id,
  })
  res.status(201).json({ id })
})
