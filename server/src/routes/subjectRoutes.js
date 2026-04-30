const express    = require('express')
const router     = express.Router()
const ctrl       = require('../controllers/subjectController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')

router.use(authenticate)

router.get('/',          authorize('PIC'), ctrl.getAllSubjects)
router.get('/mine',      authorize('Lecturer', 'PIC'), ctrl.getMySubjects)
router.get('/:id',       authorize('Lecturer', 'PIC', 'Audit'), ctrl.getSubject)
router.post('/',         authorize('PIC'), ctrl.createSubject)

module.exports = router
