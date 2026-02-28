import React, { useState } from "react";
import api from "../utils/api";

const BidModal = ({ job, onClose, onSuccess }) => {
  const [form, setForm] = useState({ amount: "", proposal: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/bids", {
        jobId: job._id,
        amount: Number(form.amount),
        proposal: form.proposal,
      });
      onSuccess();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? errors.join(", ") : err.response?.data?.message || "Failed to submit bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Submit a Bid</h2>
          <p className="text-sm text-gray-500 mt-1">For: {job.title}</p>
          <p className="text-sm text-gray-500">Budget: ${job.budgetMin} – ${job.budgetMax}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Bid Amount ($)</label>
            <input
              type="number"
              className="input"
              placeholder={`e.g. ${job.budgetMin}`}
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proposal</label>
            <textarea
              className="input h-32 resize-none"
              placeholder="Explain why you're the best fit, your approach, and timeline..."
              value={form.proposal}
              onChange={(e) => setForm({ ...form, proposal: e.target.value })}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 20 characters</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Bid"}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BidModal;
