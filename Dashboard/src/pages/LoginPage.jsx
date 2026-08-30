import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Kushal-Setu</h1>
        <p className="subtitle">Cooperative Admin Dashboard</p>

        <label>Phone number</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9000000001" />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>

        <p className="hint">Federation or society admin accounts only.</p>
      </form>
    </div>
  );
}
