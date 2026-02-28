import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getJobs } from "../../api/jobs";
import { getMyBids } from "../../api/bids";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ jobs: [], bids: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.role === "client") {
          const res = await getJobs();
          setStats({ jobs: res.data.jobs, bids: [] });
        } else {
          const [jobsRes, bidsRes] = await Promise.all([getJobs(), getMyBids()]);
          setStats({ jobs: jobsRes.data.jobs.slice(0, 5), bids: bidsRes.data.bids });
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user.role]);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  const clientStats = [
    { label: "Total Jobs", value: stats.jobs.length, icon: "📋" },
    { label: "Open", value: stats.jobs.filter(j => j.status === "open").length, icon: "🟢" },
    { label: "In Progress", value: stats.jobs.filter(j => j.status === "in-progress").length, icon: "🔄" },
    { label: "Completed", value: stats.jobs.filter(j => j.status === "completed").length, icon: "✅" },
  ];

  const freelancerStats = [
    { label: "Open Jobs", value: stats.jobs.length, icon: "🔍" },
    { label: "My Bids", value: stats.bids.length, icon: "📤" },
    { label: "Pending", value: stats.bids.filter(b => b.status === "pending").length, icon: "⏳" },
    { label: "Accepted", value: stats.bids.filter(b => b.status === "accepted").length, icon: "🎉" },
  ];

  const displayStats = user.role === "client" ? clientStats : freelancerStats;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user.name} 👋</h1>
          <p className="text-muted">Here is what is happening on your account</p>
        </div>
        {user.role === "client" && <Link to="/jobs/create" className="btn btn--primary">+ Post New Job</Link>}
        {user.role === "freelancer" && <Link to={`/profile/${user._id}`} className="btn btn--ghost">Edit Profile</Link>}
      </div>

      <div className="stats-grid">
        {displayStats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-info">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {user.role === "client" && (
        <div className="dashboard-section">
          <div className="section-header"><h2>Recent Jobs</h2><Link to="/jobs">View all</Link></div>
          <div className="jobs-list">
            {stats.jobs.slice(0, 5).map((job) => (
              <Link to={`/jobs/${job._id}`} key={job._id} className="job-card job-card--compact">
                <div className="job-card-left"><h3>{job.title}</h3><p className="text-muted">${job.budgetMin} - ${job.budgetMax}</p></div>
                <span className={"status-badge status-badge--" + job.status}>{job.status}</span>
              </Link>
            ))}
            {stats.jobs.length === 0 && <div className="empty-state"><p>No jobs yet. <Link to="/jobs/create">Post your first job</Link></p></div>}
          </div>
        </div>
      )}

      {user.role === "freelancer" && (
        <div className="dashboard-section">
          <div className="section-header"><h2>My Recent Bids</h2><Link to="/my-bids">View all</Link></div>
          <div className="jobs-list">
            {stats.bids.slice(0, 5).map((bid) => (
              <Link to={`/jobs/${bid.jobId?._id}`} key={bid._id} className="job-card job-card--compact">
                <div className="job-card-left"><h3>{bid.jobId?.title || "Job"}</h3><p className="text-muted">Your bid: ${bid.amount}</p></div>
                <span className={"status-badge status-badge--" + bid.status}>{bid.status}</span>
              </Link>
            ))}
            {stats.bids.length === 0 && <div className="empty-state"><p>No bids yet. <Link to="/jobs">Browse open jobs</Link></p></div>}
          </div>
        </div>
      )}
    </div>
  );
}
