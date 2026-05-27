const bcrypt       = require('bcryptjs')
const User         = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')

const TEMP_PASSWORD = 'Password123!'

// GET /api/users/lecturers — PIC/Lecturer dropdown
exports.getLecturers = asyncHandler(async (req, res) => {
  const lecturers = await User.findAllLecturers()
  res.json(lecturers)
})

// POST /api/users/lecturers — PIC creates a lecturer account
exports.createLecturer = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body
  if (!fullName || !email) {
    return res.status(400).json({ message: 'Full name and email are required.' })
  }

  const existing = await User.findByEmail(email)
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' })
  }

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 12)
  const id = await User.create({ fullName, email, passwordHash, role: 'Lecturer' })
  res.status(201).json({ id, fullName, email })
})

// DELETE /api/users/lecturers/:id — PIC removes a lecturer
exports.deleteLecturer = asyncHandler(async (req, res) => {
  await User.deleteById(req.params.id)
  res.json({ message: 'Lecturer removed.' })
})

// GET /api/users/auditors — PIC: list audit accounts
exports.getAuditors = asyncHandler(async (req, res) => {
  const auditors = await User.findAllByRole('Audit')
  res.json(auditors)
})

// POST /api/users/auditors — PIC creates an audit account
exports.createAuditor = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body
  if (!fullName || !email) {
    return res.status(400).json({ message: 'Full name and email are required.' })
  }

  const existing = await User.findByEmail(email)
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' })
  }

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 12)
  const id = await User.create({ fullName, email, passwordHash, role: 'Audit' })
  res.status(201).json({ id, fullName, email })
})

// DELETE /api/users/auditors/:id — PIC removes an audit account
exports.deleteAuditor = asyncHandler(async (req, res) => {
  await User.deleteByIdAndRole(req.params.id, 'Audit')
  res.json({ message: 'Auditor removed.' })
})
