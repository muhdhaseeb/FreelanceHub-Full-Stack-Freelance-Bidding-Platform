import { useState, useEffect } from "react";
import { getJobs, cancelJob } from "../api/admin";
import Pagination from "../components/common/Pagination";

export default function Jobs() {
  const [jobs, setJobs]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getJobs({ search, status, page, limit: 20 });
      setJobs(res.data.jobs);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search, status, page]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await cancelJob(cancelModal._id, cancelReason);
      setCancelModal(null); setCancelReason(""); fetch();
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Jobs</h1><p>{total} total jobs</p></div>
      </div>

      <div className="card">
        <div className="toolbar">
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
            <input className="search-input" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by title or description..." />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
          <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? <div className="loading"><div className="spinner"></div></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Client</th><th>Freelancer</th><th>Budget</th><th>Status</th><th>Posted</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j._id}>
                    <td><strong>{j.title}</strong></td>
                    <td style={{ color: "var(--muted)" }}>{j.clientId?.name || "—"}</td>
                    <td style={{ color: "var(--muted)" }}>{j.assignedFreelancerId?.name || "—"}</td>
                    <td>${j.budgetMin}–${j.budgetMax}</td>
                    <td><span className={"badge badge-" + j.status.replace(" ","-")}>{j.status}</span></td>
                    <td style={{ color: "var(--muted)" }}>{new Date(j.createdAt).toLocaleDateString()}</td>
                    <td>
                      {!["completed","cancelled"].includes(j.status) && (
                        <button className="btn btn-danger btn-sm" onClick={() => { setCancelModal(j); setCancelReason(""); }} disabled={actionLoading}>
                          Force Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.length === 0 && <div className="empty"><div className="empty-icon">📋</div><p>No jobs found</p></div>}
          </div>
        )}
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>

      {cancelModal && (
        <div className="modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Force Cancel Job</h2>
              <button className="modal-close" onClick={() => setCancelModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: "1rem", color: "var(--muted)", fontSize: "0.85rem" }}>
                Cancelling: <strong style={{ color: "var(--text)" }}>{cancelModal.title}</strong>
              </p>
              <div className="form-group">
                <label>Reason</label>
                <input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason for cancellation..." />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setCancelModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleCancel} disabled={actionLoading}>
                {actionLoading ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
