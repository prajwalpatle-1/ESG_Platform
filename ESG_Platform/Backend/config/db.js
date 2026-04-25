require('dotenv').config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'greenstack',
  password: String(process.env.DB_PASSWORD), // This FORCES it to be a string
  port: process.env.DB_PORT || 5432,
});

// Add this to catch errors on the pool itself
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;