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
