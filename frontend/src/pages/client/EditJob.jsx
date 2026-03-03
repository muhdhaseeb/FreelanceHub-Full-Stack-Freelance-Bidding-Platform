import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJob, editJob } from "../../api/jobs";

const CATEGORIES = ["General", "Design", "Development", "Writing", "Marketing", "Video", "Music", "Business", "Data", "Other"];

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", budgetMin: "", budgetMax: "", deadline: "", category: "General", tags: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getJob(id).then(res => {
      const j = res.data.job;
      setForm({
        title: j.title,
        description: j.description,
        budgetMin: j.budgetMin,
        budgetMax: j.budgetMax,
        deadline: new Date(j.deadline).toISOString().split("T")[0],
        category: j.category || "General",
        tags: (j.tags || []).join(", "),
      });
    }).catch(() => setError("Failed to load job"))
    .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await editJob(id, {
        ...form,
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      });
      alert("Job updated successfully!");
      navigate(`/jobs/${id}`);
    } catch (err) { setError(err.response?.data?.message || "Failed to update job"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div className="page-header">
        <div>
          <button onClick={() => navigate(-1)} className="btn btn--ghost btn--sm" style={{ marginBottom: "0.5rem" }}>← Back</button>
          <h1>Edit Job</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Only open jobs can be edited.</p>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="content-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Job Title</label>
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required minLength={5} maxLength={100} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={6} required minLength={20} maxLength={2000} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Min Budget ($)</label>
              <input type="number" min="1" value={form.budgetMin} onChange={e => setForm({...form, budgetMin: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Max Budget ($)</label>
              <input type="number" min="1" value={form.budgetMax} onChange={e => setForm({...form, budgetMax: e.target.value})} required />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} required min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="filter-select" style={{ width: "100%" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Tags <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(comma separated)</span></label>
            <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="e.g. React, Node.js, MongoDB" />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
