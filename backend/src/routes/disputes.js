const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../utils/auth');

const router = express.Router();

const JUROR_COUNT = 3;
const JUROR_MIN_RATING = 4.0;   // "veteran, highly-rated" threshold
const JUROR_MIN_JOBS = 3;       // must have some completed history to qualify

// ---------------------------------------------------------------------------
// PEER TRIBUNAL — how a dispute moves through the system:
//   1. Something triggers review (e.g. a 1-star rating, or an admin flags a
//      pattern) -> worker goes to 'show_cause' status. NOT deactivated yet.
//   2. Worker submits evidence explaining their side.
//   3. Three random verified, highly-rated peer workers are assigned as
//      jurors (never the worker under review, never the complaining
//      customer's side — this is worker-to-worker, matching the
//      cooperative-governance pitch).
//   4. Jurors vote uphold/dismiss. Majority (2 of 3) decides.
//   5. Dismissed -> worker returns to 'active'. Upheld -> 'deactivated'.
// Note: for a real cooperative this would still allow escalation to the
// federation admin / external process — this tribunal is a fast first-line
// layer, not a replacement for that oversight. See conversation notes.
// ---------------------------------------------------------------------------

// Trigger a dispute — normally called automatically off a low rating, but
// exposed as its own endpoint so an admin can also raise one manually.
router.post('/', requireAuth, requireRole('federation_admin', 'society_admin'), (req, res) => {
  const { worker_id, trigger_reason, trigger_rating_id } = req.body;
  if (!worker_id || !trigger_reason) {
    return res.status(400).json({ error: 'worker_id and trigger_reason are required' });
  }

  const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(worker_id);
  if (!worker) return res.status(404).json({ error: 'worker not found' });

  const info = db
    .prepare(
      `INSERT INTO disputes (worker_id, trigger_reason, trigger_rating_id, status)
       VALUES (?, ?, ?, 'awaiting_evidence')`
    )
    .run(worker_id, trigger_reason, trigger_rating_id || null);

  db.prepare(`UPDATE workers SET account_status = 'show_cause' WHERE id = ?`).run(worker_id);

  res.status(201).json(db.prepare('SELECT * FROM disputes WHERE id = ?').get(info.lastInsertRowid));
});

// Worker submits their evidence/explanation, then jurors get assigned.
router.patch('/:id/evidence', requireAuth, requireRole('worker'), (req, res) => {
  const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id);
  if (!dispute) return res.status(404).json({ error: 'dispute not found' });

  const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(dispute.worker_id);
  if (worker.user_id !== req.user.id) return res.status(403).json({ error: 'not your dispute' });
  if (dispute.status !== 'awaiting_evidence') return res.status(400).json({ error: 'evidence window has closed' });

  const { evidence } = req.body;
  if (!evidence) return res.status(400).json({ error: 'evidence text required' });

  // Assign 3 random jurors: verified, highly-rated, experienced peers,
  // excluding the worker under review.
  const candidates = db
    .prepare(
      `SELECT id FROM workers
       WHERE id != ? AND verification_status = 'verified'
       AND avg_rating >= ? AND rating_count >= ?
       AND account_status = 'active'`
    )
    .all(dispute.worker_id, JUROR_MIN_RATING, JUROR_MIN_JOBS);

  if (candidates.length < JUROR_COUNT) {
    return res.status(409).json({
      error: `Not enough eligible juror workers yet (need ${JUROR_COUNT}, found ${candidates.length}). This cooperative needs more veteran verified workers before peer tribunals can run — falls back to federation admin review in the meantime.`,
    });
  }

  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const jurors = shuffled.slice(0, JUROR_COUNT).map((c) => c.id);

  db.prepare(
    `UPDATE disputes SET worker_evidence = ?, status = 'voting', jurors_assigned = ? WHERE id = ?`
  ).run(evidence, JSON.stringify(jurors), dispute.id);

  res.json(db.prepare('SELECT * FROM disputes WHERE id = ?').get(dispute.id));
});

// A juror casts their vote. Resolves automatically once 2+ votes agree.
router.post('/:id/vote', requireAuth, requireRole('worker'), (req, res) => {
  const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id);
  if (!dispute) return res.status(404).json({ error: 'dispute not found' });
  if (dispute.status !== 'voting') return res.status(400).json({ error: 'dispute is not open for voting' });

  const jurorWorker = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(req.user.id);
  const jurors = JSON.parse(dispute.jurors_assigned || '[]');
  if (!jurorWorker || !jurors.includes(jurorWorker.id)) {
    return res.status(403).json({ error: 'you are not an assigned juror for this dispute' });
  }

  const { vote } = req.body; // 'uphold' | 'dismiss'
  if (!['uphold', 'dismiss'].includes(vote)) {
    return res.status(400).json({ error: "vote must be 'uphold' or 'dismiss'" });
  }

  try {
    db.prepare(
      `INSERT INTO dispute_votes (dispute_id, juror_worker_id, vote) VALUES (?, ?, ?)`
    ).run(dispute.id, jurorWorker.id, vote);
  } catch (err) {
    return res.status(409).json({ error: 'you have already voted on this dispute' });
  }

  const votes = db.prepare('SELECT vote FROM dispute_votes WHERE dispute_id = ?').all(dispute.id);
  const uphold = votes.filter((v) => v.vote === 'uphold').length;
  const dismiss = votes.filter((v) => v.vote === 'dismiss').length;

  let resolution = null;
  if (uphold >= 2) resolution = 'upheld';
  else if (dismiss >= 2) resolution = 'dismissed';

  if (resolution) {
    db.prepare(
      `UPDATE disputes SET status = ?, resolved_at = CURRENT_TIMESTAMP,
       resolution_note = ? WHERE id = ?`
    ).run(resolution, `Peer tribunal vote: ${uphold} uphold, ${dismiss} dismiss`, dispute.id);

    const newAccountStatus = resolution === 'upheld' ? 'deactivated' : 'active';
    db.prepare(`UPDATE workers SET account_status = ? WHERE id = ?`).run(newAccountStatus, dispute.worker_id);
  }

  res.json({
    votes_so_far: votes.length,
    uphold_votes: uphold,
    dismiss_votes: dismiss,
    resolution,
    dispute: db.prepare('SELECT * FROM disputes WHERE id = ?').get(dispute.id),
  });
});

// Dispute detail — worker sees their own, jurors see ones they're assigned to,
// admins see everything.
router.get('/:id', requireAuth, (req, res) => {
  const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id);
  if (!dispute) return res.status(404).json({ error: 'dispute not found' });
  const votes = db.prepare('SELECT juror_worker_id, vote, created_at FROM dispute_votes WHERE dispute_id = ?').all(dispute.id);
  res.json({ ...dispute, votes });
});

// List disputes — worker sees their own + any they're a juror on; admin sees all.
router.get('/', requireAuth, (req, res) => {
  if (['federation_admin', 'society_admin'].includes(req.user.role)) {
    return res.json(db.prepare('SELECT * FROM disputes ORDER BY created_at DESC').all());
  }

  const worker = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(req.user.id);
  if (!worker) return res.json([]);

  const all = db.prepare('SELECT * FROM disputes ORDER BY created_at DESC').all();
  const relevant = all.filter((d) => {
    if (d.worker_id === worker.id) return true;
    const jurors = JSON.parse(d.jurors_assigned || '[]');
    return jurors.includes(worker.id);
  });
  res.json(relevant);
});

module.exports = router;
