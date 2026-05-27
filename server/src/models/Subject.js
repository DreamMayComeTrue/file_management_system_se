const pool = require('../config/db')

const Subject = {
  // Basic find — all subjects (flat, no sections)
  async findAll() {
    const [rows] = await pool.query(
      'SELECT * FROM SUBJECT ORDER BY code ASC'
    )
    return rows
  },

  async findByLecturer(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM SUBJECT WHERE lecturerId = ? ORDER BY code ASC',
      [userId]
    )
    return rows
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM SUBJECT WHERE id = ?', [id])
    return rows[0] || null
  },

  async deleteById(id) {
    await pool.query('DELETE FROM SUBJECT WHERE id = ?', [id])
  },

  async create({ name, code, programme, semester, academicYear, lecturerId }) {
    const [result] = await pool.query(
      'INSERT INTO SUBJECT (name, code, programme, semester, academicYear, lecturerId) VALUES (?, ?, ?, ?, ?, ?)',
      [name, code, programme || '', semester || 1, academicYear || '', lecturerId || null]
    )
    return result.insertId
  },

  // Returns all subjects nested with their sections + per-section completion stats
  // Used by getAllSubjects (PIC) and getProgrammeDashboard
  async findAllWithSections() {
    const [subjects] = await pool.query(
      `SELECT s.*, u.fullName AS lecturerName
       FROM SUBJECT s
       LEFT JOIN USER u ON u.id = s.lecturerId
       ORDER BY s.code ASC`
    )
    if (subjects.length === 0) return []

    const [sections] = await pool.query(
      `SELECT
         sec.id, sec.sectionNumber, sec.deadline, sec.subjectId,
         u.fullName                                                        AS lecturerName,
         COUNT(DISTINCT sf.id)                                             AS total,
         COUNT(DISTINCT CASE WHEN sf.isCompleted = 1 THEN sf.id END)      AS completed
       FROM SECTION sec
       LEFT JOIN USER u      ON u.id   = sec.lecturerId
       LEFT JOIN SUBFOLDER sf ON sf.sectionId = sec.id
       GROUP BY sec.id
       ORDER BY sec.sectionNumber ASC`
    )

    const sectMap = {}
    sections.forEach(s => {
      if (!sectMap[s.subjectId]) sectMap[s.subjectId] = []
      sectMap[s.subjectId].push({
        id:            s.id,
        sectionNumber: s.sectionNumber,
        deadline:      s.deadline,
        total:         s.total,
        completed:     s.completed,
        allComplete:   s.total > 0 && s.total === s.completed,
        lecturers:     s.lecturerName ? [s.lecturerName] : [],
      })
    })

    return subjects.map(sub => ({
      ...sub,
      sections: sectMap[sub.id] || [],
    }))
  },

  // Returns lecturer's subjects nested with their sections + completion stats
  // Used by getMySubjects (Lecturer) and getMyDashboard
  async findByLecturerWithSections(userId) {
    // Find subjects that have at least one section assigned to this lecturer
    const [subjects] = await pool.query(
      `SELECT DISTINCT s.*
       FROM SUBJECT s
       JOIN SECTION sec ON sec.subjectId = s.id
       WHERE sec.lecturerId = ?
       ORDER BY s.code ASC`,
      [userId]
    )
    if (subjects.length === 0) return []

    const subjectIds = subjects.map(s => s.id)
    const [sections] = await pool.query(
      `SELECT
         sec.id, sec.sectionNumber, sec.deadline, sec.subjectId,
         COUNT(DISTINCT sf.id)                                             AS total,
         COUNT(DISTINCT CASE WHEN sf.isCompleted = 1 THEN sf.id END)      AS completed
       FROM SECTION sec
       LEFT JOIN SUBFOLDER sf ON sf.sectionId = sec.id
       WHERE sec.subjectId IN (?) AND sec.lecturerId = ?
       GROUP BY sec.id
       ORDER BY sec.sectionNumber ASC`,
      [subjectIds, userId]
    )

    // Count comments per subject that were posted by OTHER people
    // (so the lecturer sees how many notes from PIC / Audit / other lecturers
    //  are waiting on them across all sections of that subject).
    const [othersCmts] = await pool.query(
      `SELECT sec.subjectId, COUNT(c.id) AS othersCount
       FROM COMMENT c
       JOIN SECTION sec ON sec.id = c.sectionId
       WHERE sec.subjectId IN (?) AND sec.lecturerId = ? AND c.authorId <> ?
       GROUP BY sec.subjectId`,
      [subjectIds, userId, userId]
    )
    const otherCommentMap = {}
    othersCmts.forEach(r => { otherCommentMap[r.subjectId] = r.othersCount })

    const sectMap = {}
    sections.forEach(s => {
      if (!sectMap[s.subjectId]) sectMap[s.subjectId] = []
      sectMap[s.subjectId].push({
        id:            s.id,
        sectionNumber: s.sectionNumber,
        deadline:      s.deadline,
        total:         s.total,
        completed:     s.completed,
        allComplete:   s.total > 0 && s.total === s.completed,
      })
    })

    return subjects.map(sub => ({
      ...sub,
      sections:           sectMap[sub.id] || [],
      othersCommentCount: otherCommentMap[sub.id] || 0,
    }))
  },
}

module.exports = Subject
