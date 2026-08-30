const express = require('express');
const db = require('../db');

const router = express.Router();

// ---------------------------------------------------------------------------
// PUBLIC routes — deliberately no requireAuth. These power the public
// marketing website, so only return data safe for anyone on the internet
// to see: no phone numbers, no internal IDs beyond what's needed to render
// a card, no admin-only fields.
// ---------------------------------------------------------------------------

// Recent reviews with comments, for the testimonials section. Only ratings
// that actually have a comment are useful here — a bare star rating with no
// text doesn't make a good testimonial card.
router.get('/reviews', (req, res) => {
  const reviews = db
    .prepare(
      `SELECT r.stars, r.comment, r.created_at,
              u.name as customer_name,
              sc.name as category_name
       FROM ratings r
       JOIN users u ON u.id = r.customer_id
       JOIN workers w ON w.id = r.worker_id
       JOIN service_categories sc ON sc.id = w.category_id
       WHERE r.comment IS NOT NULL AND r.comment != '' AND r.stars >= 4
       ORDER BY r.created_at DESC
       LIMIT 12`
    )
    .all();

  // First name + last initial only — a real testimonial should still give
  // some privacy to the person being quoted.
  const sanitized = reviews.map((r) => ({
    ...r,
    customer_name: r.customer_name.split(' ')[0] + ' ' + (r.customer_name.split(' ')[1]?.[0] || '') + '.',
  }));

  res.json(sanitized);
});

// Headline stats for the landing page hero/trust section.
router.get('/stats', (req, res) => {
  const verified_workers = db.prepare(`SELECT COUNT(*) as n FROM workers WHERE verification_status = 'verified'`).get().n;
  const completed_bookings = db.prepare(`SELECT COUNT(*) as n FROM bookings WHERE status = 'completed'`).get().n;
  const avgRatingRow = db.prepare(`SELECT AVG(stars) as avg FROM ratings`).get();
  const categories = db.prepare(`SELECT name, base_rate FROM service_categories`).all();

  res.json({
    verified_workers,
    completed_bookings,
    average_rating: avgRatingRow.avg ? Math.round(avgRatingRow.avg * 10) / 10 : null,
    categories,
  });
});

module.exports = router;
