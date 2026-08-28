console.log("Starting seed script on Render...");
/**
 * Seed script — populates the DB with realistic demo data so the app
 * doesn't look empty during development or in front of judges.
 * Run with: node src/seed.js
 * Safe to re-run: wipes and recreates all tables first.
 */
const bcrypt = require('bcryptjs');
const db = require('./db');
db.pragma('foreign_keys = OFF');

// Wipe existing data
const tables = ['ratings', 'payments', 'bookings', 'workers', 'service_categories', 'societies', 'federations', 'users'];
for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();
db.pragma('foreign_keys = ON');

const hash = (pw) => bcrypt.hashSync(pw, 8);

// --- Federation & societies ---
const fedId = db.prepare('INSERT INTO federations (name, region) VALUES (?, ?)').run('Odisha Labour Coop Federation', 'Odisha').lastInsertRowid;
const societyCuttack = db.prepare('INSERT INTO societies (federation_id, name, city) VALUES (?, ?, ?)').run(fedId, 'Cuttack Workers Society', 'Cuttack').lastInsertRowid;
const societyBBSR = db.prepare('INSERT INTO societies (federation_id, name, city) VALUES (?, ?, ?)').run(fedId, 'Bhubaneswar Workers Society', 'Bhubaneswar').lastInsertRowid;

// --- Categories ---
const categories = [
  ['electrician', 300], ['plumber', 280], ['carpenter', 350], ['painter', 320],
  ['domestic_help', 200], ['caregiver', 400], ['driver', 250], ['gardener', 220],
  ['cleaner', 180], ['technician', 380],
];
const catIds = {};
for (const [name, rate] of categories) {
  catIds[name] = db.prepare('INSERT INTO service_categories (name, base_rate) VALUES (?, ?)').run(name, rate).lastInsertRowid;
}

// --- Admin users ---
const fedAdminId = db.prepare(
  `INSERT INTO users (phone, name, password_hash, role) VALUES (?, ?, ?, 'federation_admin')`
).run('9000000001', 'Fed Admin', hash('pass123')).lastInsertRowid;

// --- Workers: spread across Cuttack area with real-ish lat/lng jitter ---
const CUTTACK_CENTER = { lat: 20.4625, lng: 85.8830 };
const BBSR_CENTER = { lat: 20.2961, lng: 85.8245 };

const workerNames = [
  'Ramesh Sahoo', 'Sunita Behera', 'Ajay Nayak', 'Kiran Patra', 'Manoj Das',
  'Rekha Swain', 'Suresh Rout', 'Pooja Mallick', 'Bikash Jena', 'Anita Pradhan',
  'Deepak Mishra', 'Lata Panda', 'Rajesh Sethi', 'Nirmala Bhoi', 'Sanjay Naik',
];

function jitter(center, kmRadius) {
  const degPerKm = 1 / 111;
  const r = kmRadius * Math.sqrt(Math.random()) * degPerKm;
  const theta = Math.random() * 2 * Math.PI;
  return { lat: center.lat + r * Math.cos(theta), lng: center.lng + r * Math.sin(theta) };
}

const catNames = Object.keys(catIds);
const workerIds = [];

