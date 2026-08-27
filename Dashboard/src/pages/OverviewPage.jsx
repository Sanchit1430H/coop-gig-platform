import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function OverviewPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard(token).then(setStats).catch((e) => setError(e.message));
  }, [token]);

  if (error) return <p className="error-text">{error}</p>;
  if (!stats) return <p>Loading…</p>;

  const cards = [
    { label: 'Pending Verifications', value: stats.pending_verifications, tone: 'warn' },
    { label: 'Active Bookings', value: stats.active_bookings, tone: 'info' },
    { label: 'Completed Bookings', value: stats.completed_bookings, tone: 'ok' },
    { label: 'Verified Workers', value: stats.total_verified_workers, tone: 'ok' },
    { label: 'Insured Workers', value: stats.insured_workers, tone: 'ok' },
  ];

  return (
    <div>
      <h1>Overview</h1>
      <p className="page-sub">Live snapshot of the cooperative's marketplace activity.</p>

      <div className="card-grid">
        {cards.map((c) => (
          <div key={c.label} className={`stat-card tone-${c.tone}`}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="revenue-card">
        <h3>Revenue &amp; the Zero-Middleman commitment</h3>
        <div className="revenue-row">
          <span>Gross revenue collected</span>
          <strong>₹{stats.gross_revenue?.toFixed(2)}</strong>
        </div>
        <div className="revenue-row">
          <span>Cooperative's maintenance fee</span>
          <strong>₹{stats.cooperative_commission?.toFixed(2)}</strong>
        </div>
        <p className="footnote">
          Unlike private platforms that take 25-30% commission out of the worker's earnings,
          this cooperative's fee is added on top for the customer — workers always receive
          their full quoted rate.
        </p>
      </div>
    </div>
  );
}
