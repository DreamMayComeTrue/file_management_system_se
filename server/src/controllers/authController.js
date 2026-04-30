const bcrypt    = require('bcryptjs')
const jwt       = require('jsonwebtoken')
const crypto    = require('crypto')
const User      = require('../models/User')
const email     = require('../services/emailService')
const asyncHandler = require('../utils/asyncHandler')

// UC-01 Login
exports.login = asyncHandler(async (req, res) => {
  const { email: userEmail, password } = req.body
  const user = await User.findByEmail(userEmail)
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }
  const token = jwt.sign(
    { id: user.id, fullName: user.fullName, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  )
  res.json({ token })
})

// UC-02 Forgot Password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findByEmail(req.body.email)
  if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' })
  const token  = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  await User.setResetToken(user.email, token, expiry)
  await email.sendPasswordReset(user.email, token)
  res.json({ message: 'If that email exists, a reset link was sent.' })
})

// UC-02 Reset Password (token from email link)
exports.resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findByResetToken(req.body.token)
  if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' })
  const hash = await bcrypt.hash(req.body.password, 12)
  await User.updatePassword(user.id, hash)
  await User.clearResetToken(user.id)
  res.json({ message: 'Password reset successful' })
})

// UC-03 Change Password (authenticated)
exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
    return res.status(401).json({ message: 'Current password is incorrect' })
  }
  const hash = await bcrypt.hash(req.body.newPassword, 12)
  await User.updatePassword(req.user.id, hash)
  res.json({ message: 'Password changed successfully' })
})
