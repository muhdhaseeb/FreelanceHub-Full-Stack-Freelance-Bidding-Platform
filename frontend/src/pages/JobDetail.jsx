import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import BidModal from "../components/BidModal";

const statusBadge = (status) => {
  const map = {
    open: "badge-open",
    "in-progress": "badge-progress",
    completed: "badge-completed",
  };
  return <span className={map[status] || "badge-open"}>{status}</span>;
};

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBidModal, setShowBidModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJob = () => {
    setLoading(true);
    api
      .get(`/jobs/${id}`)
      .then((r) => {
        setJob(r.data);
        setBids(r.data.bids || []);
      })
      .catch(() => setError("Job not found"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleAcceptBid = async (bidId) => {
    if (!window.confirm("Accept this bid? Other bids will be rejected.")) return;
    setActionLoading(true);
    try {
      await api.patch(`/bids/${bidId}/accept`);
      fetchJob();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept bid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!window.confirm("Mark this job as complete?")) return;
    setActionLoading(true);
    try {
      await api.patch(`/jobs/${id}/complete`);
      fetchJob();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark complete");
    } finally {
      setActionLoading(false);
    }
  };

  const isClient = user.role === "client";
  const isFreelancer = user.role === "freelancer";
  const isJobOwner = job?.clientId?._id === user._id || job?.clientId === user._id;
  const isAssigned = job?.assignedFreelancerId?._id === user._id || job?.assignedFreelancerId === user._id;
  const myBid = bids.find((b) => b.freelancerId?._id === user._id || b.freelancerId === user._id);

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
      {showBidModal && (
        <BidModal
          job={job}
          onClose={() => setShowBidModal(false)}
          onSuccess={() => {
            setShowBidModal(false);
            fetchJob();
          }}
        />
      )}

      {/* Job Header */}
      <div className="card mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Posted by {job.clientId?.name} · {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
          {statusBadge(job.status)}
        </div>

        <p className="text-gray-700 mt-4 leading-relaxed">{job.description}</p>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Budget</p>
            <p className="font-semibold text-gray-900">
              ${job.budgetMin} – ${job.budgetMax}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Deadline</p>
            <p className="font-semibold text-gray-900">{new Date(job.deadline).toLocaleDateString()}</p>
          </div>
          {job.assignedFreelancerId && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Assigned To</p>
              <p className="font-semibold text-gray-900">
                {job.assignedFreelancerId?.name || "Assigned Freelancer"}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t">
          {/* Freelancer: submit bid if job is open and they haven't bid */}
          {isFreelancer && job.status === "open" && !myBid && (
            <button className="btn-primary" onClick={() => setShowBidModal(true)}>
              Submit a Bid
            </button>
          )}

          {isFreelancer && myBid && (
            <span className="text-sm text-gray-600 self-center">
              You've already bid ${myBid.amount} on this job
            </span>
          )}

          {/* Freelancer: mark complete */}
          {isFreelancer && isAssigned && job.status === "in-progress" && (
            <button className="btn-primary" onClick={handleMarkComplete} disabled={actionLoading}>
              Mark as Complete
            </button>
          )}

          {/* Client: approve completion */}
          {isClient && isJobOwner && job.status === "in-progress" && (
            <button className="btn-primary" onClick={handleMarkComplete} disabled={actionLoading}>
              Approve Completion
            </button>
          )}

          {/* Chat button */}
          {job.status === "in-progress" && (isAssigned || (isClient && isJobOwner)) && (
            <Link to={`/jobs/${job._id}/chat`} className="btn-secondary">
              💬 Open Chat
            </Link>
          )}
        </div>
      </div>

      {/* Bids section — only visible to job owner */}
      {isClient && isJobOwner && bids.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Bids ({bids.length})
          </h2>
          <div className="grid gap-3">
            {bids.map((bid) => (
              <div key={bid._id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {bid.freelancerId?.name}
                      </h3>
                      <span
                        className={
                          bid.status === "accepted"
                            ? "badge-progress"
                            : bid.status === "rejected"
                            ? "inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700"
                            : "badge-open"
                        }
                      >
                        {bid.status}
                      </span>
                    </div>
                    <p className="text-blue-600 font-bold text-lg mt-1">${bid.amount}</p>
                    <p className="text-gray-600 text-sm mt-2">{bid.proposal}</p>
                  </div>

                  {job.status === "open" && bid.status === "pending" && (
                    <button
                      className="btn-primary ml-4 shrink-0"
                      onClick={() => handleAcceptBid(bid._id)}
                      disabled={actionLoading}
                    >
                      Accept Bid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isClient && isJobOwner && bids.length === 0 && job.status === "open" && (
        <div className="card text-center py-8 text-gray-500">
          No bids received yet. Share your job to attract freelancers!
        </div>
      )}
    </div>
  );
};

export default JobDetail;
