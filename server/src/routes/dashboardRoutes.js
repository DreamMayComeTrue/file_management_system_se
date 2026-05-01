const express      = require('express')
const router       = express.Router()
const dashCtrl     = require('../controllers/dashboardController')
const auditCtrl    = require('../controllers/auditController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')

router.use(authenticate)

// GET /api/dashboard/mine      — Lecturer/PIC: their own subjects+sections completion
router.get('/mine',      authorize('Lecturer', 'PIC'),    dashCtrl.getMyDashboard)

// GET /api/dashboard/programme — PIC/Audit: all subjects completion overview
router.get('/programme', authorize('PIC', 'Audit'),       dashCtrl.getProgrammeDashboard)

// GET /api/dashboard/export    — Audit: download CSV report
router.get('/export',    authorize('PIC', 'Audit'),       auditCtrl.exportReport)

// Section comment
// GET /api/dashboard/sections/:sectionId/comment
// PUT /api/dashboard/sections/:sectionId/comment
router.get('/sections/:sectionId/comment', authorize('Lecturer', 'PIC', 'Audit'), dashCtrl.getComment)
router.put('/sections/:sectionId/comment', authorize('Lecturer', 'PIC'),          dashCtrl.updateComment)

module.exports = router
