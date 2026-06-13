const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET = 'society_secret_key_2025';

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: 'User not found' });
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Wrong password' });
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name, flat: user.flat }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, flat: user.flat, email: user.email } });
});

router.post('/register', (req, res) => {
  const { name, email, password, flat, phone, status } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare('INSERT INTO users (name,email,password,role,flat,phone) VALUES (?,?,?,?,?,?)').run(name, email, hash, 'resident', flat, phone);
    db.prepare('INSERT INTO members (name,flat,role,phone,email,status,since) VALUES (?,?,?,?,?,?,?)').run(name, flat, 'Resident', phone, email, status || 'owner', new Date().getFullYear().toString());
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

module.exports = router;