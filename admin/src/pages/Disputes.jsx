import { useState, useEffect } from 'react';
import { getAllDisputes, resolveDispute } from '../api/disputes';

const statusColor = { open: '#f59e0b', resolved: '#10b981' };
const resolutionLabels = {
  refund_client:      '💰 Refund Client',
  release_freelancer: '✅ Release to Freelancer',
  cancel_job:         '❌ Cancel Job',
};

export default function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('open');
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [adminNote, setAdminNote]   = useState('');
  const [resolving, setResolving]   = useState(false);
  const [error, setError]           = useState('');

  const fetchDisputes = () => {
    setLoading(true);
    getAllDisputes({ status: filter || undefined })
      .then(res => { setDisputes(res.data.disputes); setTotal(res.data.total); })
      .catch(() => setError('Failed to load disputes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDisputes(); }, [filter]);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolution) return;
    setResolving(true); setError('');
    try {
      await resolveDispute(selected._id, { resolution, adminNote });
      setSelected(null); setResolution(''); setAdminNote('');
      fetchDisputes();
    } catch (err) { setError(err.response?.data?.message || 'Failed to resolve'); }
    finally { setResolving(false); }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Disputes</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{total} total disputes</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['open', 'resolved', ''].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={'btn ' + (filter === s ? 'btn-primary' : 'btn-ghost')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="loading"><div className="spinner"></div></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {disputes.length === 0 && <div className="empty-state"><p>No disputes found.</p></div>}
          {disputes.map(d => (
            <div key={d._id} className="stat-card" style={{ borderLeft: `4px solid ${statusColor[d.status]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <strong>{d.jobId?.title || 'Unknown Job'}</strong>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: statusColor[d.status] + '22', color: statusColor[d.status], fontWeight: 600 }}>
                      {d.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                    Raised by <strong>{d.raisedBy?.name}</strong> ({d.raisedBy?.role}) against <strong>{d.againstUser?.name}</strong>
                  </p>
                  <p style={{ fontSize: '0.875rem' }}>{d.reason}</p>
                  {d.resolution && (
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#10b981' }}>
                      Resolution: {resolutionLabels[d.resolution]}
                      {d.adminNote && ` — "${d.adminNote}"`}
                    </p>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
                    {new Date(d.createdAt).toLocaleString()}
                  </p>
                </div>
                {d.status === 'open' && (
                  <button className="btn btn-primary btn-sm" onClick={() => { setSelected(d); setResolution(''); setAdminNote(''); }}>
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Resolve Dispute</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <form onSubmit={handleResolve} className="modal-form">
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                Job: <strong>{selected.jobId?.title}</strong>
              </p>
              <div className="form-group">
                <label>Resolution *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.entries(resolutionLabels).map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', border: `1px solid ${resolution === val ? 'var(--accent)' : 'var(--border)'}`, background: resolution === val ? 'rgba(56,189,248,0.08)' : 'transparent' }}>
                      <input type="radio" name="resolution" value={val} checked={resolution === val} onChange={() => setResolution(val)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Admin Note <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3} placeholder="Explain your decision..." />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={resolving || !resolution}>
                  {resolving ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
