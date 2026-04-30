const express    = require('express')
const router     = express.Router()
const ctrl       = require('../controllers/sectionController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')

router.use(authenticate)

router.get('/:subjectId/sections',       authorize('Lecturer', 'PIC', 'Audit'), ctrl.getSections)
router.get('/sections/:id',              authorize('Lecturer', 'PIC', 'Audit'), ctrl.getSection)
router.post('/:subjectId/sections',      authorize('PIC'), ctrl.createSection)
router.patch('/sections/:id/deadline',   authorize('PIC'), ctrl.setDeadline)

module.exports = router
