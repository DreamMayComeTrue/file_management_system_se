const pool = require('../config/db')

// Multiple comments per section (append-only). PIC, Lecturer and Audit can all post.
const Comment = {
  // List all comments on a section, oldest first, with author info.
  async findBySection(sectionId) {
    const [rows] = await pool.query(
      `SELECT c.id, c.body, c.authorId, c.updatedAt,
              u.fullName AS authorName, u.role AS authorRole
       FROM COMMENT c
       LEFT JOIN USER u ON u.id = c.authorId
       WHERE c.sectionId = ?
       ORDER BY c.updatedAt ASC`,
      [sectionId]
    )
    return rows
  },

  // List comments for many sections at once (used by Excel export).
  async findBySections(sectionIds) {
    if (!sectionIds.length) return []
    const [rows] = await pool.query(
      `SELECT c.id, c.sectionId, c.body, c.authorId, c.updatedAt,
              u.fullName AS authorName, u.role AS authorRole
       FROM COMMENT c
       LEFT JOIN USER u ON u.id = c.authorId
       WHERE c.sectionId IN (?)
       ORDER BY c.sectionId, c.updatedAt ASC`,
      [sectionIds]
    )
    return rows
  },

  async add(sectionId, body, authorId) {
    const [r] = await pool.query(
      'INSERT INTO COMMENT (sectionId, body, authorId) VALUES (?, ?, ?)',
      [sectionId, body, authorId]
    )
    return r.insertId
  },

  // Delete a comment only if the requester is the author. Returns affectedRows.
  async deleteByIdAndAuthor(commentId, authorId) {
    const [r] = await pool.query(
      'DELETE FROM COMMENT WHERE id = ? AND authorId = ?',
      [commentId, authorId]
    )
    return r.affectedRows
  },
}

module.exports = Comment
