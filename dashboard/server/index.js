import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import connectSqlite3 from 'connect-sqlite3';
import dotenv from 'dotenv';
import path from 'path';

// --- Configuration de l'environnement ---
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SQLiteStore = connectSqlite3(session);
const app = express();
const PORT = 4000;

// --- Database configuration (SQLite) ---
const db = new sqlite3.Database('server/database.sqlite', (err) => {
  if (err) {
    console.error('❌ Error connecting to SQLite database', err);
  } else {
    console.log('✅ Connected to SQLite database');
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'operator'
      )
    `);
    
    // Auto-migrate to add role column if it doesn't exist
    db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'operator'`, (err) => {
      // Ignorer l'erreur si la colonne existe déjà
    });
  }
});

app.use(bodyParser.json());
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: 'server'
  }),
  secret: process.env.SESSION_SECRET || 'fallback-super-secret-key-123',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // session valide 24h
}));

// Helper functions for DB queries
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    err ? reject(err) : resolve(this);
  });
});

// --- Route SIGN UP ---
app.post('/api/signup', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const userRole = role || 'operator';

  try {
    const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({ error: 'An account already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Date.now().toString();

    await dbRun('INSERT INTO users (id, firstName, lastName, email, password, role) VALUES (?, ?, ?, ?, ?, ?)', [
      id, firstName, lastName, email, hashedPassword, userRole
    ]);

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    console.error('SIGN UP Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Route LOGIN ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.firstName = user.firstName;
    req.session.lastName = user.lastName;
    req.session.role = user.role || 'operator';

    res.json({
      message: 'Login successful',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || 'operator'
    });
  } catch (err) {
    console.error('LOGIN Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Check if authenticated ---
app.get('/api/me', (req, res) => {
  res.set('Cache-Control', 'no-store');

  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    email: req.session.email,
    firstName: req.session.firstName,
    lastName: req.session.lastName,
    role: req.session.role || 'operator'
  });
});

// --- LOGOUT Route ---
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Backend server started on http://localhost:${PORT}`);
});