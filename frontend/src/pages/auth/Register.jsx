import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "freelancer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await registerUser(form);
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (err) { setError(err.response?.data?.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img
            src="/logo192.png"
            alt="FreelanceHub"
            style={{ width: "56px", height: "56px", borderRadius: "12px", objectFit: "cover", margin: "0 auto 0.75rem", display: "block" }}
          />
          <h1>Create account</h1>
          <p>Join the platform today</p>
        </div>
        {error && <div className="alert alert--error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" required />
          </div>
          <div className="form-group">
            <label>I am a...</label>
            <div className="role-selector">
              {["client", "freelancer"].map((r) => (
                <button key={r} type="button" className={"role-option" + (form.role === r ? " role-option--active" : "")} onClick={() => setForm({ ...form, role: r })}>
                  <span className="role-icon">{r === "client" ? "🏢" : "💻"}</span>
                  <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                  <small>{r === "client" ? "Post jobs & hire" : "Find work & bid"}</small>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}