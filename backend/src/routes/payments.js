const express = require('express');
const db = require('../db');
const { requireAuth } = require('../utils/auth');

const router = express.Router();

// ---------------------------------------------------------------------------
// "ZERO-MIDDLEMAN" PRICING MODEL
// The worker's labor_cost is fixed — it is the amount the worker quoted/
// the category's reference rate, and it is NEVER reduced. Unlike competitor
// platforms that take a cut OUT of what the customer pays (e.g. customer
// pays ₹500, worker gets ₹450), this platform ADDS its fee and the wallet
// contribution ON TOP of the worker's full rate. The worker always receives
// exactly what they quoted.
//
// Example: labor_cost ₹400 → customer pays ₹400 + ₹10 (wallet) + ₹20 (fee)
// = ₹430 total. Worker gets the full ₹400, plus ₹10 lands in their
// Micro-Benefits Wallet as an emergency/sick-leave fund.
// ---------------------------------------------------------------------------
const WALLET_CONTRIBUTION_RATE = 0.025; // 2.5% of labor cost -> worker's wallet
const PLATFORM_FEE_RATE = 0.05;         // 5% of labor cost -> cooperative maintenance

router.post('/', requireAuth, (req, res) => {
  const { booking_id, labor_cost } = req.body;
  if (!booking_id || !labor_cost) {
    return res.status(400).json({ error: 'booking_id and labor_cost required' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
  if (!booking) return res.status(404).json({ error: 'booking not found' });
  if (!booking.worker_id) return res.status(400).json({ error: 'booking has no matched worker' });

  const round2 = (n) => Math.round(n * 100) / 100;
  const wallet_contribution = round2(labor_cost * WALLET_CONTRIBUTION_RATE);
  const platform_fee = round2(labor_cost * PLATFORM_FEE_RATE);
  const customer_total = round2(labor_cost + wallet_contribution + platform_fee);
  const worker_payout = labor_cost; // fixed, untouched — the whole point of this model
  const invoice_number = `INV-${Date.now()}-${booking_id}`;

  // NOTE: this is a Razorpay TEST-MODE stub. Real integration replaces the
  // fields below with actual razorpay.orders.create() + webhook verification.
  const fake_order_id = `order_mock_${Date.now()}`;
  const fake_payment_id = `pay_mock_${Date.now()}`;

  const insertPayment = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO payments
         (booking_id, labor_cost, wallet_contribution, platform_fee, customer_total, worker_payout, status, razorpay_order_id, razorpay_payment_id, invoice_number)
         VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?)`
      )
      .run(booking_id, labor_cost, wallet_contribution, platform_fee, customer_total, worker_payout, fake_order_id, fake_payment_id, invoice_number);

    // Credit the worker's Micro-Benefits Wallet.
    db.prepare(
      `INSERT INTO wallet_transactions (worker_id, amount, type, booking_id, note)
       VALUES (?, ?, 'booking_contribution', ?, ?)`
    ).run(booking.worker_id, wallet_contribution, booking_id, `Contribution from booking #${booking_id}`);

    const walletAgg = db
      .prepare('SELECT COALESCE(SUM(amount),0) as total FROM wallet_transactions WHERE worker_id = ?')
      .get(booking.worker_id);
    db.prepare('UPDATE workers SET wallet_balance = ? WHERE id = ?').run(walletAgg.total, booking.worker_id);

    db.prepare(`UPDATE bookings SET price_quoted = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(customer_total, booking_id);

    return info.lastInsertRowid;
  });

  const paymentId = insertPayment();
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);

  // Competitor comparison for the app to display directly — this is the
  // core pitch number, computed live rather than hardcoded in the UI.
  const competitor_estimate = round2(labor_cost * 1.30); // typical 25-30% commission platforms

  res.status(201).json({
    ...payment,
    breakdown: {
      labor_cost,
      wallet_contribution,
      platform_fee,
      customer_total,
    },
    competitor_estimate,
    savings_vs_competitor: round2(competitor_estimate - customer_total),
    note: 'TEST MODE — no real money moved',
  });
});

router.get('/invoice/:booking_id', requireAuth, (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(req.params.booking_id);
  if (!payment) return res.status(404).json({ error: 'no payment found for this booking' });
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.booking_id);
  res.json({ ...payment, booking });
});

module.exports = router;
