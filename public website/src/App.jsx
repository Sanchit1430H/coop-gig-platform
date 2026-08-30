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
  
  // searching -> waiting_for_worker -> found
  const [searchStatus, setSearchStatus] = useState('searching');
  
  // --- CUSTOMER LOGIN STATE ---
  const [customerToken, setCustomerToken] = useState(null);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- Worker registration state ---
  const [regStep, setRegStep] = useState(1);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [workerForm, setWorkerForm] = useState({ name: '', phone: '', password: '', category_id: '', society_id: '', experience_years: '', bio: '', eshram_uan: '', id_last4: '' });

  // --- CUSTOMER LOGIN LOGIC ---
  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('https://seva-api-1uco.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword }) 
      });
      const data = await res.json();
      
      if (data.token) {
        setCustomerToken(data.token);
        setCurrentView('booking'); // Go straight to booking after login!
      } else {
        setLoginError(data.error || 'Login failed. Check phone/password.');
      }
    } catch (err) {
      setLoginError('Could not connect to server.');
    }
  };

  // --- REAL LIVE BOOKING LOGIC ---
  const handleBookSubmit = async () => {
    if (!customerToken) {
      setCurrentView('customer-login');
      return;
    }

    setCurrentView('searching');
    setSearchStatus('searching');
    
    try {
      // 1. Create booking
      const res = await fetch('https://seva-api-1uco.onrender.com/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          category_id: 1, // Make sure your worker is category 1 in the DB!
          lat: 20.4620,   
          lng: 85.8820,   
          address_text: "Customer Location (Demo)",
          is_emergency: isEmergency ? 1 : 0
        })
      });
      
      const newBooking = await res.json();
      
      if (!newBooking.id) {
        console.error("Booking failed:", newBooking);
        return;
      }

      // 2. Poll the server for status changes
      const checkInterval = setInterval(async () => {
        const statusRes = await fetch('https://seva-api-1uco.onrender.com/api/bookings', {
          headers: { 'Authorization': `Bearer ${customerToken}` }
        });
        const bookings = await statusRes.json();
        const currentBooking = bookings.find(b => b.id === newBooking.id);
        
        if (currentBooking) {
          if (currentBooking.status === 'matched') {
            // The AI found a worker, now we wait for them to press Accept on Expo!
            setSearchStatus('waiting_for_worker');
          } 
          else if (currentBooking.status === 'accepted' || currentBooking.status === 'in_progress') {
            // The worker pressed Accept!
            clearInterval(checkInterval); 
            setSearchStatus('found');     
            setTimeout(() => {
              setCurrentView('tracking'); 
            }, 1500);
          }
        }
      }, 2000);

    } catch (error) {
      console.error("Booking error:", error);
    }
  };

  const renderCustomerLogin = () => (
    <div className="booking-page-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="booking-card" style={{ maxWidth: '400px', width: '100%' }}>
        <button className="back-btn" onClick={() => setCurrentView('home')}>← Back to Home</button>
        <h2>Customer Login</h2>
        <p>Please log in to book a service.</p>
        
        <form onSubmit={handleCustomerLogin}>
          <div className="form-group">
            <label>Phone Number</label>
            <input className="form-input" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} placeholder="e.g. 9222222210" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-input" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="pass123" required />
          </div>
          {loginError && <p className="reg-error">{loginError}</p>}
          <button type="submit" className="confirm-btn btn-orange">Log In & Continue</button>
        </form>
      </div>
    </div>
  );

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
            <button className="search-btn bubble-effect" onClick={() => customerToken ? setCurrentView('booking') : setCurrentView('customer-login')}>Search & Book</button>
          </div>
        </div>
      </section>
      
      {/* (Bottom Grid and Testimonials omitted for brevity, keeping them standard) */}
    </>
  );

  const renderBooking = () => (
    <div className="booking-page-container fade-in">
      <button className="back-btn" onClick={() => setCurrentView('home')}>← Back to Home</button>
      <div className="booking-card">
        <h2>Book a Service</h2>
        <p>Logged in securely. Workers get 100% of the booking fee.</p>
        
        <div className="form-group">
          <label>Service Required</label>
          <select className="form-input capitalize" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
            {Object.keys(CATEGORY_ICONS).map(name => (
              <option key={name} value={name}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className={`emergency-box ${isEmergency ? 'emergency-active' : ''}`}>
          <div className="emergency-header">
            <div>
              <strong>🚨 Emergency Booking?</strong>
              <p>Need someone right now? AI will dispatch the nearest active worker.</p>
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

  const renderSearching = () => (
    <div className="booking-page-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="booking-card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        
        {searchStatus === 'searching' && (
          <>
            <div className="loading-spinner"></div>
            <h2 style={{marginTop: '24px'}}>AI Dispatch Active</h2>
            <p>Locating the nearest verified {selectedService} in your area...</p>
          </>
        )}

        {searchStatus === 'waiting_for_worker' && (
          <>
            <div className="loading-spinner" style={{borderColor: '#f97316', borderTopColor: 'transparent'}}></div>
            <h2 style={{marginTop: '24px', color: '#f97316'}}>Worker Found!</h2>
            <p>We found a match! Waiting for the worker to accept the job on their app...</p>
          </>
        )}

        {searchStatus === 'found' && (
          <>
            <div className="success-checkmark">✅</div>
            <h2 style={{marginTop: '24px', color: '#22c55e'}}>Worker Accepted!</h2>
            <p>Loading live tracking map...</p>
          </>
        )}

      </div>
    </div>
  );

  const routeCoords = [ [20.3150, 85.8050], [20.3110, 85.8050], [20.3050, 85.8050], [20.3050, 85.8110], [20.3050, 85.8180], [20.3000, 85.8180], [20.2960, 85.8180], [20.2960, 85.8210], [20.2960, 85.8245] ];
  const customerGPS = routeCoords[routeCoords.length - 1];
  const [workerPos, setWorkerPos] = useState(routeCoords[0]);

  const renderTracking = () => (
    <div className="tracking-page-container fade-in">
      <button className="back-btn" onClick={() => setCurrentView('home')}>← Return Home</button>
      <div className="tracking-grid">
        <div className="tracking-left">
          <div className={`status-banner ${isEmergency ? 'banner-red' : 'banner-green'}`}>
            <h3>{isEmergency ? "🚨 Emergency Worker Dispatched!" : "✅ Booking Confirmed!"}</h3>
            <p>Worker is on the way.</p>
          </div>
          <div className="map-container" style={{ height: '350px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '20px', zIndex: 1 }}>
            <MapContainer center={[20.3055, 85.8147]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Polyline positions={routeCoords} color="#3b82f6" weight={5} dashArray="8, 10" opacity={0.7} />
              <Marker position={customerGPS} icon={customerIcon}><Popup>Your Location</Popup></Marker>
              <Marker position={workerPos} icon={activeWorkerIcon}><Popup>Assigned Worker</Popup></Marker>
            </MapContainer>
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
          {!customerToken ? (
            <button className="nav-btn-orange bubble-effect" onClick={() => setCurrentView('customer-login')}>Customer Login</button>
          ) : (
            <button className="nav-btn-orange bubble-effect" style={{backgroundColor: '#22c55e'}}>Logged In</button>
          )}
        </nav>
      </header>

      {currentView === 'home' && renderHome()}
      {currentView === 'customer-login' && renderCustomerLogin()}
      {currentView === 'booking' && renderBooking()}
      {currentView === 'searching' && renderSearching()}
      {currentView === 'tracking' && renderTracking()}
      
      {currentView === 'home' && (
        <footer className="dark-footer"><p>© 2026 Kushal-Setu | Terms | Privacy | Help</p></footer>
      )}
      {currentView === 'home' && <ChatWidget />}
    </div>
  );
}