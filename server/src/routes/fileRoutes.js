const express      = require('express')
const router       = express.Router()
const ctrl         = require('../controllers/fileController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')
const { upload }   = require('../config/cloudinary')

router.use(authenticate)

// Subfolder completion toggle (Lecturer/PIC)
// PATCH /api/files/subfolders/:subfolderId/complete
// PATCH /api/files/subfolders/:subfolderId/incomplete
router.patch('/subfolders/:subfolderId/complete',   authorize('Lecturer', 'PIC'), ctrl.markSubfolderComplete)
router.patch('/subfolders/:subfolderId/incomplete', authorize('Lecturer', 'PIC'), ctrl.markSubfolderIncomplete)

// File version operations
// POST   /api/files/:fileId/versions
// GET    /api/files/:fileId/versions
// PUT    /api/files/:fileId/versions/:versionId/restore
router.post('/:fileId/versions',                         authorize('Lecturer', 'PIC'), upload.single('file'), ctrl.uploadVersion)
router.get( '/:fileId/versions',                         authorize('Lecturer', 'PIC', 'Audit'),              ctrl.getVersions)
router.put( '/:fileId/versions/:versionId/restore',      authorize('Lecturer', 'PIC'),                       ctrl.restoreVersion)

// DELETE /api/files/:fileId
router.delete('/:fileId', authorize('Lecturer', 'PIC'), ctrl.deleteFile)

module.exports = router
