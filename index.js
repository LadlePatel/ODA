const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // for parsing JSON bodies

const pool = new Pool({
  connectionString: 'postgresql://postgres:VZWkpNPZjlRsWQojvvuZqIeeNXgngbXr@gondola.proxy.rlwy.net:42788/railway',
  ssl: { rejectUnauthorized: false }
});

// Create 'users' table if not exists
async function initializeUsersTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        balance REAL DEFAULT 1000
      );
    `);
    console.log("✅ Users table ready");
  } catch (err) {
    console.error("❌ Error initializing users table:", err);
  } finally {
    client.release();
  }
}

// Call on server start
initializeUsersTable();

// ✅ Create Account
app.post('/create-account', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, balance`,
      [name, email, password]
    );
    res.json({
      message: 'Account created successfully',
      user: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ message: 'Email already exists' });
    } else {
      console.error(err);
      res.status(500).json({ message: 'Internal error' });
    }
  }
});

// ✅ Check Balance
app.post('/check-balance', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required.' });
  }

  try {
    const result = await pool.query(
      `SELECT name, balance FROM users WHERE email = $1 AND password = $2`,
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    res.json({
      message: `Welcome ${user.name}, your balance is ₹${user.balance}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal error' });
  }
});

app.listen(port, () => {
  console.log(`🟢 API running on port ${port}`);
});
