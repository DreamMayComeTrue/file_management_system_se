const express = require('express')
const router  = express.Router()
const auth    = require('../controllers/authController')
const authenticate = require('../middleware/authenticate')

router.post('/login',           auth.login)
router.post('/forgot-password', auth.forgotPassword)
router.post('/reset-password',  auth.resetPassword)
router.put('/change-password',  authenticate, auth.changePassword)

module.exports = router
