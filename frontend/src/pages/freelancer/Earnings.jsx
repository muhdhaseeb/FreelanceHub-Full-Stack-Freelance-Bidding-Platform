
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getEarnings } from "../../api/earnings";

const RANGES = [
  { label: "7 days",  value: 7  },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

const StatCard = ({ label, value, sub, color }) => (
  <div className="content-card" style={{ borderTop: `3px solid ${color}`, textAlign: "center" }}>
    <div style={{ fontSize: "1.75rem", fontWeight: 700, color }}>{value}</div>
    <div style={{ fontWeight: 600, marginTop: "0.25rem" }}>{label}</div>
    {sub && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{sub}</div>}
  </div>
);

export default function Earnings() {
  const [data, setData]       = useState(null);
  const [days, setDays]       = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    getEarnings(days)
      .then(res => setData(res.data))
      .catch(() => setError("Failed to load earnings"))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>💰 My Earnings</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Track your income and completed work</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={"btn " + (days === r.value ? "btn--primary" : "btn--ghost")}
              style={{ fontSize: "0.8rem" }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : data && (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            <StatCard label="Total Earned" value={`$${data.summary.totalEarned.toLocaleString()}`} sub="All time" color="#10b981" />
            <StatCard label="In Escrow" value={`$${data.summary.pendingAmount.toLocaleString()}`} sub="Awaiting release" color="#38bdf8" />
            <StatCard label="Jobs Completed" value={data.summary.jobsCompleted} sub="All time" color="#a78bfa" />
          </div>

          {/* Earnings Chart */}
          <div className="content-card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Earnings Over Time</h2>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                ${data.summary.periodEarned.toLocaleString()} in last {days} days
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={v => "$" + v} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }}
                  formatter={v => ["$" + v, "Earned"]}
                />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Payments */}
          <div className="content-card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Recent Payments</h2>
            {data.recentPayments.length === 0 ? (
              <div className="empty-state"><p>No payments received yet.</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {data.recentPayments.map(p => (
                  <div key={p._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "var(--surface)", borderRadius: "8px" }}>
                    <div>
                      <Link to={`/jobs/${p.jobId}`} style={{ fontWeight: 600, color: "var(--text)" }}>{p.jobTitle}</Link>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: "#10b981", fontSize: "1.1rem" }}>${p.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
