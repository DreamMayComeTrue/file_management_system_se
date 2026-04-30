const pool = require('../config/db')

// 1:1 with SECTION — single updatable text block, not a thread
const Comment = {
  async findBySection(sectionId) {
    const [rows] = await pool.query('SELECT * FROM COMMENT WHERE sectionId = ?', [sectionId])
    return rows[0] || null
  },

  async upsert(sectionId, body, authorId) {
    await pool.query(
      `INSERT INTO COMMENT (sectionId, body, authorId)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE body = VALUES(body), authorId = VALUES(authorId), updatedAt = NOW()`,
      [sectionId, body, authorId]
    )
  },
}

module.exports = Comment
