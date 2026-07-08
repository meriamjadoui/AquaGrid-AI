require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');                    // ← ADDED

const app = express();
const port = process.env.PORT || 3001;

// Allow frontend to connect
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aquawise',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database');
    connection.release();
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
  }
}
testConnection();

// API endpoint to get the latest sensor data
app.get('/api/system-overview/latest', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM system_overview ORDER BY recorded_at DESC LIMIT 1');
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No data found in system_overview table' });
    }
    // Return the most recent row
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Failed to retrieve data from database' });
  }
});

// ============================================================ // ← ADDED
// ML LEAK PREDICTION — proxies to the Python ml_service.py      // ← ADDED
// ============================================================ // ← ADDED
app.post('/api/predict-leak', async (req, res) => {
  const { currentloss, rollingmeanloss, rollingstdloss, consecutivehigh } = req.body;

  try {
    const response = await axios.post('http://localhost:5001/predict', {
      currentloss,
      rollingmeanloss,
      rollingstdloss,
      consecutivehigh,
    }, { timeout: 3000 });

    return res.json(response.data);
  } catch (err) {
    // Safe fallback: if the Python ML service is down, don't break the
    // dashboard — just report that live prediction is unavailable so the
    // frontend can fall back to the existing rule-based leak_model.js
    console.error('ML service unreachable:', err.message);
    return res.status(503).json({
      error: 'ML service unavailable',
      fallback: true,
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend API running on http://localhost:${port}`);
});