# Seva-E-Akramikta — Public Website

Public marketing/landing page (Vite + React). No login required — this is
what anyone (including judges) sees when they visit the project's public
URL.

## Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:5174` (or whatever port Vite picks — 5173 is
likely taken by the admin dashboard if both are running). Make sure the
backend is running first — this pulls live stats and reviews from
`http://localhost:4000/api/public/*`.

## What's on the page

- **Hero** with live stats (verified worker count, completed bookings,
  average rating) pulled straight from the backend
- **Feature cards** — Fair-Share Cooperative, Verified Workers, Peer-
  Governed Fairness (the three things that differentiate this from
  private platforms)
- **Service categories** — pulled live from the backend, so adding a
  category in the admin dashboard shows up here automatically
- **How It Works** — 4-step explainer
- **Testimonials** — REAL reviews and comments from the seeded ratings
  data, not fake copy. Only shows reviews with an actual comment and 4+
  stars, most recent first.
- **FAQ chat widget** (bottom-right) — see the honesty note below
- **CTA band** for workers wanting to join

## IMPORTANT: the chat widget is NOT a real AI

`src/api/faqBot.js` is a keyword-matching rules engine — it looks for
words like "price", "verify", "dispute" in what the user types and
returns a pre-written answer. It works well for a demo and needs zero
setup (no API key), but it is not an LLM and will say so in its own UI
if asked what it is.

**To upgrade to a real AI chatbot:** you'd need an API key from an LLM
provider (Anthropic, OpenAI, etc.), a small backend endpoint that calls
it (don't call LLM APIs directly from the browser — that would expose
your key), and then swap the body of `getAnswer()` in `faqBot.js` for a
`fetch()` call to that new endpoint. The function signature is already
designed for this swap — every call site keeps working unchanged. Budget
this as a real (small) task, not a checkbox — it involves getting an API
key, adding billing/rate-limit awareness, and writing a system prompt
for the assistant, which is worth doing properly rather than rushing
right before a demo.

## Deploying

`npm run build` → static `dist/` folder → deploy to Vercel/Netlify/GitHub
Pages. Update `API_BASE` in `src/api/client.js` to your deployed backend
URL first.
