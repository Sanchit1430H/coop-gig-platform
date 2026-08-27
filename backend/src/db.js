const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'coop_gig.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// SCHEMA
// Note: lat/lng stored as REAL. When this migrates to Postgres, swap the
// workers.lat/lng + bookings.lat/lng pair for a single PostGIS `geography`
// column and replace the haversine matching in utils/geo.js with a
// ST_DWithin + ORDER BY ST_Distance query. Everything else ports as-is.
// ---------------------------------------------------------------------------

db.exec(`
CREATE TABLE IF NOT EXISTS federations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  region TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS societies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  federation_id INTEGER NOT NULL REFERENCES federations(id),
  name TEXT NOT NULL,
  city TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('customer','worker','society_admin','federation_admin')),
  preferred_language TEXT DEFAULT 'en',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,          -- electrician, plumber, carpenter, painter, domestic_help, caregiver, driver, gardener, cleaner, technician
  base_rate REAL NOT NULL             -- reference hourly/visit rate for demand-forecast + pricing display
);

CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  society_id INTEGER NOT NULL REFERENCES societies(id),
  category_id INTEGER NOT NULL REFERENCES service_categories(id),
  experience_years REAL DEFAULT 0,
  bio TEXT,
  certificate_url TEXT,               -- uploaded doc path/URL
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending','verified','rejected')),
  verified_by INTEGER REFERENCES users(id),
  verified_at TEXT,
  is_available INTEGER NOT NULL DEFAULT 0,   -- toggled by worker
  lat REAL,
  lng REAL,
  last_location_update TEXT,
  insurance_enrolled INTEGER NOT NULL DEFAULT 0,   -- stubbed welfare integration
  insurance_provider TEXT DEFAULT 'MockInsure Co (demo)',
  avg_rating REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK(account_status IN ('active','show_cause','deactivated')),
  wallet_balance REAL NOT NULL DEFAULT 0,     -- Micro-Benefits Wallet running balance
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Wallet ledger: every credit/debit against a worker's Micro-Benefits Wallet.
-- wallet_balance on the worker row is a cached running total recomputed
-- from this table — this table is the source of truth.
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL REFERENCES workers(id),
  amount REAL NOT NULL,                 -- positive = credit, negative = withdrawal/debit
  type TEXT NOT NULL CHECK(type IN ('booking_contribution','withdrawal','adjustment')),
  booking_id INTEGER REFERENCES bookings(id),
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Disputes: triggered when a worker's rating/complaint pattern crosses a
-- threshold. Worker is put in 'show_cause' status (NOT deactivated) and can
-- submit evidence before a peer tribunal votes.
CREATE TABLE IF NOT EXISTS disputes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL REFERENCES workers(id),
  trigger_reason TEXT NOT NULL,          -- e.g. 'low_rating', 'customer_complaint'
  trigger_rating_id INTEGER REFERENCES ratings(id),
  worker_evidence TEXT,                  -- worker's explanation, submitted by them
  status TEXT NOT NULL DEFAULT 'awaiting_evidence' CHECK(status IN ('awaiting_evidence','voting','upheld','dismissed')),
  jurors_assigned TEXT,                  -- JSON array of 3 worker_ids selected as jurors
  resolution_note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);

-- One vote per juror per dispute. 'uphold' = confirm the penalty/deactivation,
-- 'dismiss' = clear the worker. Majority of 3 decides.
CREATE TABLE IF NOT EXISTS dispute_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dispute_id INTEGER NOT NULL REFERENCES disputes(id),
  juror_worker_id INTEGER NOT NULL REFERENCES workers(id),
  vote TEXT NOT NULL CHECK(vote IN ('uphold','dismiss')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dispute_id, juror_worker_id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES users(id),
  worker_id INTEGER REFERENCES workers(id),          -- null until matched
  category_id INTEGER NOT NULL REFERENCES service_categories(id),
  status TEXT NOT NULL DEFAULT 'searching' CHECK(status IN ('searching','matched','accepted','in_progress','completed','cancelled','no_match')),
  is_emergency INTEGER NOT NULL DEFAULT 0,
  scheduled_at TEXT,                    -- null if emergency/ASAP
  customer_lat REAL NOT NULL,
  customer_lng REAL NOT NULL,
  address_text TEXT,
  price_quoted REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- "Zero-Middleman" pricing: the worker's labor_cost is FIXED and protected —
-- it is never reduced by platform fees. Platform fee + wallet contribution
-- are ADDED on top to get the customer's total, unlike the deduct-from-total
-- model competitor platforms use. This is the concrete mechanism behind the
-- "worker always gets what they quoted" claim.
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  labor_cost REAL NOT NULL,             -- worker's quoted rate — untouched, paid in full
  wallet_contribution REAL NOT NULL,    -- routed to worker's Micro-Benefits Wallet
  platform_fee REAL NOT NULL,           -- cooperative's maintenance fee
  customer_total REAL NOT NULL,         -- labor_cost + wallet_contribution + platform_fee
  worker_payout REAL NOT NULL,          -- = labor_cost, kept as its own column for clarity/back-compat
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  invoice_number TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  worker_id INTEGER NOT NULL REFERENCES workers(id),
  customer_id INTEGER NOT NULL REFERENCES users(id),
  stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workers_category_avail ON workers(category_id, is_available, verification_status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
`);

module.exports = db;
