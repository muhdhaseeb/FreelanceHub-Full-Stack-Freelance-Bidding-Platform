import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyBids } from "../../api/bids";

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getMyBids().then(res => setBids(res.data.bids)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? bids : bids.filter(b => b.status === filter);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="bids-page">
      <div className="page-header">
        <div><h1>My Bids</h1><p className="text-muted">{bids.length} bids submitted</p></div>
        <Link to="/jobs" className="btn btn--primary">Browse Jobs</Link>
      </div>

      <div className="filter-bar">
        {["all", "pending", "accepted", "rejected"].map((s) => (
          <button key={s} className={"filter-btn" + (filter === s ? " filter-btn--active" : "")} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)} ({s === "all" ? bids.length : bids.filter(b => b.status === s).length})
          </button>
        ))}
      </div>

      <div className="bids-grid">
        {filtered.map((bid) => (
          <div key={bid._id} className="bid-detail-card">
            <div className="bid-detail-header">
              <Link to={`/jobs/${bid.jobId?._id}`} className="bid-job-title">{bid.jobId?.title || "Job"}</Link>
              <span className={"status-badge status-badge--" + bid.status}>{bid.status}</span>
            </div>
            <div className="bid-meta">
              <span>Your bid: <strong>${bid.amount}</strong></span>
              <span>Job: <span className={"status-badge status-badge--" + bid.jobId?.status}>{bid.jobId?.status}</span></span>
            </div>
            <p className="bid-proposal-preview">{bid.proposal.substring(0, 150)}...</p>
            <div className="bid-actions">
              <Link to={`/jobs/${bid.jobId?._id}`} className="btn btn--ghost btn--sm">View Job</Link>
              {bid.status === "accepted" && bid.jobId?.status === "in-progress" && (
                <Link to={`/jobs/${bid.jobId?._id}`} className="btn btn--primary btn--sm">Open Chat →</Link>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state-large">
            <div className="empty-icon">📭</div>
            <h3>No {filter} bids</h3>
          </div>
        )}
      </div>
    </div>
  );
}
