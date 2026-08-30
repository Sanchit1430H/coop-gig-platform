# Cooperative Gig Services Platform — Backend Prototype

## Run it

```bash
npm install
npm start        # or: node src/index.js
```

Server runs on `http://localhost:4000`. Uses SQLite (`coop_gig.db`, auto-created)
— zero external DB setup needed. Full API surface under `/api/*`.

## Seed realistic demo data

**Locally:**

With the server running in one terminal, run this in another:

```bash
npm run seed
```

**On a deployed backend (e.g. Render), where you may not have easy shell access:**

1. In your Render service's Environment settings, add an environment
   variable: `SEED_SECRET` = any random string you choose (e.g. generate
   one at randomkeygen.com). Save — Render will redeploy.
2. Trigger seeding with a single request:
   ```bash
   curl -X POST https://your-render-url.onrender.com/api/system/seed \
     -H "x-seed-secret: <the same string you set>"
   ```
   Or paste that URL into a tool like Postman/Insomnia with the header set,
   or even just run it from your browser's dev console with `fetch()`.
3. You should get back `{"status":"ok","summary":{...}}`. Refresh your
   public website / admin dashboard and the data should now be there.

This wipes and repopulates the DB with: 1 federation, 2 societies (Cuttack +
Bhubaneswar), 10 service categories, 15 workers (12 verified, 3 pending —
so you can demo the admin approval queue), 4 customers, and days of
historical completed bookings with payments and ratings (so the dashboard,
worker ratings, and demand-forecast screen aren't empty).

Test logins (all password `pass123`):
- Federation admin: `9000000001`
- Workers: `9111111110` through `9111111124`
- Customers: `9222222210` through `9222222213`

Re-run the seed anytime (locally or via the endpoint) to reset to a clean
demo state before a rehearsal or the actual judging round.

**Note on Render's free tier:** the SQLite database file lives on an
ephemeral filesystem by default — a new deploy (triggered by a `git push`
if you have auto-deploy on) can wipe it. Re-run the seed endpoint after
any redeploy, especially right before your demo. For a permanent fix,
migrate to Render's managed Postgres (persistent storage) instead of
file-based SQLite — worth doing once the deadline pressure eases.

## NEW: Cooperative-governance features (the actual differentiator)

- **Peer Tribunal (dispute resolution):** a 1-star rating no longer touches
  the worker's ability to work directly — it auto-triggers a `show_cause`
  status. The worker submits evidence, 3 random verified/highly-rated peer
  workers (never the worker under review) get assigned as jurors, majority
  vote (2 of 3) either dismisses the dispute (worker returns to active) or
  upholds it (worker deactivated). Full state machine in `routes/disputes.js`,
  tested end-to-end including the auto-trigger from `routes/ratings.js`.
- **Zero-Middleman pricing:** rebuilt payment split — the worker's quoted
  `labor_cost` is now fixed and untouched. The platform fee (5%) and
  Micro-Benefits Wallet contribution (2.5%) are ADDED on top for the
  customer, not deducted from the worker's side. `₹400 labor → ₹430
  customer total, worker keeps the full ₹400`. See `routes/payments.js`.
- **Micro-Benefits Wallet:** every completed, paid booking automatically
  credits 2.5% of labor cost into the worker's wallet (`wallet_transactions`
  table, real ledger, not a stub). Workers can withdraw against it via
  `POST /wallet/:worker_id/withdraw`. This is a fully real feature — unlike
  the insurance stub, there's no external dependency faked here.

Inspired by (not a copy of) Australia's Digital Labour Platform Deactivation
Code (effective 26 Feb 2025) — that law mandates a fair process before
deactivation via a government tribunal (Fair Work Commission); this
platform's peer-tribunal layer is our own cooperative-governance extension
of that same due-process principle, not a claim that Australia does peer
tribunals.

## NEW: AI pre-diagnosis (booking flow)

- **Backend features, tested live end-to-end (fresh DB migration + against
  an already-populated DB — safe for your deployed Render database too):**
  a `POST /bookings/:id/diagnose` endpoint accepts an optional text
  description and/or a photo, runs it through `src/ai/diagnosis.js`, and
  stores the result on the booking.
- **THIS IS NOT A REAL AI/VISION MODEL YET.** `diagnosis.js` is a
  keyword-matching stub — "leak" triggers a plumbing-issue guess, "spark"
  triggers an electrical-hazard flag, etc. If a photo is attached, the
  response is honest about it: the photo is stored and passed to the
  worker to view directly, but no automated visual analysis happens,
  because that requires a vision-capable LLM API key (Gemini or OpenAI)
  which hasn't been configured. See the comment block at the top of
  `ai/diagnosis.js` for exactly what a real upgrade involves — and note
  that this sandbox's network can't reach Google/OpenAI's APIs even with
  a key, so the real integration has to be tested after deployment, not
  here.
- Photos are stored as base64 directly in the `bookings` table — fine for
  demo scale, explicitly NOT how you'd do this in production (you'd want
  real object storage like S3/Cloudinary and store just a URL). Capped at
  ~1.5MB per photo to keep the demo database from bloating.

## What's REAL (fully working, tested end-to-end)

- User registration/login (phone + password, JWT auth, 4 roles: customer,
  worker, society_admin, federation_admin)
- Federation → society → worker hierarchy with admin CRUD
- Worker skill profiling + certificate upload field
- Worker verification workflow (pending → verified/rejected by admin)
- Live availability toggle + location update
- **Geo-matching**: haversine-based nearest-worker search, radius scales up
  for emergency bookings (8km normal / 20km emergency), ties broken by rating
- Booking lifecycle: searching → matched → accepted → in_progress → completed
  (worker can decline, triggers re-match excluding them)
- Payments (Razorpay **test-mode stub** — see below) with transparent
  commission split (10%, named constant, returned in every response)
- Invoicing (auto-generated invoice number per payment)
- Ratings with running average recalculated on worker profile
- Federation admin dashboard (pending verifications, active/completed
  bookings, revenue split, insured worker count)

## What's STUBBED — say this explicitly in your demo, don't let it pass as real

- **Payments**: Razorpay calls are mocked (`order_mock_...`, `pay_mock_...`
  IDs). Swapping in real Razorpay test-mode SDK is a contained change in
  `routes/payments.js` — order creation + webhook signature verification.
- **Insurance/welfare**: `PATCH /workers/:id/insurance` just flips a boolean.
  No real insurer integration exists or was claimed.
- **AI demand forecasting**: `/admin/forecast` is a 7-point moving average
  over whatever's in the demo DB — a pipeline proof-of-concept, not a
  trained/validated model. The response includes a disclaimer field on
  purpose; keep it in your demo narrative.
- **Multilingual**: `preferred_language` field exists on users but no i18n
  layer is wired up yet. Add `preferred_language` handling on the
  frontend with a library like `react-i18next` (English + 1 regional
  language is a realistic scope for the timeline).
- **OTP auth**: prototype uses phone+password. Real deployment should use
  OTP (Firebase Auth or MSG91) — noted inline in `routes/auth.js`.

## Migrating to Postgres + PostGIS later

The schema (`src/db.js`) and matching logic (`src/utils/geo.js`) are both
written with the migration path in mind:
- Replace `lat`/`lng` columns with a single PostGIS `geography` column
- Replace the JS haversine loop in `findNearestWorkers` with
  `ST_DWithin` + `ORDER BY location <-> point` — pushes distance
  computation into the DB with a spatial index, scales far better than
  the current in-memory filter
- Everything else (routes, auth, payments, ratings) ports with no
  structural changes since better-sqlite3 and `pg` share the same
  synchronous-feeling query style if you use a thin wrapper

## API surface

```
POST   /api/auth/register
POST   /api/auth/login

POST   /api/workers                       (worker: create profile)
PATCH  /api/workers/:id/verify             (admin: approve/reject)
PATCH  /api/workers/:id/availability       (worker: go online/offline + location)
PATCH  /api/workers/:id/insurance          (stub: enroll)
GET    /api/workers?category_id=&verification_status=&society_id=

POST   /api/bookings                       (customer: creates + auto-matches)
PATCH  /api/bookings/:id/respond           (worker: accept/decline)
PATCH  /api/bookings/:id/status            (in_progress/completed/cancelled)
GET    /api/bookings                       (role-scoped list)

POST   /api/payments                       (test-mode, returns commission split)
GET    /api/payments/invoice/:booking_id

POST   /api/ratings
GET    /api/ratings/worker/:worker_id

POST   /api/admin/federations
POST   /api/admin/societies
GET    /api/admin/societies
POST   /api/admin/categories
GET    /api/admin/categories
GET    /api/admin/dashboard
GET    /api/admin/forecast                 (stub, disclaimer included)
```

## Next build priorities (in order)

1. React Native app — customer booking flow + worker accept/decline flow
   (this is what judges/evaluators will actually interact with; API alone
   won't demo well)
2. React admin dashboard for federation/society staff
3. Real Razorpay test-mode wiring (swap, not rewrite)
4. i18n pass (English + 1 regional language)
5. Seed script with realistic dummy data across multiple societies/workers
   so the geo-matching and forecast demo looks convincing, not empty
