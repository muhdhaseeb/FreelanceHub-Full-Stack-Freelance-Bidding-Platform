import { useState, useEffect } from "react";
import { getReviews, deleteReview } from "../api/admin";
import Pagination from "../components/common/Pagination";

const Stars = ({ n }) => "★".repeat(n) + "☆".repeat(5 - n);

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getReviews({ page, limit: 20 });
      setReviews(res.data.reviews);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [page]);

  const handleDelete = async (review) => {
    if (!window.confirm(`Delete this review by ${review.clientId?.name}? This recalculates the freelancer's rating.`)) return;
    setActionLoading(true);
    try { await deleteReview(review._id); fetch(); }
    catch (err) { alert(err.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Reviews</h1><p>{total} total reviews</p></div>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner"></div></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Job</th><th>Client</th><th>Freelancer</th><th>Rating</th><th>Comment</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r._id}>
                    <td><strong>{r.jobId?.title || "—"}</strong></td>
                    <td style={{ color: "var(--muted)" }}>{r.clientId?.name || "—"}</td>
                    <td style={{ color: "var(--muted)" }}>{r.freelancerId?.name || "—"}</td>
                    <td style={{ color: "var(--amber)", fontFamily: "monospace", letterSpacing: "0.05em" }}>
                      {Stars(r.rating)} <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>({r.rating})</span>
                    </td>
                    <td style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--muted)" }}>
                      {r.comment}
                    </td>
                    <td style={{ color: "var(--muted)" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r)} disabled={actionLoading}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reviews.length === 0 && <div className="empty"><div className="empty-icon">⭐</div><p>No reviews found</p></div>}
          </div>
        )}
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>
    </div>
  );
}
