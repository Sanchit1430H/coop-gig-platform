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

const Testimonials = () => {
  const reviews = [
    { id: 1, name: "Priya S.", location: "Bhubaneswar", rating: "⭐⭐⭐⭐⭐", text: "The electrician arrived in 20 minutes. Finally a platform where I know the worker is actually getting the full amount I pay!" },
    { id: 2, name: "Rahul M.", location: "Rourkela", rating: "⭐⭐⭐⭐⭐", text: "Booked a plumber through Kushal-Setu. The AI dispatch matched me perfectly. Excellent service and zero hidden fees." },
    { id: 3, name: "Anjali D.", location: "Cuttack", rating: "⭐⭐⭐⭐", text: "I love the cooperative model. The carpenter was highly skilled and very professional. Will definitely use this again." },
  ];

  return (
    <div className="marquee-container">
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
  // STATE TO CONTROL WHICH PAGE WE ARE ON: 'home', 'booking', 'tracking'
  const [currentView, setCurrentView] = useState('home');
  const [isEmergency, setIsEmergency] = useState(false);

  // --- PAGE 1: HOME PAGE ---
  const renderHome = () => (
    <>
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="slide-up-fade">Find Verified Workers Instantly.</h1>
          <p className="slide-up-fade" style={{animationDelay: '0.2s'}}>Zero commissions. Fair pay for workers, fast service for you.</p>

          <div className="search-bar bubble-effect" style={{animationDelay: '0.4s'}}>
            <div className="search-input-group">
              <span className="search-icon">🔍</span>
              <select defaultValue=""><option value="" disabled>Service Type</option><option>Plumber</option><option>Electrician</option></select>
            </div>
            <div className="search-divider"></div>
            <div className="search-input-group">
              <span className="search-icon">📍</span>
              <input type="text" placeholder="Enter your city (e.g. Bhubaneswar)" />
            </div>
            {/* BUTTON TRIGGERS BOOKING PAGE */}
            <button className="search-btn bubble-effect" onClick={() => setCurrentView('booking')}>Search & Book</button>
          </div>
        </div>
      </section>

      <section className="feature-cards-container">
        <div className="feature-card-img bubble-effect">
          <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=80" alt="Cooperative Team" className="card-illustration" />
          <h3>Fair-Share Cooperative</h3>
          <div className="pay-bar-container"><div className="pay-bar-fill"></div></div>
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

      <section className="bottom-grid">
        <div className="column-section">
          <h4>Featured Service Category</h4>
          <div className="mini-category-grid">
            {Object.entries(CATEGORY_ICONS).map(([name, icon]) => (
              <div key={name} className="mini-category-chip bubble-effect" onClick={() => setCurrentView('booking')}>
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
                <div className="mini-step-text"><strong>{s.step}</strong><p>{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#111827'}}>What Our Customers Say</h2>
        <Testimonials />
      </section>
    </>
  );

  // --- PAGE 2: BOOKING FORM ---
  const renderBooking = () => (
    <div className="booking-page-container fade-in">
      <button className="back-btn" onClick={() => setCurrentView('home')}>← Back to Home</button>
      <div className="booking-card">
        <h2>Book a Service</h2>
        <p>Fill out the details below. Workers get 100% of the booking fee.</p>
        
        <div className="form-group">
          <label>Service Required</label>
          <select className="form-input"><option>Electrician</option><option>Plumber</option><option>Carpenter</option></select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" className="form-input" />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input type="time" className="form-input" />
          </div>
        </div>

        <div className="form-group">
          <label>Exact Location</label>
          <input type="text" className="form-input" placeholder="e.g. Patia, Bhubaneswar" />
        </div>

        <div className={`emergency-box ${isEmergency ? 'emergency-active' : ''}`}>
          <div className="emergency-header">
            <div>
              <strong>🚨 Emergency Booking?</strong>
              <p>Need someone right now? AI will bypass scheduling and dispatch the nearest active worker.</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <button className={`confirm-btn ${isEmergency ? 'btn-red' : 'btn-orange'}`} onClick={() => setCurrentView('tracking')}>
          {isEmergency ? "Dispatch Emergency Worker Now" : "Confirm Standard Booking"}
        </button>
      </div>
    </div>
  );

  // --- PAGE 3: LIVE TRACKING & CHAT ---
  const renderTracking = () => (
    <div className="tracking-page-container fade-in">
      <button className="back-btn" onClick={() => setCurrentView('home')}>← Cancel & Return Home</button>
      
      <div className="tracking-grid">
        {/* Left Side: Map & Worker Info */}
        <div className="tracking-left">
          <div className={`status-banner ${isEmergency ? 'banner-red' : 'banner-green'}`}>
            <h3>{isEmergency ? "🚨 Emergency Worker Dispatched!" : "✅ Booking Confirmed!"}</h3>
            <p>{isEmergency ? "Worker is arriving in 5 mins." : "Worker will arrive at scheduled time."}</p>
          </div>
          
          <div className="map-container">
            {/* Fake Map Image with a pulsing dot for the worker */}
            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" alt="Map" className="map-image" />
            <div className="worker-dot"></div>
            <div className="customer-dot"></div>
          </div>

          <div className="worker-profile-card">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Worker" className="worker-avatar" />
            <div className="worker-details">
              <h4>Ramesh Kumar</h4>
              <p>⭐ 4.9 (120 Jobs) • Verified Electrician</p>
              <span className="coop-badge">Cooperative Member (100% Payout)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Live Chat */}
        <div className="tracking-right">
          <div className="chat-interface">
            <div className="chat-header-small">Live Chat with Ramesh</div>
            <div className="chat-body">
              <div className="chat-msg system-msg">System: AI Matched you with Ramesh based on real-time location.</div>
              {isEmergency && <div className="chat-msg system-msg-red">System: EMERGENCY OVERRIDE. Ramesh is dropping current tasks to reach you.</div>}
              <div className="chat-msg worker-msg">
                <strong>Ramesh:</strong> Hello! I have received your request. {isEmergency ? "I am driving fast, reaching in 5 mins!" : "I will reach your location at the booked time."}
              </div>
            </div>
            <div className="chat-input-area">
              <input type="text" placeholder="Type a message..." className="chat-input-box" />
              <button className="chat-send-btn">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="site">
      <header className="topbar">
        <div className="brand-mark" style={{ fontWeight: 'bold', fontSize: '20px', cursor: 'pointer' }} onClick={() => setCurrentView('home')}>
          <span style={{color: '#f97316'}}>⚡</span> Kushal-Setu
        </div>
        <nav className="topnav">
          <a href="#services" onClick={() => setCurrentView('home')}>Services ▾</a>
          <button className="nav-btn-orange bubble-effect" onClick={() => setCurrentView('booking')}>Post a Request</button>
        </nav>
      </header>

      {/* RENDER THE CORRECT PAGE BASED ON STATE */}
      {currentView === 'home' && renderHome()}
      {currentView === 'booking' && renderBooking()}
      {currentView === 'tracking' && renderTracking()}
      
      {currentView === 'home' && (
        <footer className="dark-footer">
            <p>© 2026 Kushal-Setu | Terms | Privacy | Help</p>
        </footer>
      )}

      {/* Hide ChatWidget on tracking page since it has its own chat */}
      {currentView !== 'tracking' && <ChatWidget />}
    </div>
  );
}