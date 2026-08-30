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

const Testimonials = () => {
  const reviews = [
    { id: 1, name: "Priya S.", location: "Bhubaneswar", rating: "⭐⭐⭐⭐⭐", text: "The electrician arrived in 20 minutes. Finally a platform where I know the worker is actually getting the full amount I pay!" },
    { id: 2, name: "Rahul M.", location: "Rourkela", rating: "⭐⭐⭐⭐⭐", text: "Booked a plumber through Kushal-Setu. The AI dispatch matched me perfectly. Excellent service and zero hidden fees." }
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
  const [currentView, setCurrentView] = useState('home');
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedService, setSelectedService] = useState('plumber');
  
  // Searching phases: 'searching' -> 'assigned' -> 'accepted'
  const [searchPhase, setSearchPhase] = useState('searching');
  const [assignedWorkerName, setAssignedWorkerName] = useState('Ramesh');
  
  // --- AUTHENTICATION STATE ---
  const [authUser, setAuthUser] = useState(null); // { role: 'customer' | 'worker', token: '...', name: '...' }
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTab, setLoginTab] = useState('customer');
  const [loginPhone, setLoginPhone] = useState('9222222210');
  const [loginPassword, setLoginPassword] = useState('pass123');

  // --- Worker registration state ---
  const [regStep, setRegStep] = useState(1);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [workerForm, setWorkerForm] = useState({ name: '', phone: '', password: '' });

  // Worker Dashboard State
  const [pendingJobs, setPendingJobs] = useState([]);

  // --- LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Use your live API, or mock it for the demo if you prefer
      const res = await fetch('https://seva-api-1uco.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword }) 
      });
      const data = await res.json();
      
      if (data.token) {
        setAuthUser({ 
          role: loginTab, 
          token: data.token, 
          name: loginTab === 'worker' ? 'Ramesh' : 'Customer' 
        });
        setShowLoginModal(false);
        if (loginTab === 'worker') setCurrentView('worker-dashboard');
      } else {
        alert("Login failed: " + (data.message || "Invalid credentials"));
      }
    } catch (err) {
      console.error("Login error", err);
      // Fallback for presentation if server is asleep
      setAuthUser({ role: loginTab, token: 'mock-token-123', name: loginTab === 'worker' ? 'Ramesh' : 'Customer' });
      setShowLoginModal(false);
      if (loginTab === 'worker') setCurrentView('worker-dashboard');
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    setCurrentView('home');
  };

  const handleBookClick = () => {
    if (!authUser || authUser.role !== 'customer') {
      setLoginTab('customer');
      setShowLoginModal(true);
    } else {
      setCurrentView('booking');
    }
  };

  // --- REAL LIVE BOOKING LOGIC ---
  const handleBookSubmit = async () => {
    setCurrentView('searching');
    setSearchPhase('searching');
    
    try {
      const res = await fetch('https://seva-api-1uco.onrender.com/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authUser.token}`
        },
        body: JSON.stringify({
          category_id: 1, 
          lat: 20.4620,   
          lng: 85.8820,   
          address_text: "Customer Location (Demo)",
          is_emergency: isEmergency ? 1 : 0
        })
      });
      
      const newBooking = await res.json();
      
      // Phase 1: Wait 3 seconds, then pretend we found a worker
      setTimeout(() => {
        setAssignedWorkerName('Ramesh (Plumber)');
        setSearchPhase('assigned');
      }, 3000);

      // Phase 2: Poll server waiting for Worker to accept
      const checkInterval = setInterval(async () => {
        const statusRes = await fetch('https://seva-api-1uco.onrender.com/api/bookings', {
          headers: { 'Authorization': `Bearer ${authUser.token}` }
        });
        const bookings = await statusRes.json();
        
        // Handle array or single object depending on your API
        const bookingList = Array.isArray(bookings) ? bookings : [bookings];
        const currentBooking = bookingList.find(b => b.id === (newBooking.id || b.id));
        
        if (currentBooking && currentBooking.status === 'accepted') {
          clearInterval(checkInterval); 
          setSearchPhase('accepted');     
          setTimeout(() => {
            setCurrentView('tracking'); 
          }, 1500);
        }
      }, 2000);

    } catch (error) {
      console.error("Booking error:", error);
    }
  };

  // --- WORKER DASHBOARD LOGIC ---
  const fetchPendingJobs = async () => {
    if (!authUser || authUser.role !== 'worker') return;
    try {
      const res = await fetch('https://seva-api-1uco.onrender.com/api/bookings', {
        headers: { 'Authorization': `Bearer ${authUser.token}` }
      });
      const data = await res.json();
      const bookings = Array.isArray(data) ? data : [data];
      setPendingJobs(bookings.filter(b => b.status === 'pending' || b.status === 'searching' || !b.status));
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
  };

  useEffect(() => {
    if (currentView === 'worker-dashboard') {
      fetchPendingJobs();
      const interval = setInterval(fetchPendingJobs, 3000); // Auto-refresh jobs
      return () => clearInterval(interval);
    }
  }, [currentView, authUser]);

  const acceptJob = async (jobId) => {
    try {
      // Adjust this URL/Method to match your backend's accept logic
      await fetch(`https://seva-api-1uco.onrender.com/api/bookings/${jobId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authUser.token}`
        },
        body: JSON.stringify({ status: 'accepted' })
      });
      fetchPendingJobs();
      alert("Job Accepted! Customer is now being routed to tracking page.");
    } catch (err) {
      console.error("Failed to accept job", err);
    }
  };

  // --- MAP TRACKING LOGIC ---
  const routeCoords = [[20.3150, 85.8050], [20.3110, 85.8050], [20.3050, 85.8050], [20.3050, 85.8110], [20.2960, 85.8245]];
  const [workerPos, setWorkerPos] = useState(routeCoords[0]);

  useEffect(() => {
    let interval;
    if (currentView === 'tracking') {
      let currentIndex = 0;
      setWorkerPos(routeCoords[0]);
      interval = setInterval(() => {
        currentIndex++;
        if (currentIndex >= routeCoords.length) clearInterval(interval);
        else setWorkerPos(routeCoords[currentIndex]);
      }, isEmergency ? 1500 : 2500);
    }
    return () => clearInterval(interval);
  }, [currentView, isEmergency]);

  // --- VIEWS ---
  const renderHome = () => (
    <>
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="slide-up-fade">Find Verified Workers Instantly.</h1>
          <p className="slide-up-fade">Zero commissions. Fair pay for workers, fast service for you.</p>

          <div className="search-bar bubble-effect">
            <div className="search-input-group">
              <span className="search-icon">🔍</span>
              <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                {Object.keys(CATEGORY_ICONS).map(name => (
                  <option key={name} value={name}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
                ))}
              </select>
            </div>
            <button className="search-btn bubble-effect" onClick={handleBookClick}>Search & Book</button>
          </div>
        </div>
      </section>
      <section className="testimonials-section">
        <h2>What Our Customers Say</h2>
        <Testimonials />
      </section>
    </>
  );

  const renderBooking = () => (
    <div className="booking-page-container fade-in">
      <button className="back-btn" onClick={() => setCurrentView('home')}>← Back to Home</button>
      <div className="booking-card">
        <h2>Book a Service</h2>
        <div className="form-group">
          <label>Service Required</label>
          <select className="form-input capitalize" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
            {Object.keys(CATEGORY_ICONS).map(name => (
              <option key={name} value={name}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
            ))}
          </select>
        </div>
        <button className={`confirm-btn ${isEmergency ? 'btn-red' : 'btn-orange'}`} onClick={handleBookSubmit}>
          Confirm Booking
        </button>
      </div>
    </div>
  );

  const renderSearching = () => (
    <div className="booking-page-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="booking-card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        {searchPhase === 'searching' && (
          <>
            <div className="loading-spinner"></div>
            <h2 style={{marginTop: '24px'}}>AI Dispatch Active</h2>
            <p>Locating the nearest verified {selectedService}...</p>
          </>
        )}
        {searchPhase === 'assigned' && (
          <>
            <div className="loading-spinner" style={{ borderColor: '#f97316', borderTopColor: 'transparent' }}></div>
            <h2 style={{marginTop: '24px'}}>Worker Assigned!</h2>
            <p>You have been assigned to <strong>{assignedWorkerName}</strong>.</p>
            <p style={{color: '#64748b'}}>Waiting for their response...</p>
          </>
        )}
        {searchPhase === 'accepted' && (
          <>
            <div className="success-checkmark">✅</div>
            <h2 style={{marginTop: '24px'}}>Job Accepted!</h2>
            <p>{assignedWorkerName} is on the way. Loading live tracking...</p>
          </>
        )}
      </div>
    </div>
  );

  const renderWorkerDashboard = () => (
    <div className="booking-page-container fade-in">
      <div className="booking-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2>👷 Worker Dashboard</h2>
        <p>Welcome back, {authUser?.name}. Here are your pending job requests:</p>
        
        {pendingJobs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', marginTop: '20px' }}>
            <p>No new jobs right now. Searching...</p>
            <div className="loading-spinner" style={{ width: '30px', height: '30px', margin: '10px auto' }}></div>
          </div>
        ) : (
          pendingJobs.map(job => (
            <div key={job.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>🚨 New Job Request</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Location: {job.address_text || 'Customer Location'}</p>
                {job.is_emergency === 1 && <span style={{ color: 'red', fontSize: '12px', fontWeight: 'bold' }}>EMERGENCY OVERRIDE</span>}
              </div>
              <button onClick={() => acceptJob(job.id)} className="confirm-btn btn-orange" style={{ width: 'auto', padding: '10px 20px', marginTop: 0 }}>
                Accept Job
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTracking = () => (
    <div className="tracking-page-container fade-in">
      <button className="back-btn" onClick={() => setCurrentView('home')}>← Cancel & Return Home</button>
      <div className="tracking-grid">
        <div className="tracking-left">
          <div className="status-banner banner-green">
            <h3>✅ Worker is on the way!</h3>
          </div>
          <div className="map-container" style={{ height: '350px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <MapContainer center={[20.3055, 85.8147]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Polyline positions={routeCoords} color="#3b82f6" weight={5} dashArray="8, 10" />
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
          {authUser ? (
            <>
              <span style={{ marginRight: '15px', color: '#64748b' }}>Hi, {authUser.name}</span>
              {authUser.role === 'worker' && <button className="nav-btn-orange" onClick={() => setCurrentView('worker-dashboard')} style={{ marginRight: '10px', background: 'transparent', color: '#f97316', border: '1px solid #f97316' }}>Dashboard</button>}
              <button className="nav-btn-orange bubble-effect" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="nav-btn-orange bubble-effect" onClick={() => setShowLoginModal(true)}>Log In</button>
          )}
        </nav>
      </header>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Log In</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => setLoginTab('customer')} style={{ flex: 1, padding: '10px', background: loginTab === 'customer' ? '#f97316' : '#e2e8f0', color: loginTab === 'customer' ? '#fff' : '#000', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Customer</button>
              <button onClick={() => setLoginTab('worker')} style={{ flex: 1, padding: '10px', background: loginTab === 'worker' ? '#f97316' : '#e2e8f0', color: loginTab === 'worker' ? '#fff' : '#000', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Worker</button>
            </div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Phone Number</label>
                <input className="form-input" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-input" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
              <button type="submit" className="confirm-btn btn-orange">Login as {loginTab === 'customer' ? 'Customer' : 'Worker'}</button>
              <button type="button" style={{ width: '100%', padding: '12px', marginTop: '10px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }} onClick={() => setShowLoginModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {currentView === 'home' && renderHome()}
      {currentView === 'booking' && renderBooking()}
      {currentView === 'searching' && renderSearching()}
      {currentView === 'tracking' && renderTracking()}
      {currentView === 'worker-dashboard' && renderWorkerDashboard()}
      
      {currentView === 'home' && (
        <footer className="dark-footer">
            <p>© 2026 Kushal-Setu | Terms | Privacy | Help</p>
        </footer>
      )}

      {currentView === 'home' && <ChatWidget />}
    </div>
  );
}