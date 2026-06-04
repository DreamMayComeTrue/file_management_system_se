// Public, un-authenticated routes used by external consumers (e.g. file links
// inside an exported Excel report — Excel hyperlinks can't carry JWT auth).
// Cloudinary URLs are already publicly addressable, so these endpoints don't
// reveal anything that isn't already accessible to anyone holding the link.
const express  = require('express')
const router   = express.Router()
const fileCtrl = require('../controllers/fileController')

router.get('/files/:fileId/download', fileCtrl.downloadFile)

module.exports = router
