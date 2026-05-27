const pool = require('../config/db')

const File = {
  // Returns files in a subfolder (current version only) with aliased fields expected by frontend
  async findBySubfolder(subfolderId, sectionId) {
    const [rows] = await pool.query(
      `SELECT
         f.id, f.subfolderId,
         f.originalName  AS fileName,
         fv.url          AS fileUrl,
         fv.fileSize,
         fv.uploadedAt
       FROM FILE f
       JOIN FILEVERSION fv ON fv.fileId = f.id AND fv.isCurrent = 1
       WHERE f.subfolderId = ? AND f.sectionId = ?
       ORDER BY fv.uploadedAt DESC`,
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

  // Update the displayed file name (used when a new version is uploaded)
  async updateName(id, originalName) {
    await pool.query('UPDATE FILE SET originalName = ? WHERE id = ?', [originalName, id])
  },

  // Atomically delete file + all its versions (ON DELETE CASCADE handles it, but explicit is safer)
  async deleteWithVersions(id) {
    await pool.query('DELETE FROM FILE WHERE id = ?', [id])
  },
}

module.exports = File
