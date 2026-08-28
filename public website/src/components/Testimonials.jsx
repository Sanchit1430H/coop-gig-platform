import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Testimonials() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.getReviews().then(setReviews).catch(() => setError(true));
  }, []);

  if (error || reviews.length === 0) return null;

  return (
    <section className="testimonials">
      <h2>What people are saying</h2>
      <p className="section-sub">Real reviews from completed bookings on the platform.</p>
      <div className="testimonial-grid">
        {reviews.slice(0, 6).map((r, i) => (
          <div key={i} className="testimonial-card">
            <div className="stars">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
            <p className="testimonial-text">"{r.comment}"</p>
            <div className="testimonial-meta">
              <strong>{r.customer_name}</strong>
              <span className="capitalize"> · {r.category_name.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
