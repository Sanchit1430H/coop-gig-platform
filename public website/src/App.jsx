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
    { id: 2, name: "Rahul M.", location: "Rourkela", rating: "⭐⭐⭐⭐⭐", text: "Booked a plumber through Kushal-Setu. The AI dispatch matched me perfectly. Excellent service and zero hidden fees." },
    { id: 3, name: "Anjali D.", location: "Cuttack", rating: "⭐⭐⭐⭐", text: "I love the cooperative model. The carpenter was highly skilled and very professional. Will definitely use this again." },
    { id: 4, name: "Vikram K.", location: "Bhubaneswar", rating: "⭐⭐⭐⭐⭐", text: "Incredible app! The house cleaner was verified and did a spotless job. The direct pay feature is a game changer." }
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
  const [searchStatus, setSearchStatus] = useState('searching');
  
  // --- CUSTOMER LOGIN STATE ---
  const [customerToken, setCustomerToken] = useState(null);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // --- DYNAMIC WORKER DETAILS ---
  const [assignedWorker, setAssignedWorker] = useState(null);

  // --- Worker registration state ---
  const [regStep, setRegStep] = useState(1);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [workerForm, setWorkerForm] = useState({
    name: '', phone: '', password: '',
    category_id: '', society_id: '', experience_years: '', bio: '',
    eshram_uan: '', id_last4: '',
  });
  const [certificatePhoto, setCertificatePhoto] = useState(null); 

  function updateWorkerForm(field, value) {
    setWorkerForm((f) => ({ ...f, [field]: value }));
  }

  function handleCertificateFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCertificatePhoto({ previewUrl: URL.createObjectURL(file), base64: reader.result });
    };
    reader.readAsDataURL(file);
  }

  async function loadCategoriesAndSocieties(token) {
    try {
      const [cats, socs] = await Promise.all([api.getCategories(token), api.getSocieties(token)]);
      setCategories(cats);
      setSocieties(socs);
    } catch (err) {
      setRegError('Could not load service categories');
    }
  }

  function runVerificationAnimation(onDone) {
    const messages = [
      'Verifying e-Shram UAN…',
      'Cross-checking cooperative society records…',
      'Finalizing application…',
    ];
    setRegStep('verifying');
    let i = 0;
    setVerifyMessage(messages[0]);
    const interval = setInterval(() => {
      i++;
      if (i >= messages.length) {
        clearInterval(interval);
        onDone();
        return;
      }
      setVerifyMessage(messages[i]);
    }, 900);
  }

  async function handleAccountStep(e) {
    e.preventDefault();
    setRegError('');
    if (!workerForm.name || !workerForm.phone || !workerForm.password) {
      setRegError('Name, phone, and password are required.');
      return;
    }
    setRegLoading(true);
    try {
      const data = await api.register({
        name: workerForm.name, phone: workerForm.phone, password: workerForm.password, role: 'worker',
      });
      sessionStorage.setItem('worker_reg_token', data.token);
      await loadCategoriesAndSocieties(data.token);
      setRegStep(2);
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  }

  async function handleProfileStep(e) {
    e.preventDefault();
    setRegError('');
    if (!workerForm.category_id || !workerForm.society_id) {
      setRegError('Please select a service category and a society.');
      return;
    }
    setRegLoading(true);
    try {
      const token = sessionStorage.getItem('worker_reg_token');
      await api.createWorkerProfile(token, {
        category_id: parseInt(workerForm.category_id, 10),
        society_id: parseInt(workerForm.society_id, 10),
        experience_years: workerForm.experience_years ? parseFloat(workerForm.experience_years) : 0,
        bio: workerForm.bio || undefined,
        eshram_uan: workerForm.eshram_uan || undefined,
        id_last4: workerForm.id_last4 || undefined,
        certificate_photo_base64: certificatePhoto?.base64,
      });
      sessionStorage.removeItem('worker_reg_token');
      runVerificationAnimation(() => setRegStep(3));
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  }

  const routeCoords = [
    [20.3150, 85.8050],
    [20.3110, 85.8050],
    [20.3050, 85.8050],
    [20.3050, 85.8110],
    [20.3050, 85.8180],
    [20.3000, 85.8180],
    [20.2960, 85.8180],
    [20.2960, 85.8210],
    [20.2960, 85.8245]
  ];
  const customerGPS = routeCoords[routeCoords.length - 1];

  const [workerPos, setWorkerPos] = useState(routeCoords[0]);

  const availableWorkers = [
    [20.3010, 85.8300],
    [20.2850, 85.8150],
    [20.2920, 85.8400],
    [20.3050, 85.8100]
  ];

  useEffect(() => {
    let interval;
    if (currentView === 'tracking') {
      let currentIndex = 0;
      setWorkerPos(routeCoords[0]);
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

  // --- CUSTOMER LOGIN SUBMIT ---
  const handleCustomerLoginSubmit = async (e) => {
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
        setCurrentView('booking'); // Successfully logged in -> Move to Booking Form
      } else {
        setLoginError(data.error || 'Login failed. Check your credentials.');
      }
    } catch (err) {
      setLoginError('Could not connect to server.');
    }
  };

// --- REAL LIVE BOOKING & POLLING LOGIC ---
  const handleBookSubmit = async () => {
    if (!customerToken) {
      setCurrentView('customer-login');
      return;
    }

    setCurrentView('searching');
    setSearchStatus('searching');
    
    // Map the dropdown text to your actual database Category IDs
    const categoryMap = {
      plumber: 1,
      electrician: 2,
      carpenter: 3,
      mason: 4,
      cleaner: 5,
      painting: 6,
      house: 7,
      pest: 8,
      handyman: 9
    };

    const actualCategoryId = categoryMap[selectedService] || 1;

    try {
      // 1. Send the booking to the LIVE backend
      const res = await fetch('https://seva-api-1uco.onrender.com/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          category_id: actualCategoryId, // NOW IT SENDS THE REAL CATEGORY!
          lat: 20.4620,   // GPS coordinates near Expo app default
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

      // 2. Poll the server waiting for EXPO GO to accept
      const checkInterval = setInterval(async () => {
        const statusRes = await fetch('https://seva-api-1uco.onrender.com/api/bookings', {
          headers: { 'Authorization': `Bearer ${customerToken}` }
        });
        const bookings = await statusRes.json();
        const currentBooking = bookings.find(b => b.id === newBooking.id);
        
        if (currentBooking) {
          // Worker hit accept on Expo App!
          if (currentBooking.status === 'accepted' || currentBooking.status === 'in_progress') {
            clearInterval(checkInterval); 
            
            // Try to extract the assigned worker's name/details if the backend provides it
            if (currentBooking.worker) {
               setAssignedWorker(currentBooking.worker);
            }
            
            setSearchStatus('found');     
            setTimeout(() => {
              setCurrentView('tracking'); // Move to dispatch page
            }, 1500);
          }
        }
      }, 2000);

    } catch (error) {
      console.error("Booking error:", error);
    }
  };

  // --- VIEWS ---

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
            {/* If logged in -> go to booking. If not -> go to login */}
            <button className="search-btn bubble-effect" onClick={() => customerToken ? setCurrentView('booking') : setCurrentView('customer-login')}>Search & Book</button>
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="column-section">
          <h4>Featured Service Category</h4>
          <div className="mini-category-grid">
            {Object.entries(CATEGORY_ICONS).map(([name, icon]) => (
              <div key={name} className="mini-category-chip bubble-effect" onClick={() => { 
                  setSelectedService(name); 
                  customerToken ? setCurrentView('booking') : setCurrentView('customer-login'); 
                }}>
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
        <h2>What Our Customers Say</h2>
        <Testimonials />
      </section>
    </>
  );

  const renderCustomerLogin = () => (
    <div className="booking-page-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="booking-card" style={{ maxWidth: '400px', width: '100%' }}>
        <button className="back-btn" onClick={() => setCurrentView('home')}>← Back to Home</button>
        <h2>Customer Login</h2>
        <p>Please log in to your account to book a service.</p>
        
        <form onSubmit={handleCustomerLoginSubmit}>
          <div className="form-group">
            <label>Phone Number</label>
            <input className="form-input" placeholder="e.g. 9222222210" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-input" placeholder="Enter password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
          </div>
          {loginError && <p className="reg-error">{loginError}</p>}
          <button type="submit" className="confirm-btn btn-orange">Log In & Continue</button>
        </form>
      </div>
    </div>
  );

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

  const renderSearching = () => (
    <div className="booking-page-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="booking-card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        {searchStatus === 'searching' ? (
          <>
            <div className="loading-spinner"></div>
            <h2 style={{marginTop: '24px'}}>AI Dispatch Active</h2>
            <p>Locating the nearest verified {selectedService}...</p>
            <p style={{fontSize: '13px', color: '#f97316', marginTop: '10px', fontWeight: 'bold'}}>Waiting for worker to accept on their app...</p>
          </>
        ) : (
          <>
            <div className="success-checkmark">✅</div>
            <h2 style={{marginTop: '24px'}}>Worker Assigned!</h2>
            <p>Worker has accepted your request. Loading live tracking...</p>
          </>
        )}
      </div>
    </div>
  );

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
                <Popup>Assigned Worker</Popup>
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
              <h4>{assignedWorker?.name || "Verified Worker"}</h4>
              {assignedWorker?.phone && <p style={{margin: '2px 0'}}>📞 {assignedWorker.phone}</p>}
              <p className="capitalize">⭐ 4.9 (120 Jobs) • Verified {selectedService}</p>
              <span className="coop-badge">Cooperative Member (100% Payout)</span>
            </div>
          </div>
        </div>

        <div className="tracking-right">
          <div className="chat-interface">
            <div className="chat-header-small">Live Chat with Worker</div>
            <div className="chat-body">
              <div className="chat-msg system-msg">System: Found nearby workers. AI Matched you with a worker based on real-time location.</div>
              {isEmergency && <div className="chat-msg system-msg-red">System: EMERGENCY OVERRIDE. Worker is dropping current tasks to reach you.</div>}
              <div className="chat-msg worker-msg">
                <strong>Worker:</strong> Hello! I have received your request for a {selectedService}. {isEmergency ? "I am on my way, reaching shortly!" : "I will reach your location at the booked time."}
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

  const renderWorkerRegister = () => (
    <div className="booking-page-container fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="booking-card" style={{ maxWidth: '480px', width: '100%' }}>
        <button className="back-btn" onClick={() => setCurrentView('home')}>← Back to Home</button>

        {(regStep === 1 || regStep === 2) && (
          <div className="reg-step-indicator">
            <span className={regStep === 1 ? 'reg-step-active' : 'reg-step-done'}>1. Account</span>
            <span className="reg-step-divider">—</span>
            <span className={regStep === 2 ? 'reg-step-active' : ''}>2. Worker Profile</span>
          </div>
        )}

        {regStep === 1 && (
          <form onSubmit={handleAccountStep}>
            <h2>Become a Worker</h2>
            <p>Join through your local labour cooperative. Step 1 of 2: create your account.</p>

            <div className="form-group">
              <label>Full Name</label>
              <input className="form-input" value={workerForm.name} onChange={(e) => updateWorkerForm('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input className="form-input" value={workerForm.phone} onChange={(e) => updateWorkerForm('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-input" value={workerForm.password} onChange={(e) => updateWorkerForm('password', e.target.value)} />
            </div>

            {regError && <p className="reg-error">{regError}</p>}
            <button type="submit" className="confirm-btn btn-orange" disabled={regLoading}>
              {regLoading ? 'Creating account…' : 'Continue'}
            </button>
          </form>
        )}

        {regStep === 2 && (
          <form onSubmit={handleProfileStep}>
            <h2>Worker Profile</h2>
            <p>Step 2 of 2: your trade details. Your application goes to your cooperative society for verification.</p>

            <div className="form-group">
              <label>Service Category</label>
              <select className="form-input capitalize" value={workerForm.category_id} onChange={(e) => updateWorkerForm('category_id', e.target.value)}>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Cooperative Society</label>
              <select className="form-input" value={workerForm.society_id} onChange={(e) => updateWorkerForm('society_id', e.target.value)}>
                <option value="">Select your society</option>
                {societies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Years of Experience</label>
                <input type="number" className="form-input" value={workerForm.experience_years} onChange={(e) => updateWorkerForm('experience_years', e.target.value)} />
              </div>
              <div className="form-group">
                <label>e-Shram UAN (optional)</label>
                <input className="form-input" placeholder="12-digit number" value={workerForm.eshram_uan} onChange={(e) => updateWorkerForm('eshram_uan', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Short Bio</label>
              <input className="form-input" placeholder="e.g. 5 years residential wiring experience" value={workerForm.bio} onChange={(e) => updateWorkerForm('bio', e.target.value)} />
            </div>

            <div className="form-group">
              <label>ID last 4 digits (optional — never share your full ID number)</label>
              <input className="form-input" maxLength={4} placeholder="e.g. 4321" value={workerForm.id_last4} onChange={(e) => updateWorkerForm('id_last4', e.target.value)} />
            </div>

            <div className="form-group">
              <label>Upload a certificate or ID photo (optional)</label>
              <input type="file" accept="image/*" onChange={handleCertificateFile} />
              {certificatePhoto && <img src={certificatePhoto.previewUrl} alt="Certificate preview" className="reg-photo-preview" />}
            </div>

            <p className="reg-disclaimer">
              We don't verify your e-Shram UAN against a live government database — it's recorded as
              provided and your cooperative society will verify your details directly.
            </p>

            {regError && <p className="reg-error">{regError}</p>}
            <button type="submit" className="confirm-btn btn-orange" disabled={regLoading}>
              {regLoading ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        )}

        {regStep === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '20px', color: '#64748b', fontSize: '14px' }}>{verifyMessage}</p>
          </div>
        )}

        {regStep === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div className="success-checkmark">✅</div>
            <h2 style={{ marginTop: '24px' }}>Application Submitted!</h2>
            <p>Your cooperative society will review your details and verify your profile. You'll be able to log in and start accepting jobs once approved.</p>
            <button className="confirm-btn btn-orange" style={{ marginTop: '20px' }} onClick={() => setCurrentView('home')}>
              Back to Home
            </button>
          </div>
        )}
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
          <a href="#become-worker" onClick={() => { setRegStep(1); setCurrentView('register-worker'); }}>Become a Worker</a>
          {/* TOP RIGHT LOGIN BUTTON LOGIC */}
          {!customerToken ? (
            <button className="nav-btn-orange bubble-effect" onClick={() => setCurrentView('customer-login')}>Login to Book</button>
          ) : (
            <button className="nav-btn-orange bubble-effect" style={{backgroundColor: '#22c55e'}} onClick={() => setCurrentView('booking')}>Post a Request</button>
          )}
        </nav>
      </header>

      {/* RENDER THE CORRECT VIEW */}
      {currentView === 'home' && renderHome()}
      {currentView === 'customer-login' && renderCustomerLogin()}
      {currentView === 'booking' && renderBooking()}
      {currentView === 'searching' && renderSearching()}
      {currentView === 'tracking' && renderTracking()}
      {currentView === 'register-worker' && renderWorkerRegister()}
      
      {currentView === 'home' && (
        <footer className="dark-footer">
            <p>© 2026 Kushal-Setu | Terms | Privacy | Help</p>
        </footer>
      )}

      {currentView === 'home' && <ChatWidget />}
    </div>
  );
}