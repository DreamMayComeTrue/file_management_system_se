const express = require('express')
const cors    = require('cors')

const authRoutes      = require('./routes/authRoutes')
const userRoutes      = require('./routes/userRoutes')
const subjectRoutes   = require('./routes/subjectRoutes')
const sectionRoutes   = require('./routes/sectionRoutes')
const subfolderRoutes = require('./routes/subfolderRoutes')
const fileRoutes      = require('./routes/fileRoutes')
const templateRoutes  = require('./routes/subfolderTemplateRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const auditRoutes     = require('./routes/auditRoutes')
const devRoutes       = require('./routes/devRoutes')

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth',               authRoutes)
app.use('/api/users',              userRoutes)
app.use('/api/subjects',           subjectRoutes)
app.use('/api/sections',           sectionRoutes)
app.use('/api/subfolders',         subfolderRoutes)
app.use('/api/files',              fileRoutes)
app.use('/api/subfolder-template', templateRoutes)
app.use('/api/dashboard',          dashboardRoutes)
app.use('/api/audit-log',          auditRoutes)
app.use('/api/dev',                devRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

module.exports = app
