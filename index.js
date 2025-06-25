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

// 🔁 Check & populate cities on startup
async function initializeCitiesTable() {
  const client = await pool.connect();
  try {
    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );
    `);

    // Check if table has any data
    const result = await client.query('SELECT COUNT(*) FROM cities');
    const count = parseInt(result.rows[0].count, 10);

    if (count === 0) {
      console.log("Inserting default Saudi cities...");
      const defaultCities = [
        'Riyadh',
        'Jeddah',
        'Dammam',
        'Mecca',
        'Medina',
        'Abha'
      ];

      for (const city of defaultCities) {
        await client.query('INSERT INTO cities (name) VALUES ($1) ON CONFLICT DO NOTHING', [city]);
      }
    } else {
      console.log(`Cities table already has ${count} records.`);
    }
  } catch (err) {
    console.error("Error initializing cities table:", err);
  } finally {
    client.release();
  }
}

// Initialize on start
initializeCitiesTable();

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
