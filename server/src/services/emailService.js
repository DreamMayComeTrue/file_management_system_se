const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

exports.sendPasswordReset = async (toEmail, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`
  await transporter.sendMail({
    from:    `"SE File Management" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject: 'Password Reset Request',
    html:    `<p>Click the link below to reset your password. It expires in 1 hour.</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              <p>If you did not request this, ignore this email.</p>`,
  })
}

// Simple "is my SMTP working" test
exports.sendTestEmail = async (toEmail, fullName) => {
  await transporter.sendMail({
    from:    `"SE File Management" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject: 'SMTP Test : SE Course File Management System',
    html: `
      <p>Hi ${fullName || 'there'},</p>
      <p>This is a <strong>test email</strong> from the SE Course File Management System.</p>
      <p>If you received this, your SMTP configuration is working correctly and the
         system can send deadline reminders & password-reset emails.</p>
      <p style="color:#777;font-size:0.85rem;margin-top:1.5rem;">
        SE Course File Management System
      </p>
    `,
  })
}

exports.sendDeadlineReminder = async (toEmail, { subjectCode, subjectName, sectionNumber, deadline, lecturerName }) => {
  const niceDate = new Date(deadline).toLocaleString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur',
  })
  await transporter.sendMail({
    from:    `"SE File Management" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject: `Reminder: ${subjectCode} Section ${sectionNumber} : deadline in 3 days`,
    html: `
      <p>Hi ${lecturerName || 'Lecturer'},</p>
      <p>This is a reminder that the documentation deadline for the following
         section is <strong>3 days away</strong>:</p>
      <table style="border-collapse:collapse;margin:0.6rem 0;">
        <tr><td style="padding:4px 12px;color:#555;">Subject</td><td style="padding:4px 12px;"><strong>${subjectCode} : ${subjectName}</strong></td></tr>
        <tr><td style="padding:4px 12px;color:#555;">Section</td><td style="padding:4px 12px;"><strong>Section ${sectionNumber}</strong></td></tr>
        <tr><td style="padding:4px 12px;color:#555;">Deadline</td><td style="padding:4px 12px;"><strong>${niceDate}</strong></td></tr>
      </table>
      <p>Please log in to upload any outstanding documents and mark the subfolders complete before the deadline.</p>
      <p style="color:#777;font-size:0.85rem;margin-top:1.5rem;">— SE Course File Management System</p>
    `,
  })
}
