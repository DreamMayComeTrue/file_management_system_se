const express      = require('express')
const router       = express.Router()
const ctrl         = require('../controllers/auditController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')

router.use(authenticate)

// GET /api/audit-log  — PIC/Audit: view audit log with optional filters
router.get('/', authorize('PIC', 'Audit'), ctrl.getAuditLog)

module.exports = router
