import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/jobs/open")
      .then((r) => setJobs(r.data))
      .catch(() => setError("Failed to load jobs"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error)
    return <div className="text-center text-red-600 py-12">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Open Jobs</h1>
          <p className="text-gray-500">{jobs.length} jobs available</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No open jobs at the moment.</div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link
              key={job._id}
              to={`/jobs/${job._id}`}
              className="card hover:shadow-md transition-shadow block"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{job.description}</p>
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    <span>💰 ${job.budgetMin} – ${job.budgetMax}</span>
                    <span>📅 Due {new Date(job.deadline).toLocaleDateString()}</span>
                    <span>👤 {job.clientId?.name}</span>
                  </div>
                </div>
                <span className="badge-open ml-4 shrink-0">Open</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsList;
