import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../../api/axios";

export default function ResetPassword() {
  const [searchParams]        = useSearchParams();
  const token                 = searchParams.get("token");
  const navigate              = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6)  return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      alert("Password updated! Please log in with your new password.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally { setLoading(false); }
  };

  if (!token) return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Invalid Link</h1>
        <p style={{ color: "var(--text-muted)", margin: "0.75rem 0" }}>This reset link is missing or invalid.</p>
        <Link to="/forgot-password" className="btn btn--primary" style={{ display: "block", textAlign: "center" }}>Request New Link</Link>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 1.5rem", fontSize: "0.875rem" }}>Choose a new password for your account.</p>
        {error && <div className="alert alert--error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required />
          </div>
          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
