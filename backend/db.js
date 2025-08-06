const { Pool } = require('pg');

const pool = new Pool({
  user: 'devopsuser',
  host: 'localhost',
  database: 'testflow',
  password: 'LarryTaint@03',
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
}; 