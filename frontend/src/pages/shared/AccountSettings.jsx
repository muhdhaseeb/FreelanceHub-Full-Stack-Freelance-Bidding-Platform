import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteAccount } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await deleteAccount(password);
      logout();
      navigate("/login");
      alert("Your account has been deleted.");
    } catch (err) { setError(err.response?.data?.message || "Failed to delete account"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div className="page-header">
        <div><h1>Account Settings</h1></div>
      </div>

      {/* Account Info */}
      <div className="content-card" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Account Info</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</div>
            <div style={{ fontWeight: 600 }}>{user?.name}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</div>
            <div style={{ fontWeight: 600 }}>{user?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</div>
            <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="content-card" style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
        <h2 style={{ marginBottom: "0.5rem", color: "#ef4444" }}>⚠️ Danger Zone</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Deleting your account is permanent. Your profile will be hidden from the platform. Active contracts and payment data will be retained for legal purposes.
        </p>
        <button className="btn btn--danger" onClick={() => setShowDeleteModal(true)}>
          Delete My Account
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Delete Account</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <form onSubmit={handleDelete} className="modal-form">
              <div className="cancel-warning">
                <p>This will permanently deactivate your account.</p>
                <p>You will be logged out immediately and cannot log back in.</p>
              </div>
              {error && <div className="alert alert--error" style={{ margin: "0 0 1rem" }}>{error}</div>}
              <div className="form-group">
                <label>Enter your password to confirm</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your current password"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--danger" disabled={loading || !password}>
                  {loading ? "Deleting..." : "Delete My Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
