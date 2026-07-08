import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// --- Configuration de la base de données (fichier JSON local) ---
const adapter = new JSONFile('server/db.json');
const db = new Low(adapter, { users: [] });
await db.read();
db.data ||= { users: [] };

// --- Configuration du serveur ---
const app = express();
const PORT = 4000;

app.use(bodyParser.json());
app.use(session({
  secret: 'change-cette-cle-secrete-plus-tard',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // session valide 1h
}));

// --- Route SIGN UP ---
app.post('/api/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  await db.read();

  const existingUser = db.data.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.data.users.push({
    id: Date.now().toString(),
    firstName,
    lastName,
    email,
    password: hashedPassword
  });
  await db.write();

  res.status(201).json({ message: 'Compte créé avec succès' });
});

// --- Route LOGIN ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  await db.read();

  const user = db.data.users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.firstName = user.firstName;
  req.session.lastName = user.lastName;

  res.json({
    message: 'Connexion réussie',
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  });
});

// --- Route pour vérifier si connecté ---
app.get('/api/me', (req, res) => {
  res.set('Cache-Control', 'no-store'); // empêche le navigateur de mettre cette réponse en cache

  if (!req.session.userId) {
    return res.status(401).json({ error: 'Non connecté' });
  }

  res.json({
    email: req.session.email,
    firstName: req.session.firstName,
    lastName: req.session.lastName
  });
});

// --- Route LOGOUT ---
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Déconnecté' });
});

// --- Démarrage du serveur ---
app.listen(PORT, () => {
  console.log(`✅ Serveur backend démarré sur http://localhost:${PORT}`);
});