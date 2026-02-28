import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const statusBadge = (status) => {
  const map = { open: "badge-open", "in-progress": "badge-progress", completed: "badge-completed" };
  return <span className={map[status] || "badge-open"}>{status}</span>;
};

const ClientDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/jobs").then((r) => setJobs(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading your jobs...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">My Posted Jobs</h2>
        <Link to="/jobs/create" className="btn-primary">+ Post New Job</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
          <Link to="/jobs/create" className="btn-primary inline-block">Post Your First Job</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link key={job._id} to={`/jobs/${job._id}`} className="card hover:shadow-md transition-shadow block">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Budget: ${job.budgetMin} – ${job.budgetMax} · Deadline:{" "}
                    {new Date(job.deadline).toLocaleDateString()}
                  </p>
                </div>
                {statusBadge(job.status)}
              </div>
              {job.status === "in-progress" && (
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/jobs/${job._id}/chat`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    💬 Open Chat
                  </Link>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const FreelancerDashboard = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bids/my").then((r) => setBids(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading your bids...</div>;

  const accepted = bids.filter((b) => b.status === "accepted");
  const pending = bids.filter((b) => b.status === "pending");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">My Activity</h2>
        <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
      </div>

      {accepted.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Active Contracts ({accepted.length})</h3>
          <div className="grid gap-3">
            {accepted.map((bid) => (
              <div key={bid._id} className="card border-l-4 border-l-green-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{bid.jobId?.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">Your bid: ${bid.amount}</p>
                  </div>
                  <span className="badge-progress">{bid.jobId?.status}</span>
                </div>
                <div className="mt-3 flex gap-3">
                  <Link to={`/jobs/${bid.jobId?._id}`} className="text-sm text-blue-600 hover:underline">
                    View Job
                  </Link>
                  {bid.jobId?.status === "in-progress" && (
                    <Link to={`/jobs/${bid.jobId?._id}/chat`} className="text-sm text-blue-600 hover:underline">
                      💬 Chat
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Pending Bids ({pending.length})</h3>
          <div className="grid gap-3">
            {pending.map((bid) => (
              <Link key={bid._id} to={`/jobs/${bid.jobId?._id}`} className="card hover:shadow-md transition-shadow block">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{bid.jobId?.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">Your bid: ${bid.amount}</p>
                  </div>
                  <span className="badge-open">pending</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {bids.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">You haven't submitted any bids yet.</p>
          <Link to="/jobs" className="btn-primary inline-block">Find Jobs to Bid On</Link>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-gray-500 capitalize">{user.role} account</p>
      </div>
      {user.role === "client" ? <ClientDashboard /> : <FreelancerDashboard />}
    </div>
  );
};

export default Dashboard;
