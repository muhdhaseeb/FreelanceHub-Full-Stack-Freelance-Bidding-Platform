export default function StatCard({ label, value, color = "", icon }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{icon} {label}</div>
      <div className={"stat-value " + color}>{value ?? "—"}</div>
    </div>
  );
}
