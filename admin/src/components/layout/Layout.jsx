import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/",         icon: "📊", label: "Dashboard" },
  { to: "/users",    icon: "👥", label: "Users" },
  { to: "/jobs",     icon: "📋", label: "Jobs" },
  { to: "/payments", icon: "💳", label: "Payments" },
  { to: "/reviews",  icon: "⭐", label: "Reviews" },
  { to: "/analytics",icon: "📈", label: "Analytics" },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img
            src="/logo192.png"
            alt="FreelanceHub"
            style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
          />
          <div>
            <div className="brand-text">FreelanceHub</div>
            <div className="brand-sub">Admin</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
            Signed in as<br />
            <strong style={{ color: "var(--text)" }}>{admin?.name}</strong>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">Admin Dashboard</span>
          <span className="topbar-admin">{admin?.email}</span>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
