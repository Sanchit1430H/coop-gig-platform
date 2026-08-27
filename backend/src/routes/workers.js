const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../utils/auth');

const router = express.Router();

// Worker creates their skill profile (post-registration as a 'worker' user).
router.post('/', requireAuth, requireRole('worker'), (req, res) => {
  const { society_id, category_id, experience_years, bio, certificate_url } = req.body;
  if (!society_id || !category_id) {
    return res.status(400).json({ error: 'society_id and category_id are required' });
  }

  const already = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.user.id);
  if (already) return res.status(409).json({ error: 'worker profile already exists for this user' });

  const info = db
    .prepare(
      `INSERT INTO workers (user_id, society_id, category_id, experience_years, bio, certificate_url)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, society_id, category_id, experience_years || 0, bio || null, certificate_url || null);

  const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(worker);
});

// Federation/society admin verifies (or rejects) a worker.
router.patch('/:id/verify', requireAuth, requireRole('society_admin', 'federation_admin'), (req, res) => {
  const { status } = req.body; // 'verified' | 'rejected'
  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "status must be 'verified' or 'rejected'" });
  }

  const result = db
    .prepare(
      `UPDATE workers SET verification_status = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .run(status, req.user.id, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'worker not found' });
  res.json(db.prepare('SELECT * FROM workers WHERE id = ?').get(req.params.id));
});

// Worker toggles availability + updates live location.
router.patch('/:id/availability', requireAuth, requireRole('worker'), (req, res) => {
  const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(req.params.id);
  if (!worker) return res.status(404).json({ error: 'worker not found' });
  if (worker.user_id !== req.user.id) return res.status(403).json({ error: 'not your worker profile' });

  const { is_available, lat, lng } = req.body;
  db.prepare(
    `UPDATE workers SET is_available = ?, lat = ?, lng = ?, last_location_update = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(is_available ? 1 : 0, lat ?? worker.lat, lng ?? worker.lng, req.params.id);

  res.json(db.prepare('SELECT * FROM workers WHERE id = ?').get(req.params.id));
});

// Stubbed welfare/insurance enrollment toggle (see README for what's real vs mocked).
router.patch('/:id/insurance', requireAuth, requireRole('worker', 'society_admin', 'federation_admin'), (req, res) => {
  db.prepare('UPDATE workers SET insurance_enrolled = 1 WHERE id = ?').run(req.params.id);
  res.json(db.prepare('SELECT * FROM workers WHERE id = ?').get(req.params.id));
});

// List workers, filterable by category/status — used by admin dashboard.
router.get('/', requireAuth, (req, res) => {
  const { category_id, verification_status, society_id } = req.query;
  let query = `
    SELECT w.*, u.name, u.phone, sc.name as category_name, s.name as society_name
    FROM workers w
    JOIN users u ON u.id = w.user_id
    JOIN service_categories sc ON sc.id = w.category_id
    JOIN societies s ON s.id = w.society_id
    WHERE 1=1
  `;
  const params = [];
  if (category_id) { query += ' AND w.category_id = ?'; params.push(category_id); }
  if (verification_status) { query += ' AND w.verification_status = ?'; params.push(verification_status); }
  if (society_id) { query += ' AND w.society_id = ?'; params.push(society_id); }

  res.json(db.prepare(query).all(...params));
});

module.exports = router;
