const pool = require('../config/db')

const FileVersion = {
  // Returns version history with uploader name — used by version history modal
  async findByFile(fileId) {
    const [rows] = await pool.query(
      `SELECT fv.*, u.fullName AS uploadedByName
       FROM FILEVERSION fv
       JOIN USER u ON u.id = fv.uploadedBy
       WHERE fv.fileId = ?
       ORDER BY fv.versionNumber DESC`,
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

  // Add a new version, set it as current, mark all others non-current
  // fileSize / originalName are optional (from multer/cloudinary)
  async addVersion({ fileId, originalName, url, cloudinaryPublicId, fileSize, uploadedBy }) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const versionNumber = await this.getNextVersionNumber(fileId)
      await conn.query('UPDATE FILEVERSION SET isCurrent = 0 WHERE fileId = ?', [fileId])
      const [result] = await conn.query(
        `INSERT INTO FILEVERSION
           (fileId, originalName, url, cloudinaryPublicId, fileSize, versionNumber, isCurrent, uploadedBy)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        [fileId, originalName || null, url, cloudinaryPublicId || null,
         fileSize || null, versionNumber, uploadedBy]
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

  // Restore: creates a new version (copy of old) and marks it current.
  // Returns the copied version's data so the caller can sync FILE.originalName.
  async restore(versionId, uploadedBy) {
    const version = await this.findById(versionId)
    if (!version) throw Object.assign(new Error('Version not found'), { status: 404 })
    await this.addVersion({
      fileId:             version.fileId,
      originalName:       version.originalName,
      url:                version.url,
      cloudinaryPublicId: version.cloudinaryPublicId,
      fileSize:           version.fileSize,
      uploadedBy,
    })
    return version
  },
}

module.exports = FileVersion
