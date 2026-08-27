import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function ForecastPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getForecast(token).then(setData).catch((e) => setError(e.message));
  }, [token]);

  return (
    <div>
      <h1>Demand Forecast</h1>
      <p className="page-sub">AI-assisted workforce allocation — proof of concept.</p>

      <div className="disclaimer-banner">
        ⚠️ {data?.disclaimer || 'This is a demo-database forecast, not a production-validated model.'}
      </div>

      {error && <p className="error-text">{error}</p>}
      {!data ? (
        <p>Loading…</p>
      ) : data.forecast.length === 0 ? (
        <p className="empty-state">Not enough booking history yet to project demand.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Historical data points</th>
              <th>Next-day estimate</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {data.forecast.map((f) => (
              <tr key={f.category}>
                <td className="capitalize">{f.category.replace('_', ' ')}</td>
                <td>{f.historical_points}</td>
                <td><strong>{f.naive_next_day_estimate}</strong> bookings</td>
                <td className="muted">{f.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
