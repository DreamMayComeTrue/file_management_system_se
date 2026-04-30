const pool       = require('../config/db')
const Comment    = require('../models/Comment')
const asyncHandler = require('../utils/asyncHandler')

// UC-05 — Lecturer: my subjects completion overview
exports.getMyDashboard = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT
       sub.id AS subjectId, sub.name AS subjectName, sub.code,
       sec.id AS sectionId, sec.name AS sectionName, sec.deadline,
       COUNT(DISTINCT sf.id)                                        AS totalSubfolders,
       COUNT(DISTINCT CASE WHEN sf.isCompleted = 1 THEN sf.id END) AS completedSubfolders
     FROM SUBJECT sub
     JOIN SECTION sec   ON sec.subjectId = sub.id
     LEFT JOIN SUBFOLDER sf ON sf.sectionId = sec.id
     WHERE sub.lecturerId = ?
     GROUP BY sub.id, sec.id`,
    [req.user.id]
  )
  res.json(rows)
})

// UC-04 — PIC: programme-wide completion dashboard
exports.getProgrammeDashboard = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT
       sub.id AS subjectId, sub.name AS subjectName, sub.code,
       u.fullName AS lecturerName,
       sec.id AS sectionId, sec.name AS sectionName, sec.deadline,
       COUNT(DISTINCT sf.id)                                        AS totalSubfolders,
       COUNT(DISTINCT CASE WHEN sf.isCompleted = 1 THEN sf.id END) AS completedSubfolders
     FROM SUBJECT sub
     JOIN USER u    ON u.id  = sub.lecturerId
     JOIN SECTION sec   ON sec.subjectId = sub.id
     LEFT JOIN SUBFOLDER sf ON sf.sectionId = sec.id
     GROUP BY sub.id, sec.id`
  )
  res.json(rows)
})

// UC-16 — Update section comment (Lecturer/PIC)
exports.updateComment = asyncHandler(async (req, res) => {
  await Comment.upsert(req.params.sectionId, req.body.body, req.user.id)
  res.json({ message: 'Comment saved' })
})

exports.getComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findBySection(req.params.sectionId)
  res.json(comment || { body: '' })
})
