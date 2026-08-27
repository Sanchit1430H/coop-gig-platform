const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../utils/auth');

const router = express.Router();

router.post('/', requireAuth, requireRole('customer'), (req, res) => {
  const { booking_id, stars, comment } = req.body;
  if (!booking_id || !stars) return res.status(400).json({ error: 'booking_id and stars required' });

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
  if (!booking) return res.status(404).json({ error: 'booking not found' });
  if (booking.customer_id !== req.user.id) return res.status(403).json({ error: 'not your booking' });
  if (booking.status !== 'completed') return res.status(400).json({ error: 'can only rate completed bookings' });

  const info = db
    .prepare(`INSERT INTO ratings (booking_id, worker_id, customer_id, stars, comment) VALUES (?, ?, ?, ?, ?)`)
    .run(booking_id, booking.worker_id, req.user.id, stars, comment || null);

  // recompute running average directly from ratings table — simplest correct
  // approach at this scale, avoids float drift from incremental updates.
  const agg = db
    .prepare('SELECT AVG(stars) as avg_rating, COUNT(*) as rating_count FROM ratings WHERE worker_id = ?')
    .get(booking.worker_id);

  db.prepare('UPDATE workers SET avg_rating = ?, rating_count = ? WHERE id = ?')
    .run(agg.avg_rating, agg.rating_count, booking.worker_id);

  // Peer Tribunal auto-trigger: a 1-star rating puts the worker into
  // 'show_cause' — NOT an instant ban. They get a chance to submit evidence
  // before peers vote. This is the "Show Cause" behavior described in the
  // project's dispute-resolution feature, run automatically off real data
  // rather than requiring an admin to notice and raise it manually.
  let dispute = null;
  if (stars === 1) {
    const worker = db.prepare('SELECT account_status FROM workers WHERE id = ?').get(booking.worker_id);
    if (worker && worker.account_status === 'active') {
      const disputeInfo = db
        .prepare(
          `INSERT INTO disputes (worker_id, trigger_reason, trigger_rating_id, status)
           VALUES (?, 'low_rating_auto_trigger', ?, 'awaiting_evidence')`
        )
        .run(booking.worker_id, info.lastInsertRowid);
      db.prepare(`UPDATE workers SET account_status = 'show_cause' WHERE id = ?`).run(booking.worker_id);
      dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeInfo.lastInsertRowid);
    }
  }

  res.status(201).json({
    ...db.prepare('SELECT * FROM ratings WHERE id = ?').get(info.lastInsertRowid),
    dispute_triggered: dispute,
  });
});

router.get('/worker/:worker_id', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM ratings WHERE worker_id = ? ORDER BY created_at DESC').all(req.params.worker_id));
});

module.exports = router;
