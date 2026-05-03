const pool = require('../config/db')

const Section = {
  // Returns sections for a subject (flat — used by PIC subject list)
  async findBySubject(subjectId) {
    const [rows] = await pool.query(
      `SELECT
         sec.id, sec.sectionNumber, sec.deadline, sec.subjectId,
         COUNT(DISTINCT sf.id)                                        AS total,
         COUNT(DISTINCT CASE WHEN sf.isCompleted = 1 THEN sf.id END) AS completed
       FROM SECTION sec
       LEFT JOIN SUBFOLDER sf ON sf.sectionId = sec.id
       WHERE sec.subjectId = ?
       GROUP BY sec.id
       ORDER BY sec.sectionNumber ASC`,
      [subjectId]
    )
    return rows
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM SECTION WHERE id = ?', [id])
    return rows[0] || null
  },

  // Lightweight fetch used by SetDeadline page
  async findByIdSimple(id) {
    const [rows] = await pool.query(
      `SELECT sec.id, sec.sectionNumber, sec.deadline, sec.subjectId,
              sub.code AS subjectCode, sub.name AS subjectName
       FROM SECTION sec
       JOIN SUBJECT sub ON sub.id = sec.subjectId
       WHERE sec.id = ?`,
      [id]
    )
    return rows[0] || null
  },

  async deleteById(id) {
    await pool.query('DELETE FROM SECTION WHERE id = ?', [id])
  },

  // Full section detail: section + subject + subfolders (each with files)
  // Used by getSection endpoint
  async findByIdWithDetails(id) {
    // 1. Section + Subject
    const [secRows] = await pool.query(
      `SELECT
         sec.id, sec.sectionNumber, sec.deadline,
         sub.id AS subjectId, sub.code, sub.name AS subjectName,
         sub.programme, sub.semester, sub.academicYear
       FROM SECTION sec
       JOIN SUBJECT sub ON sub.id = sec.subjectId
       WHERE sec.id = ?`,
      [id]
    )
    if (!secRows[0]) return null

    const row = secRows[0]
    const section = {
      id:            row.id,
      sectionNumber: row.sectionNumber,
      deadline:      row.deadline,
      subject: {
        id:          row.subjectId,
        code:        row.code,
        name:        row.subjectName,
        programme:   row.programme,
        semester:    row.semester,
        academicYear: row.academicYear,
      },
    }

    // 2. Subfolders with completedByName
    const [sfRows] = await pool.query(
      `SELECT sf.*, u.fullName AS completedByName
       FROM SUBFOLDER sf
       LEFT JOIN USER u ON u.id = sf.completedBy
       WHERE sf.sectionId = ?
       ORDER BY sf.name ASC`,
      [id]
    )

    // 3. Files for each subfolder (current version only)
    const [fileRows] = await pool.query(
      `SELECT
         f.id, f.subfolderId,
         f.originalName   AS fileName,
         fv.url           AS fileUrl,
         fv.fileSize,
         fv.uploadedAt
       FROM FILE f
       JOIN FILEVERSION fv ON fv.fileId = f.id AND fv.isCurrent = 1
       WHERE f.sectionId = ?
       ORDER BY fv.uploadedAt DESC`,
      [id]
    )

    // Group files by subfolderId
    const fileMap = {}
    fileRows.forEach(f => {
      if (!fileMap[f.subfolderId]) fileMap[f.subfolderId] = []
      fileMap[f.subfolderId].push(f)
    })

    section.subfolders = sfRows.map(sf => ({
      id:              sf.id,
      name:            sf.name,
      isCompleted:     sf.isCompleted,
      completedAt:     sf.completedAt,
      completedByName: sf.completedByName || null,
      files:           fileMap[sf.id] || [],
    }))

    return section
  },

  async create({ sectionNumber, subjectId, deadline, lecturerId }) {
    const [result] = await pool.query(
      'INSERT INTO SECTION (sectionNumber, subjectId, deadline, lecturerId) VALUES (?, ?, ?, ?)',
      [sectionNumber, subjectId, deadline || null, lecturerId || null]
    )
    return result.insertId
  },

  async setDeadline(id, deadline) {
    await pool.query('UPDATE SECTION SET deadline = ? WHERE id = ?', [deadline, id])
  },
}

module.exports = Section
