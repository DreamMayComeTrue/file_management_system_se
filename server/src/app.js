const express = require('express')
const cors    = require('cors')

const authRoutes      = require('./routes/authRoutes')
const subjectRoutes   = require('./routes/subjectRoutes')
const sectionRoutes   = require('./routes/sectionRoutes')
const fileRoutes      = require('./routes/fileRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const auditRoutes     = require('./routes/auditRoutes')

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth',      authRoutes)
app.use('/api/subjects',  subjectRoutes)
app.use('/api/sections',  sectionRoutes)
app.use('/api/subfolders',fileRoutes)
app.use('/api/files',     fileRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/audit-log', auditRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

module.exports = app
