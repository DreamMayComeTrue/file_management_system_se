const express      = require('express')
const router       = express.Router()
const ctrl         = require('../controllers/sectionController')
const dashCtrl     = require('../controllers/dashboardController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')

router.use(authenticate)

// GET  /api/sections/:id — lightweight section info for SetDeadline page
router.get('/:id',             authorize('PIC', 'Lecturer', 'Audit'), ctrl.getSectionSimple)

// DELETE /api/sections/:id
router.delete('/:id',          authorize('PIC'),                      ctrl.deleteSection)

// PUT  /api/sections/:id/deadline
router.put('/:id/deadline',    authorize('PIC'),                      ctrl.setDeadline)

// POST /api/sections/:id/subfolders  — PIC adds a subfolder to a section
router.post('/:id/subfolders', authorize('PIC'),                      ctrl.addSubfolder)

// Section comments — multi-comment, any of PIC / Lecturer / Audit can post.
// GET  /api/sections/:sectionId/comments
router.get('/:sectionId/comments',
  authorize('Lecturer', 'PIC', 'Audit'), dashCtrl.getComments)
// POST /api/sections/:sectionId/comments
router.post('/:sectionId/comments',
  authorize('Lecturer', 'PIC', 'Audit'), dashCtrl.addComment)
// DELETE /api/sections/:sectionId/comments/:commentId  (author-only)
router.delete('/:sectionId/comments/:commentId',
  authorize('Lecturer', 'PIC', 'Audit'), dashCtrl.deleteComment)

module.exports = router
