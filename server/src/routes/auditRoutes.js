const express    = require('express')
const router     = express.Router()
const ctrl       = require('../controllers/auditController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')

router.use(authenticate)

router.get('/',       authorize('PIC', 'Audit'), ctrl.getAuditLog)
router.get('/export', authorize('Audit'),        ctrl.exportReport)

module.exports = router
