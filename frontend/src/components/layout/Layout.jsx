import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../common/NotificationBell";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="app-shell">
      <nav className="navbar">
        <Link to="/dashboard" className="nav-brand">
          <img
            src="/logo192.png"
            alt="FreelanceHub"
            style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover" }}
          />
          <span>FreelanceHub</span>
        </Link>
        <div className="nav-links">
          <Link to="/jobs">Browse Jobs</Link>
          {user?.role === "client" && <Link to="/jobs/create">Post Job</Link>}
          {user?.role === "freelancer" && <Link to="/my-bids">My Bids</Link>}
          {user?.role === "freelancer" && <Link to="/earnings">Earnings</Link>}
          <Link to="/dashboard">Dashboard</Link>
        </div>
        <div className="nav-user">
          <NotificationBell />
          <Link to={`/profile/${user?._id}`} className="nav-avatar">
            {user?.profilePicture
              ? <img src={user.profilePicture} alt={user.name} className="avatar-img" />
              : <div className="avatar-placeholder">{user?.name?.[0]?.toUpperCase()}</div>
            }
          </Link>
          <Link to="/settings" className="btn btn--ghost btn--sm">Settings</Link>
          <span className={"role-badge role-badge--" + user?.role}>{user?.role}</span>
          <button onClick={handleLogout} className="btn btn--ghost btn--sm">Logout</button>
        </div>
      </nav>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}