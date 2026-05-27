// Internal/admin routes for manual operations (testing, ops).
const express      = require('express')
const router       = express.Router()
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')
const reminderSvc  = require('../services/deadlineReminderService')
const emailSvc     = require('../services/emailService')
const User         = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')

router.use(authenticate)
router.use(authorize('PIC'))

/**
 * POST /api/dev/run-deadline-reminders
 *   Query string flags (all optional):
 *     ?dryRun=true        → list matches, send no email
 *     ?ignoreWindow=true  → ignore the 3-day window (any future deadline)
 *     ?ignoreSent=true    → ignore lastReminderSentAt (force re-send)
 *   For testing: use ?dryRun=true&ignoreWindow=true to see who WOULD be
 *   emailed today without sending anything.
 */
/**
 * POST /api/dev/test-email
 *   ?to=other@example.com   → send to this address (defaults to logged-in PIC's own email)
 *   Returns { ok, to } on success or 500 with the SMTP error message.
 */
router.post('/test-email', asyncHandler(async (req, res) => {
  let to = (req.query.to || '').trim()
  if (!to) {
    // fall back to the logged-in user's own email
    const me = await User.findById(req.user.id)
    to = me?.email
  }
  if (!to) return res.status(400).json({ message: 'No recipient email available.' })
  try {
    await emailSvc.sendTestEmail(to, req.user.fullName)
    res.json({ ok: true, to, message: `Test email sent to ${to}. Check inbox + spam folder.` })
  } catch (err) {
    res.status(500).json({
      ok: false, to,
      message: `SMTP error: ${err.message}`,
      hint: 'Check SMTP_USER / SMTP_PASS in server/.env. For Gmail you need a 16-char App Password (not your account password).',
    })
  }
}))

router.post('/run-deadline-reminders', asyncHandler(async (req, res) => {
  const result = await reminderSvc.runDeadlineReminders({
    dryRun:       req.query.dryRun       === 'true',
    ignoreWindow: req.query.ignoreWindow === 'true',
    ignoreSent:   req.query.ignoreSent   === 'true',
  })
  res.json(result)
}))

module.exports = router
