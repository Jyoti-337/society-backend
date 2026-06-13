const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM members ORDER BY id').all());
});

router.post('/', auth, (req, res) => {
  const { name, flat, role, phone, email, status, since } = req.body;
  const result = db.prepare('INSERT INTO members (name,flat,role,phone,email,status,since) VALUES (?,?,?,?,?,?,?)').run(name, flat, role, phone, email, status, since || '2025');
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.put('/:id', auth, (req, res) => {
  const { name, flat, role, phone, email, status } = req.body;
  db.prepare('UPDATE members SET name=?,flat=?,role=?,phone=?,email=?,status=? WHERE id=?').run(name, flat, role, phone, email, status, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM members WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;