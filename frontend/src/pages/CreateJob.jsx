import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const CreateJob = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation for UX only — backend re-validates everything
    if (Number(form.budgetMax) < Number(form.budgetMin)) {
      return setError("Maximum budget must be greater than minimum budget");
    }

    setLoading(true);
    try {
      const res = await api.post("/jobs", {
        ...form,
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
      });
      navigate(`/jobs/${res.data._id}`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? errors.join(", ") : err.response?.data?.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Job</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Build a React E-Commerce Website"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="input h-32 resize-none"
            placeholder="Describe the project in detail..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget ($)</label>
            <input
              type="number"
              className="input"
              min="1"
              value={form.budgetMin}
              onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget ($)</label>
            <input
              type="number"
              className="input"
              min="1"
              value={form.budgetMax}
              onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
          <input
            type="date"
            className="input"
            min={new Date().toISOString().split("T")[0]}
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Posting..." : "Post Job"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateJob;
