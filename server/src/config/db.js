const mysql = require('mysql2/promise')

// IMPORTANT: timezone: 'Z' tells mysql2 to interpret stored DATETIME values as
// UTC (which is what Railway MySQL writes via CURRENT_TIMESTAMP). Without this
// the driver assumes the DB string is in Node's local zone, which corrupts
// every timestamp by the local UTC offset (e.g. 8h off in Malaysia).
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: 'Z',
  dateStrings: false,
  waitForConnections: true,
  connectionLimit:    10,
})

module.exports = pool
