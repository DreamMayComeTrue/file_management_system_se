const express    = require('express')
const router     = express.Router()
const ctrl       = require('../controllers/fileController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')
const { upload }   = require('../config/cloudinary')

router.use(authenticate)

// Subfolder management (PIC)
router.post('/sections/:sectionId/subfolders',               authorize('PIC'), ctrl.addSubfolder)
router.delete('/sections/:sectionId/subfolders/:subfolderId', authorize('PIC'), ctrl.removeSubfolder)

// Section contents (all authenticated)
router.get('/sections/:sectionId/contents', authorize('Lecturer', 'PIC', 'Audit'), ctrl.getSectionContents)

// Lecturer manually marks subfolder as complete
router.patch('/subfolders/:subfolderId/complete', authorize('Lecturer', 'PIC'), ctrl.markSubfolderComplete)

// File operations (Lecturer + PIC)
router.post('/upload',                authorize('Lecturer', 'PIC'), upload.single('file'), ctrl.upload)
router.post('/:fileId/versions',      authorize('Lecturer', 'PIC'), upload.single('file'), ctrl.uploadVersion)
router.get('/:fileId/versions',       authorize('Lecturer', 'PIC', 'Audit'), ctrl.getVersions)
router.post('/:fileId/versions/:versionId/restore', authorize('Lecturer', 'PIC'), ctrl.restoreVersion)
router.delete('/:fileId',             authorize('Lecturer', 'PIC'), ctrl.deleteFile)

module.exports = router
