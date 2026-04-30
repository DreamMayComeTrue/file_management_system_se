const pool = require('../config/db')

const File = {
  async findBySubfolder(subfolderId, sectionId) {
    const [rows] = await pool.query(
      `SELECT f.*, fv.id AS versionId, fv.url, fv.versionNumber, fv.uploadedAt
       FROM FILE f
       JOIN FILEVERSION fv ON fv.fileId = f.id AND fv.isCurrent = 1
       WHERE f.subfolderId = ? AND f.sectionId = ?`,
      [subfolderId, sectionId]
    )
    return rows
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM FILE WHERE id = ?', [id])
    return rows[0] || null
  },

  async create({ originalName, subfolderId, sectionId, uploadedBy }) {
    const [result] = await pool.query(
      'INSERT INTO FILE (originalName, subfolderId, sectionId, uploadedBy) VALUES (?, ?, ?, ?)',
      [originalName, subfolderId, sectionId, uploadedBy]
    )
    return result.insertId
  },

  // Atomically delete file + all versions
  async deleteWithVersions(id) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query('DELETE FROM FILEVERSION WHERE fileId = ?', [id])
      await conn.query('DELETE FROM FILE WHERE id = ?', [id])
      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },
}

module.exports = File
