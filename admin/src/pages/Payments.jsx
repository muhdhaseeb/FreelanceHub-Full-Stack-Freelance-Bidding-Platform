import { useState, useEffect } from "react";
import { getPayments } from "../api/admin";
import Pagination from "../components/common/Pagination";

const statusColor = { pending: "amber", paid: "cyan", released: "green", refunded: "red" };

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getPayments({ status, page, limit: 20 });
      setPayments(res.data.payments);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [status, page]);

  const totalVolume = payments.reduce((s, p) => s + (["paid","released"].includes(p.status) ? p.amount : 0), 0);

  return (
    <div>
      <div className="page-header">
        <div><h1>Payments</h1><p>{total} total transactions</p></div>
      </div>

      <div className="stats-grid" style={{ marginBottom: "1.25rem" }}>
        {["pending","paid","released","refunded"].map(s => (
          <div key={s} className="stat-card" style={{ cursor: "pointer", border: status === s ? "1px solid var(--cyan)" : undefined }}
            onClick={() => { setStatus(status === s ? "" : s); setPage(1); }}>
            <div className="stat-label">{s.charAt(0).toUpperCase()+s.slice(1)}</div>
            <div className={"stat-value " + (statusColor[s] || "")}>
              {payments.filter(p => p.status === s).length}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="toolbar">
          <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid (Held)</option>
            <option value="released">Released</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {loading ? <div className="loading"><div className="spinner"></div></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Job</th><th>Client</th><th>Freelancer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id}>
                    <td><strong>{p.jobId?.title || "—"}</strong></td>
                    <td style={{ color: "var(--muted)" }}>{p.clientId?.name || "—"}</td>
                    <td style={{ color: "var(--muted)" }}>{p.freelancerId?.name || "—"}</td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--green)" }}>${p.amount}</td>
                    <td><span className={"badge badge-" + p.status}>{p.status}</span></td>
                    <td style={{ color: "var(--muted)" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && <div className="empty"><div className="empty-icon">💳</div><p>No payments found</p></div>}
          </div>
        )}
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>
    </div>
  );
}
