const Subfolder  = require('../models/Subfolder')
const asyncHandler = require('../utils/asyncHandler')

// GET /api/subfolder-template
exports.getTemplate = asyncHandler(async (req, res) => {
  const template = await Subfolder.getTemplate()
  res.json(template)
})

// PUT /api/subfolder-template  — body: { names: ['Assessment 1', 'Assignment', ...] }
exports.saveTemplate = asyncHandler(async (req, res) => {
  const { names } = req.body
  if (!Array.isArray(names)) {
    return res.status(400).json({ message: 'names must be an array of strings' })
  }
  await Subfolder.saveTemplate(names.filter(n => typeof n === 'string' && n.trim()))
  res.json({ message: 'Template saved' })
})
