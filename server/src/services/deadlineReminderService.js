// Finds sections whose deadline is ~3 days away and emails the assigned
// lecturer. Idempotent per-day: each section has at most one reminder per day,
// tracked via SECTION.lastReminderSentAt.
const pool        = require('../config/db')
const emailSvc    = require('./emailService')

/**
 * Run the reminder sweep.
 *   opts.dryRun:       true → return matched sections, send nothing
 *   opts.ignoreWindow: true → ignore the 3-day window (test mode: any
 *                              future deadline that is still incomplete)
 *   opts.ignoreSent:   true → ignore lastReminderSentAt (force re-send)
 *
 * Returns { matched, sent, skipped, failed, dryRun }
 */
exports.runDeadlineReminders = async (opts = {}) => {
  const dryRun       = !!opts.dryRun
  const ignoreWindow = !!opts.ignoreWindow
  const ignoreSent   = !!opts.ignoreSent

  // 3-day window: 60h..84h from now centred on 72h (3d). Loose enough to
  // tolerate clock drift / a missed cron tick.
  const windowSql = ignoreWindow
    ? 'sec.deadline > NOW()'
    : 'sec.deadline BETWEEN NOW() + INTERVAL 60 HOUR AND NOW() + INTERVAL 84 HOUR'
  const sentSql = ignoreSent
    ? ''
    : ' AND (sec.lastReminderSentAt IS NULL OR sec.lastReminderSentAt < NOW() - INTERVAL 23 HOUR)'

  const [rows] = await pool.query(
    `SELECT sec.id AS sectionId, sec.sectionNumber, sec.deadline,
            sub.code AS subjectCode, sub.name AS subjectName,
            u.id AS lecturerId, u.fullName AS lecturerName, u.email AS lecturerEmail,
            COUNT(DISTINCT sf.id)                                              AS totalSubfolders,
            COUNT(DISTINCT CASE WHEN sf.isCompleted = 1 THEN sf.id END)       AS doneSubfolders
       FROM SECTION sec
       JOIN SUBJECT sub ON sub.id = sec.subjectId
       LEFT JOIN USER u ON u.id = sec.lecturerId
       LEFT JOIN SUBFOLDER sf ON sf.sectionId = sec.id
       WHERE sec.deadline IS NOT NULL
         AND ${windowSql}
         ${sentSql}
       GROUP BY sec.id
       HAVING totalSubfolders = 0 OR doneSubfolders < totalSubfolders`
  )

  const result = { matched: rows.length, sent: 0, skipped: 0, failed: 0, dryRun, items: [] }

  for (const r of rows) {
    if (!r.lecturerEmail) {
      result.skipped++
      result.items.push({ sectionId: r.sectionId, status: 'skipped', reason: 'No lecturer assigned' })
      continue
    }
    if (dryRun) {
      result.items.push({
        sectionId: r.sectionId,
        subjectCode: r.subjectCode,
        sectionNumber: r.sectionNumber,
        deadline: r.deadline,
        lecturerEmail: r.lecturerEmail,
        status: 'would-send',
      })
      continue
    }
    try {
      await emailSvc.sendDeadlineReminder(r.lecturerEmail, {
        subjectCode:   r.subjectCode,
        subjectName:   r.subjectName,
        sectionNumber: r.sectionNumber,
        deadline:      r.deadline,
        lecturerName:  r.lecturerName,
      })
      await pool.query('UPDATE SECTION SET lastReminderSentAt = NOW() WHERE id = ?', [r.sectionId])
      result.sent++
      result.items.push({ sectionId: r.sectionId, lecturerEmail: r.lecturerEmail, status: 'sent' })
    } catch (err) {
      result.failed++
      result.items.push({ sectionId: r.sectionId, lecturerEmail: r.lecturerEmail, status: 'failed', reason: err.message })
    }
  }
  return result
}
