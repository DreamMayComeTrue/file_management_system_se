const pool = require('../config/db')

const DeadlineLog = {
  async record({ sectionId, previousDeadline, newDeadline, reason, changedBy }) {
    await pool.query(
      'INSERT INTO DEADLINE_LOG (sectionId, previousDeadline, newDeadline, reason, changedBy) VALUES (?, ?, ?, ?, ?)',
      [sectionId, previousDeadline || null, newDeadline, reason || null, changedBy]
    )
  },

  async findBySection(sectionId) {
    const [rows] = await pool.query(
      `SELECT dl.*, u.fullName AS changedByName
       FROM DEADLINE_LOG dl
       JOIN USER u ON u.id = dl.changedBy
       WHERE dl.sectionId = ?
       ORDER BY dl.changedAt DESC`,
      [sectionId]
    )
    return rows
  },
}

module.exports = DeadlineLog
