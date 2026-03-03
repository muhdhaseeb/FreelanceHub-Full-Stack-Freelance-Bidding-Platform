import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api/admin";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await adminLogin(form);
      login(res.data.token, res.data.admin);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img
          src="/logo192.png"
          alt="FreelanceHub"
          style={{ width: "56px", height: "56px", borderRadius: "12px", objectFit: "cover", margin: "0 auto 0.75rem", display: "block" }}
        />
        <h1>Admin Panel</h1>
        <p className="auth-sub">FreelanceHub Platform Administration</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="admin@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}