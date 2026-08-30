require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workers');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const ratingRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');
const disputeRoutes = require('./routes/disputes');
const walletRoutes = require('./routes/wallet');
const publicRoutes = require('./routes/public');
const systemRoutes = require('./routes/system');
const diagnosisRoutes = require('./routes/diagnosis');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'coop-gig-platform-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/bookings', diagnosisRoutes);

app.use((req, res) => res.status(404).json({ error: 'not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`coop-gig-platform API listening on :${PORT}`));
