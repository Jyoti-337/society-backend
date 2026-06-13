const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all());
});

router.post('/', auth, (req, res) => {
  const { flat, name, amount, month, year, method } = req.body;
  const txn = 'TXN' + Date.now();
  const result = db.prepare('INSERT INTO payments (flat,name,amount,month,year,status,method,txn_id,paid_at) VALUES (?,?,?,?,?,?,?,?,?)').run(flat, name, amount, month, year, 'paid', method, txn, new Date().toISOString());
  res.json({ success: true, txn_id: txn, id: result.lastInsertRowid });
});

router.put('/:id/status', auth, (req, res) => {
  db.prepare('UPDATE payments SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ success: true });
});

module.exports = router;