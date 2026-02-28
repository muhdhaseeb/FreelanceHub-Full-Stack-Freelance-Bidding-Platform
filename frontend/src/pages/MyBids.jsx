import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

const statusColor = {
  pending: "badge-open",
  accepted: "badge-progress",
  rejected: "inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700",
};

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bids/my").then((r) => setBids(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bids</h1>

      {bids.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">You haven't submitted any bids yet.</p>
          <Link to="/jobs" className="btn-primary inline-block">Browse Open Jobs</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bids.map((bid) => (
            <div key={bid._id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link
                    to={`/jobs/${bid.jobId?._id}`}
                    className="font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {bid.jobId?.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    Deadline: {bid.jobId?.deadline
                      ? new Date(bid.jobId.deadline).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <div className="mt-2">
                    <span className="text-blue-600 font-bold">${bid.amount}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      (Budget: ${bid.jobId?.budgetMin} – ${bid.jobId?.budgetMax})
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">{bid.proposal}</p>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <span className={statusColor[bid.status]}>{bid.status}</span>
                  {bid.status === "accepted" && bid.jobId?.status === "in-progress" && (
                    <Link to={`/jobs/${bid.jobId?._id}/chat`} className="text-sm text-blue-600 hover:underline">
                      💬 Chat
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBids;
