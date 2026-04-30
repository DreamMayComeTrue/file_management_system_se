const pool = require('../config/db')

const Subject = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM SUBJECT ORDER BY createdAt DESC')
    return rows
  },

  async findByLecturer(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM SUBJECT WHERE lecturerId = ? ORDER BY createdAt DESC',
      [userId]
    )
    return rows
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM SUBJECT WHERE id = ?', [id])
    return rows[0] || null
  },

  async create({ name, code, lecturerId }) {
    const [result] = await pool.query(
      'INSERT INTO SUBJECT (name, code, lecturerId) VALUES (?, ?, ?)',
      [name, code, lecturerId]
    )
    return result.insertId
  },
}

module.exports = Subject
