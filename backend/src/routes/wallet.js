const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../utils/auth');

const router = express.Router();

router.get('/:worker_id', requireAuth, (req, res) => {
  const worker = db.prepare('SELECT id, wallet_balance FROM workers WHERE id = ?').get(req.params.worker_id);
  if (!worker) return res.status(404).json({ error: 'worker not found' });

  const transactions = db
    .prepare('SELECT * FROM wallet_transactions WHERE worker_id = ? ORDER BY created_at DESC')
    .all(req.params.worker_id);

  res.json({ worker_id: worker.id, balance: worker.wallet_balance, transactions });
});

// Worker requests an emergency/sick-leave withdrawal from their own wallet.
// No approval workflow for the prototype — real deployment would likely add
// a simple admin review step for large withdrawals.
router.post('/:worker_id/withdraw', requireAuth, requireRole('worker'), (req, res) => {
  const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(req.params.worker_id);
  if (!worker) return res.status(404).json({ error: 'worker not found' });
  if (worker.user_id !== req.user.id) return res.status(403).json({ error: 'not your wallet' });

  const { amount, note } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'positive amount required' });
  if (amount > worker.wallet_balance) return res.status(400).json({ error: 'insufficient wallet balance' });

  const withdraw = db.transaction(() => {
    db.prepare(
      `INSERT INTO wallet_transactions (worker_id, amount, type, note) VALUES (?, ?, 'withdrawal', ?)`
    ).run(worker.id, -amount, note || 'Emergency/sick-leave withdrawal');

    const agg = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM wallet_transactions WHERE worker_id = ?').get(worker.id);
    db.prepare('UPDATE workers SET wallet_balance = ? WHERE id = ?').run(agg.total, worker.id);
    return agg.total;
  });

  const newBalance = withdraw();
  res.json({ worker_id: worker.id, new_balance: newBalance });
});

module.exports = router;
