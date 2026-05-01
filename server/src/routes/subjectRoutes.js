const express      = require('express')
const router       = express.Router()
const subjectCtrl  = require('../controllers/subjectController')
const sectionCtrl  = require('../controllers/sectionController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')

router.use(authenticate)

// Subject CRUD
router.get('/',     authorize('PIC', 'Audit'),              subjectCtrl.getAllSubjects)
router.get('/mine', authorize('Lecturer', 'PIC'),           subjectCtrl.getMySubjects)
router.get('/:id',  authorize('Lecturer', 'PIC', 'Audit'),  subjectCtrl.getSubject)
router.post('/',    authorize('PIC'),                       subjectCtrl.createSubject)

// Section sub-routes (nested under /subjects/:id/sections)
router.get( '/:id/sections',              authorize('Lecturer', 'PIC', 'Audit'), sectionCtrl.getSections)
router.get( '/:id/sections/:sectionId',   authorize('Lecturer', 'PIC', 'Audit'), sectionCtrl.getSection)
router.post('/:id/sections',              authorize('PIC'),                      sectionCtrl.createSection)

module.exports = router
