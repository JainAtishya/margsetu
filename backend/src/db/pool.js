const { Pool } = require('pg');
require('dotenv').config();

// using a pool instead of a single connection so we don't block requests
// when lots of users ping the api at the same time
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 10 // max 10 connections at once is enough for now
});

pool.on('error', (err) => {
    console.error('db idle client error:', err);
});

module.exports = pool;
