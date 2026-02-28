import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJob } from "../../api/jobs";

export default function CreateJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", budgetMin: "", budgetMax: "", deadline: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await createJob(form);
      navigate(`/jobs/${res.data.job._id}`);
    } catch (err) { setError(err.response?.data?.message || "Failed to create job"); }
    finally { setLoading(false); }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="page-header"><h1>Post a New Job</h1><p className="text-muted">Describe your project and set your budget</p></div>
        {error && <div className="alert alert--error">{error}</div>}
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label>Job Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build a React dashboard with charts" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the project in detail..." rows={6} required />
            <small>{form.description.length}/2000</small>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Budget Min ($)</label>
              <input type="number" min="1" value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} placeholder="100" required />
            </div>
            <div className="form-group">
              <label>Budget Max ($)</label>
              <input type="number" min="1" value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} placeholder="500" required />
            </div>
          </div>
          <div className="form-group">
            <label>Deadline</label>
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} min={new Date().toISOString().split("T")[0]} required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? "Posting..." : "Post Job"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
