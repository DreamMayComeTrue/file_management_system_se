const express    = require('express')
const router     = express.Router()
const ctrl       = require('../controllers/dashboardController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')

router.use(authenticate)

router.get('/my',        authorize('Lecturer', 'PIC'), ctrl.getMyDashboard)
router.get('/programme', authorize('PIC', 'Audit'),    ctrl.getProgrammeDashboard)

router.get('/sections/:sectionId/comment',  authorize('Lecturer', 'PIC', 'Audit'), ctrl.getComment)
router.put('/sections/:sectionId/comment',  authorize('Lecturer', 'PIC'),          ctrl.updateComment)

module.exports = router
