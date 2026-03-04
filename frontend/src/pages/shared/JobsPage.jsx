import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getJobs } from "../../api/jobs";
import { useAuth } from "../../context/AuthContext";

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("open");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Search & filter state
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError("");
      try {
        const params = { page, limit: 10, sort };
        // Always send status — backend handles 'all' by returning everything
        params.status = filter;
        if (search) params.search = search;
        if (budgetMin) params.budgetMin = Number(budgetMin);
        if (budgetMax) params.budgetMax = Number(budgetMax);
        const res = await getJobs(params);
        setJobs(res.data.jobs);
        setPagination({ total: res.data.total, pages: res.data.pages });
      } catch (err) { setError("Failed to load jobs"); }
      finally { setLoading(false); }
    };
    fetchJobs();
  }, [filter, page, search, budgetMin, budgetMax, sort]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };
  const clearFilters = () => {
    setSearch(""); setSearchInput(""); setBudgetMin(""); setBudgetMax("");
    setSort("newest"); setFilter("open"); setPage(1);
  };

  // Status tabs — clients see all their job statuses; freelancers browse open jobs by default
  const statusTabs = user.role === "client"
    ? ["all", "open", "in-progress", "completed", "cancelled"]
    : ["open", "in-progress", "completed"];

  return (
    <div className="jobs-page">
      <div className="page-header">
        <div>
          <h1>{user.role === "client" ? "My Jobs" : "Browse Jobs"}</h1>
          <p className="text-muted">{pagination.total ?? 0} jobs found</p>
        </div>
        {user.role === "client" && <Link to="/jobs/create" className="btn btn--primary">+ Post Job</Link>}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search jobs by title or description..."
          className="search-input"
        />
        <button type="submit" className="btn btn--primary">Search</button>
        <button type="button" className="btn btn--ghost" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? "Hide Filters" : "Filters"} ⚙️
        </button>
      </form>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-row">
            <div className="form-group">
              <label>Min Budget ($)</label>
              <input
                type="number" min="0" value={budgetMin}
                onChange={(e) => { setBudgetMin(e.target.value); setPage(1); }}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Max Budget ($)</label>
              <input
                type="number" min="0" value={budgetMax}
                onChange={(e) => { setBudgetMax(e.target.value); setPage(1); }}
                placeholder="Any"
              />
            </div>
            <div className="form-group">
              <label>Sort By</label>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="budget_low">Budget: Low to High</option>
                <option value="budget_high">Budget: High to Low</option>
              </select>
            </div>
            <button
              type="button" onClick={clearFilters}
              className="btn btn--ghost btn--sm"
              style={{ alignSelf: "flex-end", marginBottom: "1.25rem" }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Active filter tags */}
      {(search || budgetMin || budgetMax) && (
        <div className="active-filters">
          {search    && <span className="filter-tag">Search: "{search}" <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>×</button></span>}
          {budgetMin && <span className="filter-tag">Min: ${budgetMin} <button onClick={() => { setBudgetMin(""); setPage(1); }}>×</button></span>}
          {budgetMax && <span className="filter-tag">Max: ${budgetMax} <button onClick={() => { setBudgetMax(""); setPage(1); }}>×</button></span>}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="filter-bar">
        {statusTabs.map((s) => (
          <button
            key={s}
            className={"filter-btn" + (filter === s ? " filter-btn--active" : "")}
            onClick={() => { setFilter(s); setPage(1); }}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
          </button>
        ))}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {loading ? <div className="loading"><div className="spinner"></div></div> : (
        <>
          <div className="jobs-grid">
            {jobs.map((job) => (
              <Link to={`/jobs/${job._id}`} key={job._id} className="job-card">
                <div className="job-card-header">
                  <h3>{job.title}</h3>
                  <span className={"status-badge status-badge--" + job.status}>{job.status}</span>
                </div>
                <p className="job-description">{job.description.substring(0, 120)}...</p>
                <div className="job-card-footer">
                  <div className="job-budget">
                    <span className="budget-label">Budget</span>
                    <span className="budget-value">${job.budgetMin} – ${job.budgetMax}</span>
                  </div>
                  <div className="job-deadline">
                    <span className="deadline-label">Deadline </span>
                    <span>{new Date(job.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="job-client"><span>by {job.clientId?.name}</span></div>
                </div>
              </Link>
            ))}
          </div>

          {jobs.length === 0 && (
            <div className="empty-state-large">
              <div className="empty-icon">📭</div>
              <h3>No jobs found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn--ghost">← Prev</button>
              <span>Page {page} of {pagination.pages}</span>
              <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className="btn btn--ghost">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
