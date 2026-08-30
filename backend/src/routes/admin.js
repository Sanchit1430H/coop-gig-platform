const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../utils/auth');

const router = express.Router();

router.post('/federations', requireAuth, requireRole('federation_admin'), (req, res) => {
  const { name, region } = req.body;
  const info = db.prepare('INSERT INTO federations (name, region) VALUES (?, ?)').run(name, region || null);
  res.status(201).json(db.prepare('SELECT * FROM federations WHERE id = ?').get(info.lastInsertRowid));
});

router.post('/societies', requireAuth, requireRole('federation_admin'), (req, res) => {
  const { federation_id, name, city } = req.body;
  const info = db
    .prepare('INSERT INTO societies (federation_id, name, city) VALUES (?, ?, ?)')
    .run(federation_id, name, city || null);
  res.status(201).json(db.prepare('SELECT * FROM societies WHERE id = ?').get(info.lastInsertRowid));
});

router.get('/societies', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM societies').all());
});

router.post('/categories', requireAuth, requireRole('federation_admin'), (req, res) => {
  const { name, base_rate } = req.body;
  const info = db.prepare('INSERT INTO service_categories (name, base_rate) VALUES (?, ?)').run(name, base_rate);
  res.status(201).json(db.prepare('SELECT * FROM service_categories WHERE id = ?').get(info.lastInsertRowid));
});

router.get('/categories', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM service_categories').all());
});

// Dashboard summary — pending verifications, active bookings, revenue split.
router.get('/dashboard', requireAuth, requireRole('society_admin', 'federation_admin'), (req, res) => {
  const pending_verifications = db.prepare(`SELECT COUNT(*) as n FROM workers WHERE verification_status = 'pending'`).get().n;
  const active_bookings = db.prepare(`SELECT COUNT(*) as n FROM bookings WHERE status IN ('matched','accepted','in_progress')`).get().n;
  const completed_bookings = db.prepare(`SELECT COUNT(*) as n FROM bookings WHERE status = 'completed'`).get().n;
  const revenue = db.prepare(`SELECT COALESCE(SUM(customer_total),0) as gross, COALESCE(SUM(platform_fee),0) as commission, COALESCE(SUM(wallet_contribution),0) as wallet_total FROM payments WHERE status = 'paid'`).get();
  const insured_workers = db.prepare(`SELECT COUNT(*) as n FROM workers WHERE insurance_enrolled = 1`).get().n;
  const total_verified_workers = db.prepare(`SELECT COUNT(*) as n FROM workers WHERE verification_status = 'verified'`).get().n;

  res.json({
    pending_verifications,
    active_bookings,
    completed_bookings,
    gross_revenue: revenue.gross,
    cooperative_commission: revenue.commission,
    total_wallet_contributions: revenue.wallet_total,
    insured_workers,
    total_verified_workers,
  });
});

// ---------------------------------------------------------------------------
// DEMAND FORECAST — STUB, explicitly labeled.
// This is a moving-average over whatever booking history exists in THIS
// demo DB (which will mostly be seed/test data). It is a proof-of-concept
// of the *pipeline* (bookings -> aggregation -> per-category, per-day
// projection), not a validated forecasting model. Say this out loud in
// the demo — don't let anyone infer more accuracy than exists.
// ---------------------------------------------------------------------------
router.get('/forecast', requireAuth, requireRole('society_admin', 'federation_admin'), (req, res) => {
  const rows = db
    .prepare(
      `SELECT sc.name as category, DATE(b.created_at) as day, COUNT(*) as bookings
       FROM bookings b JOIN service_categories sc ON sc.id = b.category_id
       GROUP BY sc.name, DATE(b.created_at)
       ORDER BY sc.name, day`
    )
    .all();

  const byCategory = {};
  for (const row of rows) {
    (byCategory[row.category] ||= []).push(row);
  }

  const forecast = Object.entries(byCategory).map(([category, series]) => {
    const recent = series.slice(-7); // last 7 data points as the "window"
    const avg = recent.reduce((s, r) => s + r.bookings, 0) / (recent.length || 1);
    return {
      category,
      historical_points: series.length,
      naive_next_day_estimate: Math.round(avg * 10) / 10,
      method: '7-point moving average (demo pipeline, not a trained model)',
    };
  });

  res.json({
    disclaimer: 'Proof-of-concept forecast on this demo database only. Not production-validated.',
    forecast,
  });
});

module.exports = router;
