import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  if (sent) return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "2.5rem" }}>📬</span>
          <h1 style={{ marginTop: "0.75rem" }}>Check your inbox</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
            If that email is registered, a reset link has been sent. Check your spam folder too.
          </p>
        </div>
        <Link to="/login" className="btn btn--primary" style={{ display: "block", textAlign: "center" }}>Back to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot Password</h1>
        <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 1.5rem", fontSize: "0.875rem" }}>
          Enter your email and we will send you a reset link.
        </p>
        {error && <div className="alert alert--error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
