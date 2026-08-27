import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

export default function WorkersPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState('pending');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getWorkers(token, `?verification_status=${tab}`);
      setWorkers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, tab]);

  useEffect(() => { load(); }, [load]);

  async function handleVerify(id, status) {
    try {
      await api.verifyWorker(token, id, status);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <h1>Worker Verification</h1>
      <p className="page-sub">Review and approve workers before they can accept jobs.</p>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={'tab' + (tab === t.key ? ' active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : workers.length === 0 ? (
        <p className="empty-state">No workers in this category.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Society</th>
              <th>Experience</th>
              <th>Bio</th>
              <th>Account status</th>
              {tab === 'pending' && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id}>
                <td>{w.name}<br /><span className="muted">{w.phone}</span></td>
                <td className="capitalize">{w.category_name?.replace('_', ' ')}</td>
                <td>{w.society_name}</td>
                <td>{w.experience_years} yrs</td>
                <td className="bio-cell">{w.bio}</td>
                <td>
                  <span className={`badge badge-${w.account_status}`}>{w.account_status}</span>
                </td>
                {tab === 'pending' && (
                  <td className="actions-cell">
                    <button className="btn-approve" onClick={() => handleVerify(w.id, 'verified')}>Approve</button>
                    <button className="btn-reject" onClick={() => handleVerify(w.id, 'rejected')}>Reject</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
