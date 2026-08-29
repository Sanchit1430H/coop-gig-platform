import React, { useEffect, useState } from 'react';
// Note: We removed the external Testimonials import because we built it directly into this file below!
import ChatWidget from './components/ChatWidget';
import { api } from './api/client';
import './styles.css';

const CATEGORY_ICONS = {
  plumber: '🔧', electrician: '⚡', carpenter: '🪚', mason: '🧱',
  cleaner: '🧹', painting: '🎨', house: '🏠', pest: '🐛', handyman: '🛠️'
};

const STEPS = [
  { step: 'Step 1', desc: 'Find service and book' },
  { step: 'Step 2', desc: 'Worker is verified' },
  { step: 'Step 3', desc: 'Job gets completed' },
  { step: 'Step 4', desc: 'Direct, fair pay' },
];

// ---------------------------------------------------------
// NEW TESTIMONIALS COMPONENT (Built right in for the demo!)
// ---------------------------------------------------------
const Testimonials = () => {
  const reviews = [
    {
      id: 1,
      name: "Priya S.",
      location: "Bhubaneswar",
      rating: "⭐⭐⭐⭐⭐",
      text: "The electrician arrived in 20 minutes. Finally a platform where I know the worker is actually getting the full amount I pay!"
    },
    {
      id: 2,
      name: "Rahul M.",
      location: "Rourkela",
      rating: "⭐⭐⭐⭐⭐",
      text: "Booked a plumber through Kushal-Setu. The AI dispatch matched me perfectly. Excellent service and zero hidden fees."
    },
    {
      id: 3,
      name: "Anjali D.",
      location: "Cuttack",
      rating: "⭐⭐⭐⭐",
      text: "I love the cooperative model. The carpenter was highly skilled and very professional. Will definitely use this again."
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {reviews.map((review) => (
        <div key={review.id} style={{
          backgroundColor: '#f8f9fa',
          padding: '12px',
          borderRadius: '8px',
          borderLeft: '4px solid #f97316',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontStyle: 'italic', color: '#4b5563' }}>"{review.text}"</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#111827' }}>- {review.name} ({review.location})</span>
            <span style={{ fontSize: '10px' }}>{review.rating}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
// ---------------------------------------------------------


export default function App() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // If api.getStats is failing because the backend isn't up, 
    // we catch the error so it doesn't break the frontend demo.
    if (api && api.getStats) {
      api.getStats().then(setStats).catch(() => console.log("Backend not connected yet"));
    }
  }, []);

  return (
    <div className="site">
      <header className="topbar">
        <div className="brand-mark" style={{ fontWeight: 'bold', fontSize: '20px' }}>
          <span style={{color: '#f97316'}}>⚡</span> Kushal-Setu
        </div>
        <nav className="topnav">
          <a href="#services">Services ▾</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#become-worker">Become a Worker</a>
          <a href="#community">Community</a>
          <a href="#support">Support</a>
          <a href="#account" className="account-link">Account ▾</a>
          <button className="nav-btn-orange" onClick={() => alert("Post Request modal coming soon!")}>Post a Request</button>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Find Verified Workers Instantly.</h1>
          <p>Zero commissions. Fair pay for workers, fast service for you.</p>

          <div className="search-bar">
            <div className="search-input-group">
              <span className="search-icon">🔍</span>
              <select defaultValue=""><option value="" disabled>Service Type</option><option>Plumber</option><option>Electrician</option><option>Carpenter</option><option>Cleaner</option></select>
            </div>
            <div className="search-divider"></div>
            <div className="search-input-group">
              <span className="search-icon">📍</span>
              <input type="text" placeholder="Enter your city (e.g. Bhubaneswar)" />
            </div>
            <button className="search-btn" onClick={() => alert("Searching for workers nearby...")}>Search & Book</button>
          </div>
        </div>
      </section>

      <section className="feature-cards-container">
        <div className="feature-card-img">
          <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=80" alt="Cooperative Team" className="card-illustration" />
          <h3>Fair-Share Cooperative</h3>
          <div className="pay-bar-container">
             <div className="pay-bar-fill"></div>
          </div>
          <span className="pay-bar-text">100% pay to the worker</span>
          <p className="sub-text">Kushal-Setu is built on a cooperative model that eliminates middleman margins.</p>
        </div>
        
        <div className="feature-card-img">
          <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80" alt="Verification" className="card-illustration" />
          <h3>Government Verified</h3>
          <p className="sub-text">Every single worker on our platform is strictly background checked on the national database.</p>
        </div>
        
        <div className="feature-card-img">
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80" alt="Dispatch Map" className="card-illustration" />
          <h3>AI Dispatch Engine</h3>
          <p className="sub-text">Our intelligent algorithm automatically matches the exact worker based on real-time proximity.</p>
        </div>
      </section>

      <section className="bottom-three-columns">
        <div className="column-section">
          <h4>Featured Service Category</h4>
          <div className="mini-category-grid">
            {Object.entries(CATEGORY_ICONS).map(([name, icon]) => (
              <div key={name} className="mini-category-chip">
                <span className="mini-icon">{icon}</span>
                <span className="mini-name capitalize">{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="column-section">
          <h4>How It Works</h4>
          <div className="mini-steps-grid">
            {STEPS.map((s, idx) => (
              <div key={idx} className="mini-step-card">
                <div className="mini-step-img">✅</div>
                <div className="mini-step-text">
                  <strong>{s.step}</strong>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="column-section">
          <h4>Customer Testimonials</h4>
          <div className="mini-testimonials">
            <Testimonials />
          </div>
        </div>
      </section>
      
      <footer className="dark-footer">
          <p>© 2026 Kushal-Setu | Terms | Privacy | Help</p>
      </footer>

      {/* Note: Ensure ChatWidget exists in your components folder, or comment this line out if it crashes */}
      <ChatWidget />
    </div>
  );
}