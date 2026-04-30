const pool = require('../config/db')

const Subfolder = {
  async findBySection(sectionId) {
    const [rows] = await pool.query(
      'SELECT * FROM SUBFOLDER WHERE sectionId = ? ORDER BY name ASC',
      [sectionId]
    )
    return rows
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM SUBFOLDER WHERE id = ?', [id])
    return rows[0] || null
  },

  async create({ name, sectionId }) {
    const [result] = await pool.query(
      'INSERT INTO SUBFOLDER (name, sectionId) VALUES (?, ?)',
      [name, sectionId]
    )
    return result.insertId
  },

  async delete(id) {
    await pool.query('DELETE FROM SUBFOLDER WHERE id = ?', [id])
  },

  // Lecturer manually marks subfolder as complete
  async markComplete(id, userId) {
    await pool.query(
      'UPDATE SUBFOLDER SET isCompleted = 1, completedAt = NOW(), completedBy = ? WHERE id = ?',
      [userId, id]
    )
  },

  // Revert to incomplete — triggered when the last file in a subfolder is deleted
  async markIncomplete(id) {
    await pool.query(
      'UPDATE SUBFOLDER SET isCompleted = 0, completedAt = NULL, completedBy = NULL WHERE id = ?',
      [id]
    )
  },

  // ── Template operations (SUBFOLDER_TEMPLATE table) ──────────────────────────

  async getTemplate() {
    const [rows] = await pool.query(
      'SELECT * FROM SUBFOLDER_TEMPLATE ORDER BY name ASC'
    )
    return rows
  },

  async saveTemplate(names) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query('DELETE FROM SUBFOLDER_TEMPLATE')
      if (names.length > 0) {
        const values = names.map(n => [n])
        await conn.query('INSERT INTO SUBFOLDER_TEMPLATE (name) VALUES ?', [values])
      }
      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },
}

module.exports = Subfolder
