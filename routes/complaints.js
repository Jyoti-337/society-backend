const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM complaints ORDER BY created_at DESC').all());
});

router.post('/', auth, (req, res) => {
  const { flat, name, category, title, description, priority } = req.body;
  const result = db.prepare('INSERT INTO complaints (flat,name,category,title,description,priority) VALUES (?,?,?,?,?,?)').run(flat, name, category, title, description, priority || 'medium');
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', auth, (req, res) => {
  const { status, note } = req.body;
  db.prepare('UPDATE complaints SET status=?,note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, note, req.params.id);
  res.json({ success: true });
});

module.exports = router;