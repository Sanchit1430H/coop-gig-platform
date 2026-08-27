import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const STATUS_LABELS = {
  awaiting_evidence: 'Awaiting evidence',
  voting: 'Peer tribunal voting',
  upheld: 'Upheld — deactivated',
  dismissed: 'Dismissed — cleared',
};

export default function DisputesPage() {
  const { token } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getDisputes(token);
      setDisputes(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(id) {
    const detail = await api.getDispute(token, id);
    setSelected(detail);
  }

  return (
    <div>
      <h1>Peer Tribunal Disputes</h1>
      <p className="page-sub">
        Workers are never auto-banned. A low rating puts them in a "show cause" state; they
        submit evidence, and three random verified peer workers vote to uphold or dismiss.
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : disputes.length === 0 ? (
        <p className="empty-state">No disputes raised yet.</p>
      ) : (
        <div className="dispute-layout">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Worker</th>
                <th>Trigger</th>
                <th>Status</th>
                <th>Raised</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id} className="clickable-row" onClick={() => openDetail(d.id)}>
                  <td>#{d.id}</td>
                  <td>Worker #{d.worker_id}</td>
                  <td className="capitalize">{d.trigger_reason.replace(/_/g, ' ')}</td>
                  <td><span className={`badge badge-dispute-${d.status}`}>{STATUS_LABELS[d.status]}</span></td>
                  <td className="muted">{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selected && (
            <div className="detail-panel">
              <h3>Dispute #{selected.id}</h3>
              <p className="badge-row"><span className={`badge badge-dispute-${selected.status}`}>{STATUS_LABELS[selected.status]}</span></p>

              <div className="detail-field">
                <label>Trigger</label>
                <p className="capitalize">{selected.trigger_reason.replace(/_/g, ' ')}</p>
              </div>

              {selected.worker_evidence && (
                <div className="detail-field">
                  <label>Worker's evidence</label>
                  <p>{selected.worker_evidence}</p>
                </div>
              )}

              {selected.votes?.length > 0 && (
                <div className="detail-field">
                  <label>Jury votes ({selected.votes.length}/3)</label>
                  <ul className="vote-list">
                    {selected.votes.map((v, i) => (
                      <li key={i}>Juror #{v.juror_worker_id}: <strong>{v.vote}</strong></li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.resolution_note && (
                <div className="detail-field">
                  <label>Resolution</label>
                  <p>{selected.resolution_note}</p>
                </div>
              )}

              <button className="btn-close" onClick={() => setSelected(null)}>Close</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
