const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  res.json(db.prepare('SELECT * FROM visitors WHERE date=? ORDER BY id DESC').all(date));
});

router.get('/all', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM visitors ORDER BY id DESC LIMIT 100').all());
});

router.post('/', auth, (req, res) => {
  const { name, flat, purpose, phone, guard } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const timeIn = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const result = db.prepare('INSERT INTO visitors (name,flat,purpose,phone,time_in,guard,status,date) VALUES (?,?,?,?,?,?,?,?)').run(name, flat, purpose, phone, timeIn, guard || 'Guard', 'pending', today);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id/approve', auth, (req, res) => {
  db.prepare('UPDATE visitors SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ success: true });
});

router.put('/:id/checkout', auth, (req, res) => {
  const timeOut = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  db.prepare('UPDATE visitors SET time_out=?,status=? WHERE id=?').run(timeOut, 'approved', req.params.id);
  res.json({ success: true });
});

module.exports = router;