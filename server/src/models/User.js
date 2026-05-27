const pool = require('../config/db')

const User = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM USER WHERE email = ?', [email])
    return rows[0] || null
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT id, fullName, email, role FROM USER WHERE id = ?', [id])
    return rows[0] || null
  },

  // Includes passwordHash — used for password verification (change password)
  async findByIdWithHash(id) {
    const [rows] = await pool.query('SELECT * FROM USER WHERE id = ?', [id])
    return rows[0] || null
  },

  async create({ fullName, email, passwordHash, role }) {
    const [result] = await pool.query(
      'INSERT INTO USER (fullName, email, passwordHash, role) VALUES (?, ?, ?, ?)',
      [fullName, email, passwordHash, role]
    )
    return result.insertId
  },

  async updatePassword(id, passwordHash) {
    await pool.query('UPDATE USER SET passwordHash = ? WHERE id = ?', [passwordHash, id])
  },

  async setResetToken(email, token, expiry) {
    await pool.query(
      'UPDATE USER SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
      [token, expiry, email]
    )
  },

  async findByResetToken(token) {
    const [rows] = await pool.query(
      'SELECT * FROM USER WHERE resetToken = ? AND resetTokenExpiry > NOW()',
      [token]
    )
    return rows[0] || null
  },

  async clearResetToken(id) {
    await pool.query('UPDATE USER SET resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?', [id])
  },

  async findAllLecturers() {
    const [rows] = await pool.query(
      'SELECT id, fullName, email, role FROM USER WHERE role IN (?, ?) ORDER BY fullName ASC',
      ['Lecturer', 'PIC']
    )
    return rows
  },

  async deleteById(id) {
    await pool.query('DELETE FROM USER WHERE id = ? AND role = ?', [id, 'Lecturer'])
  },

  // List all users of a given role (no passwordHash)
  async findAllByRole(role) {
    const [rows] = await pool.query(
      'SELECT id, fullName, email, role FROM USER WHERE role = ? ORDER BY fullName ASC',
      [role]
    )
    return rows
  },

  // Delete a user only if they hold the expected role (safety guard)
  async deleteByIdAndRole(id, role) {
    await pool.query('DELETE FROM USER WHERE id = ? AND role = ?', [id, role])
  },
}

module.exports = User
