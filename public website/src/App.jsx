import React, { useEffect, useState } from 'react';
import Testimonials from './components/Testimonials';
import ChatWidget from './components/ChatWidget';
import { api } from './api/client';
import './styles.css';

const CATEGORY_ICONS = {
  plumber: '🔧', electrician: '⚡', carpenter: '🪚', mason: '🧱',
  cleaner: '🧹', painting: '🎨', house: '🏠', pest: '🐛', handyman: '🛠️'
};

const STEPS = [
  { step: '1 Step', desc: 'Find service and book' },
  { step: '2 Step', desc: 'Worker is verified' },
  { step: '3 Step', desc: 'Job gets completed' },
  { step: '4 Step', desc: 'Direct, fair pay' },
];

export default function App() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="site">
      <header className="topbar">
        <div className="brand-mark">
          <span style={{color: '#f97316'}}>⚡</span> Seva-E-Akramikta
        </div>
        <nav className="topnav">
          <a href="#services">Services ▾</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#become-worker">Become a Worker</a>
          <a href="#community">Community</a>
          <a href="#support">Support</a>
          <a href="#account" className="account-link">Account ▾</a>
          <button className="nav-btn-orange">Post a Request</button>
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
              <select defaultValue=""><option value="" disabled>Service Type</option><option>Plumber</option><option>Electrician</option></select>
            </div>
            <div className="search-divider"></div>
            <div className="search-input-group">
              <span className="search-icon">📍</span>
              <input type="text" placeholder="Location Input" />
            </div>
            <button className="search-btn">Search & Book</button>
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
          <p className="sub-text">Seva-E-Akramikta is built on a cooperative model that eliminates middleman margins.</p>
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
                <div className="mini-step-img">📸</div>
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
          <p>Seva-E-Akramikta | Terms | Privacy | Help</p>
      </footer>

      <ChatWidget />
    </div>
  );
}