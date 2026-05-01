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
      'SELECT * FROM SUBJECT ORDER BY code ASC'
    )
    if (subjects.length === 0) return []

    const [sections] = await pool.query(
      `SELECT
         sec.id, sec.sectionNumber, sec.deadline, sec.subjectId,
         u.fullName                                                        AS lecturerName,
         COUNT(DISTINCT sf.id)                                             AS total,
         COUNT(DISTINCT CASE WHEN sf.isCompleted = 1 THEN sf.id END)      AS completed
       FROM SECTION sec
       LEFT JOIN SUBJECT sub ON sub.id = sec.subjectId
       LEFT JOIN USER u      ON u.id   = sub.lecturerId
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
    const [subjects] = await pool.query(
      'SELECT * FROM SUBJECT WHERE lecturerId = ? ORDER BY code ASC',
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
       WHERE sec.subjectId IN (?)
       GROUP BY sec.id
       ORDER BY sec.sectionNumber ASC`,
      [subjectIds]
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
      })
    })

    return subjects.map(sub => ({
      ...sub,
      sections: sectMap[sub.id] || [],
    }))
  },
}

module.exports = Subject