workerNames.forEach((name, i) => {
  const phone = `91111111${String(i + 10).padStart(2, '0')}`;
  const society = i % 3 === 0 ? societyBBSR : societyCuttack;
  const center = society === societyBBSR ? BBSR_CENTER : CUTTACK_CENTER;
  const category = catNames[i % catNames.length];
  const loc = jitter(center, 6);

  const userId = db.prepare(
    `INSERT INTO users (phone, name, password_hash, role) VALUES (?, ?, ?, 'worker')`
  ).run(phone, name, hash('pass123')).lastInsertRowid;

  const verified = i < 12; // most verified, a couple left pending to demo the admin queue
  const experienceYears = 1 + Math.floor(Math.random() * 10);
  const workerId = db.prepare(
    `INSERT INTO workers
     (user_id, society_id, category_id, experience_years, bio, verification_status, verified_by, verified_at, is_available, lat, lng, last_location_update, insurance_enrolled, avg_rating, rating_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId, society, catIds[category],
    experienceYears,
    `${experienceYears} yrs experience in ${category.replace('_', ' ')}`,
    verified ? 'verified' : 'pending',
    verified ? fedAdminId : null,
    verified ? new Date().toISOString() : null,
    verified ? 1 : 0,
    loc.lat, loc.lng,
    new Date().toISOString(),
    Math.random() > 0.4 ? 1 : 0,
    verified ? (3.5 + Math.random() * 1.5).toFixed(1) : 0,
    verified ? 3 + Math.floor(Math.random() * 20) : 0
  ).lastInsertRowid;

  workerIds.push({ id: workerId, category, verified });
});

// --- Customers ---
const customerNames = ['Priya Mohanty', 'Arjun Sahu', 'Neha Tripathy', 'Vikram Choudhury'];
const customerIds = customerNames.map((name, i) =>
  db.prepare(`INSERT INTO users (phone, name, password_hash, role) VALUES (?, ?, ?, 'customer')`)
    .run(`92222222${String(i + 10).padStart(2, '0')}`, name, hash('pass123')).lastInsertRowid
);

// --- Past completed bookings + payments + ratings (so profiles look real, forecast has history) ---
const verifiedWorkers = workerIds.filter((w) => w.verified);
let bookingCount = 0;
for (let d = 6; d >= 0; d--) {
  const bookingsToday = 1 + Math.floor(Math.random() * 3);
  for (let b = 0; b < bookingsToday; b++) {
    const worker = verifiedWorkers[Math.floor(Math.random() * verifiedWorkers.length)];
    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const loc = jitter(CUTTACK_CENTER, 8);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - d);
    const createdAt = daysAgo.toISOString().slice(0, 19).replace('T', ' ');

    const bookingId = db.prepare(
      `INSERT INTO bookings (customer_id, worker_id, category_id, status, is_emergency, customer_lat, customer_lng, address_text, price_quoted, created_at, updated_at)
       VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      customerId, worker.id, catIds[worker.category], Math.random() > 0.7 ? 1 : 0,
      loc.lat, loc.lng, 'Demo address, Cuttack',
      200 + Math.floor(Math.random() * 400), createdAt, createdAt
    ).lastInsertRowid;

    // Zero-Middleman split: worker's labor_cost is fixed, wallet + fee added on top.
    const labor_cost = 200 + Math.floor(Math.random() * 400);
    const wallet_contribution = Math.round(labor_cost * 0.025 * 100) / 100;
    const platform_fee = Math.round(labor_cost * 0.05 * 100) / 100;
    const customer_total = Math.round((labor_cost + wallet_contribution + platform_fee) * 100) / 100;
    db.prepare(
      `INSERT INTO payments (booking_id, labor_cost, wallet_contribution, platform_fee, customer_total, worker_payout, status, razorpay_order_id, razorpay_payment_id, invoice_number, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?)`
    ).run(bookingId, labor_cost, wallet_contribution, platform_fee, customer_total, labor_cost, `order_seed_${bookingId}`, `pay_seed_${bookingId}`, `INV-SEED-${bookingId}`, createdAt);

    db.prepare(
      `INSERT INTO wallet_transactions (worker_id, amount, type, booking_id, note, created_at)
       VALUES (?, ?, 'booking_contribution', ?, ?, ?)`
    ).run(worker.id, wallet_contribution, bookingId, `Contribution from booking #${bookingId}`, createdAt);

    if (Math.random() > 0.3) {
      db.prepare(
        `INSERT INTO ratings (booking_id, worker_id, customer_id, stars, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(bookingId, worker.id, customerId, 3 + Math.floor(Math.random() * 3), 'Good service', createdAt);
    }
    bookingCount++;
  }
}

// Recompute avg_rating/rating_count and wallet_balance from source tables for consistency
for (const w of verifiedWorkers) {
  const agg = db.prepare('SELECT AVG(stars) as avg_rating, COUNT(*) as rating_count FROM ratings WHERE worker_id = ?').get(w.id);
  if (agg.rating_count > 0) {
    db.prepare('UPDATE workers SET avg_rating = ?, rating_count = ? WHERE id = ?').run(agg.avg_rating, agg.rating_count, w.id);
  }
  const walletAgg = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM wallet_transactions WHERE worker_id = ?').get(w.id);
  db.prepare('UPDATE workers SET wallet_balance = ? WHERE id = ?').run(walletAgg.total, w.id);
}

console.log(`Seed complete:
  1 federation, 2 societies, ${categories.length} categories
  ${workerNames.length} workers (${verifiedWorkers.length} verified, ${workerNames.length - verifiedWorkers.length} pending)
  ${customerNames.length} customers
  ${bookingCount} historical completed bookings with payments + ratings

Login as federation admin: phone 9000000001 / pass123
Login as any worker: phone 91111111{10-24} / pass123
Login as any customer: phone 92222222{10-13} / pass123
`);
