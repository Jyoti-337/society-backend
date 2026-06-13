const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM events ORDER BY date ASC').all());
});

router.post('/', auth, (req, res) => {
  const { title, date, time, location, capacity, category, description } = req.body;
  const result = db.prepare('INSERT INTO events (title,date,time,location,capacity,category,description) VALUES (?,?,?,?,?,?,?)').run(title, date, time, location, capacity || 50, category || 'general', description);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id/rsvp', auth, (req, res) => {
  db.prepare('UPDATE events SET rsvp=rsvp+1 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM events WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;