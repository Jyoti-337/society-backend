const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM finances ORDER BY date DESC').all());
});

router.get('/summary', auth, (req, res) => {
  const income = db.prepare("SELECT SUM(amount) as total FROM finances WHERE type='income'").get();
  const expense = db.prepare("SELECT SUM(amount) as total FROM finances WHERE type='expense'").get();
  const byCategory = db.prepare("SELECT category,SUM(amount) as total FROM finances WHERE type='expense' GROUP BY category").all();
  res.json({ income: income.total || 0, expense: expense.total || 0, balance: (income.total || 0) - (expense.total || 0), byCategory });
});

router.post('/', auth, (req, res) => {
  const { type, category, description, amount, date, approved_by } = req.body;
  const result = db.prepare('INSERT INTO finances (type,category,description,amount,date,approved_by) VALUES (?,?,?,?,?,?)').run(type, category, description, amount, date, approved_by);
  res.json({ success: true, id: result.lastInsertRowid });
});

module.exports = router;