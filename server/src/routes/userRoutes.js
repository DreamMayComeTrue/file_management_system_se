const express      = require('express')
const router       = express.Router()
const userCtrl     = require('../controllers/userController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')

router.use(authenticate)

router.get('/lecturers',     authorize('PIC', 'Lecturer'),  userCtrl.getLecturers)
router.post('/lecturers',    authorize('PIC'),              userCtrl.createLecturer)
router.delete('/lecturers/:id', authorize('PIC'),           userCtrl.deleteLecturer)

module.exports = router
