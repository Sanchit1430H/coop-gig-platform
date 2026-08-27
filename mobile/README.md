# Cooperative Gig Services — Mobile App (Expo / React Native)

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (iOS/Android) on your phone. Make
sure your phone and laptop are on the same WiFi network.

## IMPORTANT: point it at your backend

Edit `src/api/client.js`:

```js
export const API_BASE = 'http://localhost:4000/api';
```

`localhost` here means "the phone itself" when running via Expo Go — it will
NOT reach your laptop. Replace it with:
- Your laptop's LAN IP, e.g. `http://192.168.1.5:4000/api` (find it with
  `ipconfig` on Windows or `ifconfig`/`ipconfig getifaddr en0` on Mac —
  phone and laptop must be on the same WiFi)
- Or your deployed backend URL once it's on Render/Railway (works from
  anywhere, no LAN restriction — recommended before demo day)

## What's built

**Customer flow (full loop):**
Register/login → browse service categories → book (emergency or scheduled)
→ auto-matched to nearest verified worker → live status tracking (polls
every 3s) → mark completed → pay → see the **Zero-Middleman pricing
breakdown** (worker's full rate, wallet contribution, platform fee, and
live savings vs. a typical competitor) → rate the worker.

**Worker flow:**
Login → toggle availability on/off → see incoming matched jobs → accept or
decline → start job → **Micro-Benefits Wallet** (balance, transaction
history, withdraw) → **Disputes / Peer Tribunal** (submit evidence when
under review, cast votes when assigned as a juror on someone else's case).

A 1-star customer rating automatically puts the rated worker into a
`show_cause` state and creates a dispute — this shows up as a red banner
on their home screen linking straight to the evidence form.

## Known simplification, on purpose

The customer app currently has a "mark completed" button as a demo
convenience so the whole loop can be shown by one person. In the real
product, the WORKER marks in_progress/completed from their own app once
physically at the job. Swap `markCompleted()` in `BookingStatusScreen.js`
to only show a "waiting for worker to complete" state, and add matching
buttons to `WorkerHomeScreen.js`, once you have two people/devices to
demo with.

## Not yet built

- Admin dashboard (separate React web app — see main project README)
- Real GPS (currently defaults to a fixed Cuttack coordinate; swap in
  `expo-location` when testing on a real device)
- Push notifications (currently polling every 3-4s instead)
- Certificate photo upload for worker verification
- Multilingual UI (`preferred_language` is captured but not wired to
  any i18n library yet)
