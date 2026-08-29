import React, { useEffect, useState } from 'react';
import ChatWidget from './components/ChatWidget';
import { api } from './api/client';
import './styles.css';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

const createIcon = (emoji, color) => L.divIcon({
  html: `<div style="font-size: 20px; background: white; border-radius: 50%; border: 3px solid ${color}; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">${emoji}</div>`,
  className: 'custom-map-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const customerIcon = createIcon('📍', '#ef4444'); 
const activeWorkerIcon = createIcon('🚗', '#22c55e'); 
const idleWorkerIcon = createIcon('👷', '#94a3b8'); 

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

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedService, setSelectedService] = useState('plumber');
  const [searchStatus, setSearchStatus] = useState('searching'); // 'searching' or 'found'

  // --- WAYPOINT ROUTING (More points for discrete jumps) ---
  const routeCoords = [
    [20.3150, 85.8050],
    [20.3110, 85.8050],
    [20.3050, 85.8050],
    [20.3050, 85.8110],
    [20.3050, 85.8180],
    [20.3000, 85.8180],
    [20.2960, 85.8180],
    [20.2960, 85.8210],
    [20.2960, 85.8245] // Customer destination
  ];
  const customerGPS = routeCoords[routeCoords.length - 1];

  const [workerPos, setWorkerPos] = useState(routeCoords[0]);

  const availableWorkers = [
    [20.3010, 85.8300],
    [20.2850, 85.8150],
    [20.2920, 85.8400],
    [20.3050, 85.8100]
  ];

  // --- NEW: DISCRETE GPS POLLING SIMULATION ---
  useEffect(() => {
    let interval;
    if (currentView === 'tracking') {
      let currentIndex = 0;
      setWorkerPos(routeCoords[0]);

      // Updates position exactly once every 2.5 seconds (or 1.5s for emergency)
      const pollRate = isEmergency ? 1500 : 2500;
      
      interval = setInterval(() => {
        currentIndex++;
        if (currentIndex >= routeCoords.length) {
          clearInterval(interval);
        } else {
          setWorkerPos(routeCoords[currentIndex]);
        }
      }, pollRate);
    }
    return () => clearInterval(interval);
  }, [currentView, isEmergency]);

  // Handle the transition from Booking -> Loading -> Tracking
  const handleBookSubmit = () => {
    setCurrentView('searching');
    setSearchStatus('searching');
    
    // Fake loading delay to find worker
    setTimeout(() => {
      setSearchStatus('found');
      
      // Show success message briefly, then load map
      setTimeout(() => {
        setCurrentView('tracking');
      }, 1500);
    }, 3500); // 3.5 seconds of searching
  };

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
              <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                {Object.keys(CATEGORY_ICONS).map(name => (
                  <option key={name} value={name}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="search-divider"></div>
            <div className="search-input-group">
              <span className="search-icon">📍</span>
              <input type="text" placeholder="Enter your city (e.g. Bhubaneswar)" />
            </div>
            <button className="search-btn bubble-effect" onClick={() => setCurrentView('booking')}>Search & Book</button>
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="column-section">
          <h4>Featured Service Category</h4>
          <div className="mini-category-grid">
            {Object.entries(CATEGORY_ICONS).map(([name, icon]) => (
              <div key={name} className="mini-category-chip bubble-effect" onClick={() => { setSelectedService(name); setCurrentView('booking'); }}>
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
          <select className="form-input capitalize" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
            {Object.keys(CATEGORY_ICONS).map(name => (
              <option key={name} value={name}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
            ))}
          </select>
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

        <button className={`confirm-btn ${isEmergency ? 'btn-red' : 'btn-orange'}`} onClick={handleBookSubmit}>
          {isEmergency ? `Dispatch Emergency ${selectedService} Now` : "Confirm Standard Booking"}
        </button>
      </div>
    </div>
  );

  // --- PAGE 2.5: LOADING / SEARCHING SCREEN ---
  const renderSearching = () => (
    <div className="booking-page-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="booking-card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        {searchStatus === 'searching' ? (
          <>
            <div className="loading-spinner"></div>
            <h2 style={{marginTop: '24px'}}>AI Dispatch Active</h2>
            <p>Locating the nearest verified {selectedService}...</p>
          </>
        ) : (
          <>
            <div className="success-checkmark">✅</div>
            <h2 style={{marginTop: '24px'}}>Worker Assigned!</h2>
            <p>Ramesh has accepted your request. Loading live tracking...</p>
          </>
        )}
      </div>
    </div>
  );

  // --- PAGE 3: LIVE TRACKING ---
  const renderTracking = () => (
    <div className="tracking-page-container fade-in">
      <button className="back-btn" onClick={() => setCurrentView('home')}>← Cancel & Return Home</button>
      
      <div className="tracking-grid">
        <div className="tracking-left">
          <div className={`status-banner ${isEmergency ? 'banner-red' : 'banner-green'}`}>
            <h3>{isEmergency ? "🚨 Emergency Worker Dispatched!" : "✅ Booking Confirmed!"}</h3>
            <p>{isEmergency ? "Worker is arriving rapidly." : "Worker is on the way."}</p>
          </div>
          
          <div className="map-container" style={{ height: '350px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '20px', zIndex: 1 }}>
            <MapContainer center={[20.3055, 85.8147]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              
              <Polyline positions={routeCoords} color="#3b82f6" weight={5} dashArray="8, 10" opacity={0.7} />

              <Marker position={customerGPS} icon={customerIcon}>
                <Popup>Your Location</Popup>
              </Marker>

              <Marker position={workerPos} icon={activeWorkerIcon}>
                <Popup>Ramesh (Assigned to you)</Popup>
              </Marker>

              {availableWorkers.map((pos, idx) => (
                <Marker key={idx} position={pos} icon={idleWorkerIcon}>
                  <Popup>Available Worker</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="worker-profile-card">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Worker" className="worker-avatar" />
            <div className="worker-details">
              <h4>Ramesh Kumar</h4>
              <p className="capitalize">⭐ 4.9 (120 Jobs) • Verified {selectedService}</p>
              <span className="coop-badge">Cooperative Member (100% Payout)</span>
            </div>
          </div>
        </div>

        <div className="tracking-right">
          <div className="chat-interface">
            <div className="chat-header-small">Live Chat with Ramesh</div>
            <div className="chat-body">
              <div className="chat-msg system-msg">System: Found {availableWorkers.length + 1} nearby workers. AI Matched you with Ramesh based on real-time location.</div>
              {isEmergency && <div className="chat-msg system-msg-red">System: EMERGENCY OVERRIDE. Ramesh is dropping current tasks to reach you.</div>}
              <div className="chat-msg worker-msg">
                <strong>Ramesh:</strong> Hello! I have received your request for a {selectedService}. {isEmergency ? "I am on my way, reaching shortly!" : "I will reach your location at the booked time."}
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

      {currentView === 'home' && renderHome()}
      {currentView === 'booking' && renderBooking()}
      {currentView === 'searching' && renderSearching()}
      {currentView === 'tracking' && renderTracking()}
      
      {currentView === 'home' && (
        <footer className="dark-footer">
            <p>© 2026 Kushal-Setu | Terms | Privacy | Help</p>
        </footer>
      )}

      {currentView === 'home' && <ChatWidget />}
    </div>
  );
}