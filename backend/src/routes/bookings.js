const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../utils/auth');
const { findNearestWorkers } = require('../utils/geo');

const router = express.Router();

const SEARCH_RADIUS_KM = { normal: 8, emergency: 20 };

// Customer creates a booking. Server immediately attempts a match.
router.post('/', requireAuth, requireRole('customer'), (req, res) => {
  const {
    category_id,
    is_emergency,
    scheduled_at,
    customer_lat,
    customer_lng,
    address_text,
  } = req.body;

  if (!category_id || customer_lat == null || customer_lng == null) {
    return res.status(400).json({ error: 'category_id, customer_lat, customer_lng are required' });
  }
  if (!is_emergency && !scheduled_at) {
    return res.status(400).json({ error: 'scheduled_at required for non-emergency bookings' });
  }

  const info = db
    .prepare(
      `INSERT INTO bookings (customer_id, category_id, is_emergency, scheduled_at, customer_lat, customer_lng, address_text)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      category_id,
      is_emergency ? 1 : 0,
      scheduled_at || null,
      customer_lat,
      customer_lng,
      address_text || null
    );

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
  const matchResult = attemptMatch(booking);
  res.status(201).json(matchResult);
});

// Core matching logic, isolated so it's easy to swap for the PostGIS query
// later without touching route handling.
function attemptMatch(booking) {
  const radius = booking.is_emergency ? SEARCH_RADIUS_KM.emergency : SEARCH_RADIUS_KM.normal;

  const candidates = db
    .prepare(
      `SELECT * FROM workers
       WHERE category_id = ? AND is_available = 1 AND verification_status = 'verified' AND account_status = 'active'
       AND lat IS NOT NULL AND lng IS NOT NULL`
    )
    .all(booking.category_id);

  const nearby = findNearestWorkers(candidates, booking.customer_lat, booking.customer_lng, radius);

  if (nearby.length === 0) {
    db.prepare(`UPDATE bookings SET status = 'no_match', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(booking.id);
    return { booking: { ...booking, status: 'no_match' }, matched_worker: null, candidates_considered: 0 };
  }

  // Rank by distance first, rating as tiebreaker within 1km — favors nearby
  // AND reliable rather than pure nearest-neighbor.
  nearby.sort((a, b) => {
    const distDiff = a.distance_km - b.distance_km;
    if (Math.abs(distDiff) < 1) return b.avg_rating - a.avg_rating;
    return distDiff;
  });

  const best = nearby[0];
  db.prepare(
    `UPDATE bookings SET worker_id = ?, status = 'matched', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(best.id, booking.id);

  return {
    booking: { ...booking, worker_id: best.id, status: 'matched' },
    matched_worker: best,
    candidates_considered: nearby.length,
  };
}

// Worker accepts or declines a matched booking. On decline, re-run matching
// excluding this worker.
router.patch('/:id/respond', requireAuth, requireRole('worker'), (req, res) => {
  const { action } = req.body; // 'accept' | 'decline'
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'booking not found' });

  if (action === 'accept') {
    db.prepare(`UPDATE bookings SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(booking.id);
    return res.json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id));
  }

  if (action === 'decline') {
    const candidates = db
      .prepare(
        `SELECT * FROM workers
         WHERE category_id = ? AND is_available = 1 AND verification_status = 'verified' AND account_status = 'active'
         AND lat IS NOT NULL AND lng IS NOT NULL AND id != ?`
      )
      .all(booking.category_id, booking.worker_id);

    const radius = booking.is_emergency ? SEARCH_RADIUS_KM.emergency : SEARCH_RADIUS_KM.normal;
    const nearby = findNearestWorkers(candidates, booking.customer_lat, booking.customer_lng, radius);

    if (nearby.length === 0) {
      db.prepare(`UPDATE bookings SET status = 'no_match', worker_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(booking.id);
      return res.json({ status: 'no_match', matched_worker: null });
    }
    const best = nearby[0];
    db.prepare(`UPDATE bookings SET worker_id = ?, status = 'matched', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(best.id, booking.id);
    return res.json({ status: 'matched', matched_worker: best });
  }

  res.status(400).json({ error: "action must be 'accept' or 'decline'" });
});

router.patch('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  const allowed = ['in_progress', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });

  db.prepare(`UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id));
});

router.get('/', requireAuth, (req, res) => {
  let query = 'SELECT * FROM bookings WHERE 1=1';
  const params = [];
  if (req.user.role === 'customer') {
    query += ' AND customer_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'worker') {
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.user.id);
    query += ' AND worker_id = ?';
    params.push(worker ? worker.id : -1);
  }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

module.exports = router;
