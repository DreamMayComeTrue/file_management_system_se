const express      = require('express')
const router       = express.Router()
const ctrl         = require('../controllers/subfolderTemplateController')
const authenticate = require('../middleware/authenticate')
const authorize    = require('../middleware/authorize')

router.use(authenticate)

// GET /api/subfolder-template
router.get('/', authorize('PIC', 'Audit'), ctrl.getTemplate)

// PUT /api/subfolder-template
router.put('/', authorize('PIC'), ctrl.saveTemplate)

module.exports = router
