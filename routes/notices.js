const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM notices ORDER BY created_at DESC').all());
});

router.post('/', auth, (req, res) => {
  const { title, body, type, created_by } = req.body;
  const result = db.prepare('INSERT INTO notices (title,body,type,created_by) VALUES (?,?,?,?)').run(title, body, type || 'info', created_by);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM notices WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;