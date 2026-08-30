const express = require('express');
const db = require('../db');
const { requireAuth } = require('../utils/auth');
const { diagnoseIssue } = require('../ai/diagnosis');

const router = express.Router();

// Demo-scale only: storing photo as base64 directly in SQLite. Fine for a
// handful of prototype bookings, NOT how you'd do this in production (you'd
// upload to real object storage — S3/Cloudinary/etc — and store a URL).
// Capped to keep the demo database from bloating.
const MAX_PHOTO_BASE64_CHARS = 2_000_000; // ~1.5MB image

router.post('/:bookingId/diagnose', requireAuth, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.bookingId);
  if (!booking) return res.status(404).json({ error: 'booking not found' });

  const { description, photo_base64 } = req.body;
  if (!description && !photo_base64) {
    return res.status(400).json({ error: 'provide at least a description or a photo' });
  }
  if (photo_base64 && photo_base64.length > MAX_PHOTO_BASE64_CHARS) {
    return res.status(413).json({ error: 'photo too large for this prototype (try a smaller/compressed image)' });
  }

  const result = diagnoseIssue({ description, photoBase64: photo_base64 });

  db.prepare(
    `UPDATE bookings SET issue_description = ?, issue_photo_base64 = ?, ai_prediagnosis = ?, ai_diagnosis_method = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(description || null, photo_base64 || null, result.predicted_issue, result.method, booking.id);

  res.json({
    booking_id: booking.id,
    predicted_issue: result.predicted_issue,
    photo_note: result.photo_note,
    method: result.method,
    disclaimer: 'This is an automated pattern-matching estimate, not a certified diagnosis. The worker will confirm on arrival.',
  });
});

router.get('/:bookingId/diagnose', requireAuth, (req, res) => {
  const booking = db
    .prepare('SELECT id, issue_description, ai_prediagnosis, ai_diagnosis_method, issue_photo_base64 FROM bookings WHERE id = ?')
    .get(req.params.bookingId);
  if (!booking) return res.status(404).json({ error: 'booking not found' });

  res.json({
    booking_id: booking.id,
    issue_description: booking.issue_description,
    ai_prediagnosis: booking.ai_prediagnosis,
    method: booking.ai_diagnosis_method,
    has_photo: !!booking.issue_photo_base64,
  });
});

module.exports = router;
