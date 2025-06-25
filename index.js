const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const pool = new Pool({
  connectionString: 'postgresql://postgres:VZWkpNPZjlRsWQojvvuZqIeeNXgngbXr@gondola.proxy.rlwy.net:42788/railway',
  ssl: { rejectUnauthorized: false }
});

app.get('/cities', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT name FROM cities LIMIT 10');
    const cityList = result.rows.map(row => ({ label: row.name, value: row.name }));
    res.json(cityList);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching cities');
  }
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
