const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../utils/auth');

const router = express.Router();

// NOTE: real deployment should replace password login with phone OTP
// (e.g. Firebase Auth / MSG91) since that's the realistic auth method for
// this user base. Password auth here is a prototype convenience only.

router.post('/register', (req, res) => {
  const { phone, name, password, role, preferred_language } = req.body;
  if (!phone || !name || !password || !role) {
    return res.status(400).json({ error: 'phone, name, password, role are required' });
  }
  if (!['customer', 'worker', 'society_admin', 'federation_admin'].includes(role)) {
    return res.status(400).json({ error: 'invalid role' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) return res.status(409).json({ error: 'phone already registered' });

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      `INSERT INTO users (phone, name, password_hash, role, preferred_language)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(phone, name, password_hash, role, preferred_language || 'en');

  const user = db.prepare('SELECT id, phone, name, role, preferred_language FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken(user);
  res.status(201).json({ user, token });
});

router.post('/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'phone and password required' });

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = signToken(user);
  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

module.exports = router;
