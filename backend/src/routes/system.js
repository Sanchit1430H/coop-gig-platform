const express = require('express');
const { runSeed } = require('../seed');

const router = express.Router();

// ---------------------------------------------------------------------------
// PROTECTED, NOT part of the normal app auth system (no JWT/login involved).
// This exists purely so you can seed a DEPLOYED database (e.g. on Render)
// without needing shell access to the server. Guarded by a secret set as
// an environment variable — request must send it in the x-seed-secret
// header, or it's rejected.
//
// SET THIS ON RENDER: in your Render service's Environment settings, add
//   SEED_SECRET = <any random string you choose>
// then trigger seeding with:
//   curl -X POST https://your-render-url.onrender.com/api/system/seed \
//     -H "x-seed-secret: <that same string>"
//
// If SEED_SECRET is not set on the server at all, this route refuses to
// run — prevents anyone from wiping/reseeding your live data by accident
// if you forget to configure it.
// ---------------------------------------------------------------------------
router.post('/seed', (req, res) => {
  const configuredSecret = process.env.SEED_SECRET;
  if (!configuredSecret) {
    return res.status(503).json({
      error: 'SEED_SECRET is not configured on this server. Set it as an environment variable before using this endpoint.',
    });
  }

  const providedSecret = req.headers['x-seed-secret'];
  if (providedSecret !== configuredSecret) {
    return res.status(403).json({ error: 'Invalid or missing x-seed-secret header.' });
  }

  try {
    const summary = runSeed();
    res.json({ status: 'ok', summary });
  } catch (err) {
    console.error('Seed via endpoint failed:', err);
    res.status(500).json({ error: 'Seeding failed', detail: err.message });
  }
});

module.exports = router;
