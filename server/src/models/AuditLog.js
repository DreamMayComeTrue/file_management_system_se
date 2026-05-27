const pool = require('../config/db')

const AuditLog = {
  async record({ userId, action, fileId, subfolderId, sectionId, fileName }) {
    await pool.query(
      'INSERT INTO AUDIT_LOG (userId, action, fileId, subfolderId, sectionId, fileName) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, fileId || null, subfolderId || null, sectionId || null, fileName || null]
    )
  },

  async find({ subjectId, sectionId, action, from, to } = {}) {
    let sql = `
      SELECT
        al.id, al.action, al.fileName, al.createdAt,
        al.fileId, al.subfolderId, al.sectionId,
        u.fullName          AS performedByName,
        sf.name             AS subfolderName,
        CONCAT(sub.code, ' - Section ', sec.sectionNumber) AS sectionLabel,
        sub.code            AS subjectCode,
        sub.name            AS subjectName
      FROM AUDIT_LOG al
      JOIN USER u            ON u.id   = al.userId
      LEFT JOIN SUBFOLDER sf ON sf.id  = al.subfolderId
      LEFT JOIN SECTION sec  ON sec.id = al.sectionId
      LEFT JOIN SUBJECT sub  ON sub.id = sec.subjectId
      WHERE 1=1`
    const params = []
    if (subjectId) { sql += ' AND sub.id = ?';           params.push(subjectId) }
    if (sectionId) { sql += ' AND al.sectionId = ?';     params.push(sectionId) }
    if (action)    { sql += ' AND al.action = ?';        params.push(action)    }
    if (from)      { sql += ' AND al.createdAt >= ?';    params.push(from)      }
    if (to)        { sql += ' AND al.createdAt <= ?';    params.push(to)        }
    sql += ' ORDER BY al.createdAt DESC LIMIT 500'
    const [rows] = await pool.query(sql, params)
    return rows
  },
}

module.exports = AuditLog
