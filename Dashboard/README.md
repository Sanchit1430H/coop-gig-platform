# Kushal-Setu — Admin Dashboard (Federation/Society)

React web app (Vite) for federation and society admins.

## Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173` by default. Make sure the backend is
running first (`npm start` in the backend folder) — this dashboard talks to
`http://localhost:4000/api` (see `src/api/client.js` if you need to point
it elsewhere, e.g. a deployed backend URL).

## Log in

Use a `federation_admin` or `society_admin` account. If you ran the
backend's seed script, use:

- Phone: `9000000001`
- Password: `pass123`

## Pages

- **Overview** — live stats: pending verifications, active/completed
  bookings, revenue, and the cooperative's fee shown transparently
- **Worker Verification** — approve/reject pending workers, browse
  verified/rejected, see each worker's live account status (active /
  show_cause / deactivated)
- **Peer Tribunal Disputes** — every dispute in the system, click into any
  one to see the worker's evidence, jury votes as they come in, and the
  final resolution
- **Demand Forecast** — shows the AI forecast stub, WITH the disclaimer
  from the backend rendered prominently (this is deliberate — don't remove
  it, it's what keeps the pitch honest)
- **Societies & Categories** — federation admin setup screen for adding
  new societies and service categories

## What this doesn't do (by design, for this prototype)

- No "raise a dispute manually" button yet, even though the backend route
  (`POST /disputes`) supports it — only the automatic 1-star trigger path
  is wired up on the frontend. Worth adding if you want to demo an admin
  manually flagging a worker.
- No pagination — fine for demo-scale seeded data, would need it for a
  real large worker pool.
- No editing/deleting societies or categories once created.

## Deploying

`npm run build` produces a static `dist/` folder — deployable to Vercel,
Netlify, or any static host. Update `API_BASE` in `src/api/client.js` to
your deployed backend URL before building for that.
