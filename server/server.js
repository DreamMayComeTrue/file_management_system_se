require('dotenv').config()
const cron = require('node-cron')
const app  = require('./src/app')
const reminderSvc = require('./src/services/deadlineReminderService')
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Daily deadline reminder — 09:00 Malaysia time.
// Sends to lecturers whose section deadline is ~3 days away.
cron.schedule('0 9 * * *', async () => {
  console.log('[cron] Running daily deadline reminder…')
  try {
    const result = await reminderSvc.runDeadlineReminders()
    console.log(`[cron] reminders: matched=${result.matched} sent=${result.sent} skipped=${result.skipped} failed=${result.failed}`)
  } catch (e) {
    console.error('[cron] Reminder run failed:', e.message)
  }
}, { timezone: 'Asia/Kuala_Lumpur' })
console.log('[cron] Deadline reminder scheduled for 09:00 Asia/Kuala_Lumpur daily')
