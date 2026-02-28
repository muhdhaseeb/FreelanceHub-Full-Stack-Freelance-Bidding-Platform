import { useState, useEffect } from "react";
import { getStats } from "../api/admin";
import StatCard from "../components/common/StatCard";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then(r => setStats(r.data.stats)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!stats) return <div className="alert alert-error">Failed to load stats.</div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Dashboard</h1><p>Platform overview</p></div>
      </div>

      <div style={{ marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Users</div>
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Total Users"   value={stats.users.total}       color="cyan"  icon="👥" />
        <StatCard label="Clients"       value={stats.users.clients}     icon="🏢" />
        <StatCard label="Freelancers"   value={stats.users.freelancers} icon="💻" />
        <StatCard label="Banned"        value={stats.users.banned}      color="red"   icon="🚫" />
      </div>

      <div style={{ marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Jobs</div>
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Total Jobs"    value={stats.jobs.total}      color="cyan"  icon="📋" />
        <StatCard label="Open"          value={stats.jobs.open}       icon="🟢" />
        <StatCard label="In Progress"   value={stats.jobs.inProgress} color="amber" icon="🔄" />
        <StatCard label="Completed"     value={stats.jobs.completed}  color="green" icon="✅" />
      </div>

      <div style={{ marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Payments</div>
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Total Volume"  value={"$" + stats.payments.volume.toLocaleString()} color="green" icon="💰" />
        <StatCard label="Total Txns"    value={stats.payments.total}    icon="💳" />
        <StatCard label="Paid (Held)"   value={stats.payments.paid}     color="amber" icon="🔒" />
        <StatCard label="Released"      value={stats.payments.released} color="green" icon="✅" />
      </div>

      <div style={{ marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Reviews</div>
      <div className="stats-grid">
        <StatCard label="Total Reviews" value={stats.reviews.total} color="amber" icon="⭐" />
      </div>
    </div>
  );
}
