import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function SetupPage() {
  const { token } = useAuth();
  const [societies, setSocieties] = useState([]);
  const [categories, setCategories] = useState([]);

  const [societyName, setSocietyName] = useState('');
  const [societyCity, setSocietyCity] = useState('');
  const [federationId, setFederationId] = useState('1');

  const [categoryName, setCategoryName] = useState('');
  const [categoryRate, setCategoryRate] = useState('');

  async function load() {
    const [s, c] = await Promise.all([api.getSocieties(token), api.getCategories(token)]);
    setSocieties(s);
    setCategories(c);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function addSociety(e) {
    e.preventDefault();
    try {
      await api.createSociety(token, { federation_id: parseInt(federationId, 10), name: societyName, city: societyCity });
      setSocietyName(''); setSocietyCity('');
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function addCategory(e) {
    e.preventDefault();
    try {
      await api.createCategory(token, { name: categoryName, base_rate: parseFloat(categoryRate) });
      setCategoryName(''); setCategoryRate('');
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <h1>Societies &amp; Categories</h1>
      <p className="page-sub">Federation admin setup — the building blocks other screens depend on.</p>

      <div className="two-col">
        <section className="setup-section">
          <h3>Societies</h3>
          <form onSubmit={addSociety} className="inline-form">
            <input placeholder="Federation ID" value={federationId} onChange={(e) => setFederationId(e.target.value)} style={{ width: 90 }} />
            <input placeholder="Society name" value={societyName} onChange={(e) => setSocietyName(e.target.value)} required />
            <input placeholder="City" value={societyCity} onChange={(e) => setSocietyCity(e.target.value)} />
            <button type="submit">Add</button>
          </form>
          <ul className="simple-list">
            {societies.map((s) => (
              <li key={s.id}>{s.name} — {s.city}</li>
            ))}
          </ul>
        </section>

        <section className="setup-section">
          <h3>Service Categories</h3>
          <form onSubmit={addCategory} className="inline-form">
            <input placeholder="Category name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
            <input placeholder="Base rate (₹)" type="number" value={categoryRate} onChange={(e) => setCategoryRate(e.target.value)} required style={{ width: 120 }} />
            <button type="submit">Add</button>
          </form>
          <ul className="simple-list">
            {categories.map((c) => (
              <li key={c.id} className="capitalize">{c.name.replace('_', ' ')} — ₹{c.base_rate}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
