const express      = require('express')
const router       = express.Router()
const sectionCtrl  = require('../controllers/sectionController')
const fileCtrl     = require('../controllers/fileController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')
const { upload }   = require('../config/cloudinary')

router.use(authenticate)

// DELETE /api/subfolders/:id  — PIC removes an empty subfolder
router.delete('/:id',            authorize('PIC'),                       sectionCtrl.removeSubfolder)

// POST   /api/subfolders/:subfolderId/files  — Lecturer uploads a file
router.post('/:subfolderId/files', authorize('Lecturer', 'PIC'), upload.single('file'), fileCtrl.upload)

module.exports = router
