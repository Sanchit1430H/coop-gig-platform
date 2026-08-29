import React, { useEffect, useState } from 'react';
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

// --- NEW INFINITE SCROLLING TESTIMONIALS ---
const Testimonials = () => {
  const reviews = [
    { id: 1, name: "Priya S.", location: "Bhubaneswar", rating: "⭐⭐⭐⭐⭐", text: "The electrician arrived in 20 minutes. Finally a platform where I know the worker is actually getting the full amount I pay!" },
    { id: 2, name: "Rahul M.", location: "Rourkela", rating: "⭐⭐⭐⭐⭐", text: "Booked a plumber through Kushal-Setu. The AI dispatch matched me perfectly. Excellent service and zero hidden fees." },
    { id: 3, name: "Anjali D.", location: "Cuttack", rating: "⭐⭐⭐⭐", text: "I love the cooperative model. The carpenter was highly skilled and very professional. Will definitely use this again." },
    { id: 4, name: "Vikram K.", location: "Bhubaneswar", rating: "⭐⭐⭐⭐⭐", text: "Incredible app! The house cleaner was verified and did a spotless job. The direct pay feature is a game changer." },
    { id: 5, name: "Neha P.", location: "Puri", rating: "⭐⭐⭐⭐⭐", text: "Fastest booking I've ever experienced. The UI is smooth and the workers are top-notch." }
  ];

  return (
    <div className="marquee-container">
      {/* We render the list twice to create a seamless infinite scrolling loop */}
      <div className="marquee-track">
        {[...reviews, ...reviews].map((review, index) => (
          <div key={index} className="testimonial-card bubble-effect">
            <p className="testimonial-text">"{review.text}"</p>
            <div className="testimonial-footer">
              <span className="testimonial-author">- {review.name} ({review.location})</span>
              <span className="testimonial-rating">{review.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
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
          <button className="nav-btn-orange bubble-effect" onClick={() => alert("Post Request modal coming soon!")}>Post a Request</button>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="slide-up-fade">Find Verified Workers Instantly.</h1>
          <p className="slide-up-fade" style={{animationDelay: '0.2s'}}>Zero commissions. Fair pay for workers, fast service for you.</p>

          <div className="search-bar bubble-effect" style={{animationDelay: '0.4s'}}>
            <div className="search-input-group">
              <span className="search-icon">🔍</span>
              <select defaultValue=""><option value="" disabled>Service Type</option><option>Plumber</option><option>Electrician</option><option>Carpenter</option><option>Cleaner</option></select>
            </div>
            <div className="search-divider"></div>
            <div className="search-input-group">
              <span className="search-icon">📍</span>
              <input type="text" placeholder="Enter your city (e.g. Bhubaneswar)" />
            </div>
            <button className="search-btn bubble-effect" onClick={() => alert("Searching for workers nearby...")}>Search & Book</button>
          </div>
        </div>
      </section>

      <section className="feature-cards-container">
        <div className="feature-card-img bubble-effect">
          <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=80" alt="Cooperative Team" className="card-illustration" />
          <h3>Fair-Share Cooperative</h3>
          <div className="pay-bar-container">
             <div className="pay-bar-fill"></div>
          </div>
          <span className="pay-bar-text">100% pay to the worker</span>
          <p className="sub-text">Kushal-Setu is built on a cooperative model that eliminates middleman margins.</p>
        </div>
        
        <div className="feature-card-img bubble-effect">
          <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80" alt="Verification" className="card-illustration" />
          <h3>Government Verified</h3>
          <p className="sub-text">Every single worker on our platform is strictly background checked on the national database.</p>
        </div>
        
        <div className="feature-card-img bubble-effect">
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80" alt="Dispatch Map" className="card-illustration" />
          <h3>AI Dispatch Engine</h3>
          <p className="sub-text">Our intelligent algorithm automatically matches the exact worker based on real-time proximity.</p>
        </div>
      </section>

      {/* CHANGED TO 2 COLUMNS SINCE TESTIMONIALS MOVED DOWN */}
      <section className="bottom-grid">
        <div className="column-section">
          <h4>Featured Service Category</h4>
          <div className="mini-category-grid">
            {Object.entries(CATEGORY_ICONS).map(([name, icon]) => (
              <div 
                key={name} 
                className="mini-category-chip bubble-effect"
                onClick={() => alert(`Opening booking page for ${name}s in your area!`)}
              >
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
              <div key={idx} className="mini-step-card bubble-effect">
                <div className="mini-step-img">✅</div>
                <div className="mini-step-text">
                  <strong>{s.step}</strong>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FULL WIDTH SCROLLING TESTIMONIALS SECTION */}
      <section className="testimonials-section">
        <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#111827'}}>What Our Customers Say</h2>
        <Testimonials />
      </section>
      
      <footer className="dark-footer">
          <p>© 2026 Kushal-Setu | Terms | Privacy | Help</p>
      </footer>

      <ChatWidget />
    </div>
  );
}