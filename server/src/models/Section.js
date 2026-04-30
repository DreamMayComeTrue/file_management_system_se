const pool = require('../config/db')

const Section = {
  async findBySubject(subjectId) {
    const [rows] = await pool.query(
      'SELECT * FROM SECTION WHERE subjectId = ? ORDER BY name ASC',
      [subjectId]
    )
    return rows
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM SECTION WHERE id = ?', [id])
    return rows[0] || null
  },

  async create({ name, subjectId, deadline }) {
    const [result] = await pool.query(
      'INSERT INTO SECTION (name, subjectId, deadline) VALUES (?, ?, ?)',
      [name, subjectId, deadline || null]
    )
    return result.insertId
  },

  async setDeadline(id, deadline) {
    await pool.query('UPDATE SECTION SET deadline = ? WHERE id = ?', [deadline, id])
  },

  // Returns completion status by checking if all subfolders have at least one current file
  async getCompletionStatus(id) {
    const [rows] = await pool.query(
      `SELECT
         COUNT(sf.id) AS totalSubfolders,
         COUNT(DISTINCT fv.fileId) AS uploadedSubfolders
       FROM SUBFOLDER sf
       LEFT JOIN FILE f ON f.subfolderSectionId = sf.id AND f.sectionId = ?
       LEFT JOIN FILEVERSION fv ON fv.fileId = f.id AND fv.isCurrent = 1
       WHERE sf.sectionId = ?`,
      [id, id]
    )
    return rows[0]
  },
}

module.exports = Section
