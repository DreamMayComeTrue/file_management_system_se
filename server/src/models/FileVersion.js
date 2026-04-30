const pool = require('../config/db')

const FileVersion = {
  async findByFile(fileId) {
    const [rows] = await pool.query(
      'SELECT * FROM FILEVERSION WHERE fileId = ? ORDER BY versionNumber DESC',
      [fileId]
    )
    return rows
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM FILEVERSION WHERE id = ?', [id])
    return rows[0] || null
  },

  async getNextVersionNumber(fileId) {
    const [rows] = await pool.query(
      'SELECT MAX(versionNumber) AS maxVer FROM FILEVERSION WHERE fileId = ?',
      [fileId]
    )
    return (rows[0].maxVer || 0) + 1
  },

  // Add a new version and set it as current; mark all others non-current
  async addVersion({ fileId, url, cloudinaryPublicId, uploadedBy }) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const versionNumber = await this.getNextVersionNumber(fileId)
      await conn.query('UPDATE FILEVERSION SET isCurrent = 0 WHERE fileId = ?', [fileId])
      const [result] = await conn.query(
        'INSERT INTO FILEVERSION (fileId, url, cloudinaryPublicId, versionNumber, isCurrent, uploadedBy) VALUES (?, ?, ?, ?, 1, ?)',
        [fileId, url, cloudinaryPublicId, versionNumber, uploadedBy]
      )
      await conn.commit()
      return result.insertId
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  // Restore: creates a new version (copy of old) and marks it current
  async restore(versionId, uploadedBy) {
    const version = await this.findById(versionId)
    if (!version) throw Object.assign(new Error('Version not found'), { status: 404 })
    return this.addVersion({
      fileId: version.fileId,
      url: version.url,
      cloudinaryPublicId: version.cloudinaryPublicId,
      uploadedBy,
    })
  },
}

module.exports = FileVersion
