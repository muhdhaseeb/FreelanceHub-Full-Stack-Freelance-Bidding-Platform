import { useState, useEffect } from "react";
import { getUsers, banUser, unbanUser, deleteUser } from "../api/admin";
import Pagination from "../components/common/Pagination";

export default function Users() {
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole]     = useState("");
  const [banned, setBanned] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Ban modal
  const [banModal, setBanModal] = useState(null); // { user }
  const [banReason, setBanReason] = useState("");

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ search, role, banned, page, limit: 20 });
      setUsers(res.data.users);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search, role, banned, page]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  const handleBan = async () => {
    if (!banModal) return;
    setActionLoading(true);
    try {
      await banUser(banModal.user._id, banReason);
      setBanModal(null); setBanReason(""); fetch();
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleUnban = async (user) => {
    if (!window.confirm(`Unban ${user.name}?`)) return;
    setActionLoading(true);
    try { await unbanUser(user._id); fetch(); }
    catch (err) { alert(err.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.name}? This cannot be undone.`)) return;
    setActionLoading(true);
    try { await deleteUser(user._id); fetch(); }
    catch (err) { alert(err.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Users</h1><p>{total} total users</p></div>
      </div>

      <div className="card">
        <div className="toolbar">
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
            <input className="search-input" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by name or email..." />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
          <select className="filter-select" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="client">Client</option>
            <option value="freelancer">Freelancer</option>
          </select>
          <select className="filter-select" value={banned} onChange={e => { setBanned(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Banned</option>
          </select>
        </div>

        {loading ? <div className="loading"><div className="spinner"></div></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Role</th><th>Status</th>
                  <th>Rating</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong></td>
                    <td style={{ color: "var(--muted)" }}>{u.email}</td>
                    <td><span className={"badge badge-" + u.role}>{u.role}</span></td>
                    <td>
                      {u.isBanned
                        ? <span className="badge badge-banned" title={u.banReason}>Banned</span>
                        : <span className="badge badge-active">Active</span>}
                    </td>
                    <td>{u.avgRating > 0 ? `⭐ ${u.avgRating}` : "—"}</td>
                    <td style={{ color: "var(--muted)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {u.isBanned
                          ? <button className="btn btn-success btn-sm" onClick={() => handleUnban(u)} disabled={actionLoading}>Unban</button>
                          : <button className="btn btn-danger btn-sm" onClick={() => { setBanModal({ user: u }); setBanReason(""); }} disabled={actionLoading}>Ban</button>
                        }
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)} disabled={actionLoading}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="empty"><div className="empty-icon">👥</div><p>No users found</p></div>}
          </div>
        )}
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div className="modal-overlay" onClick={() => setBanModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ban {banModal.user.name}</h2>
              <button className="modal-close" onClick={() => setBanModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Reason</label>
                <input type="text" value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason for ban..." />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setBanModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleBan} disabled={actionLoading}>
                {actionLoading ? "Banning..." : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
