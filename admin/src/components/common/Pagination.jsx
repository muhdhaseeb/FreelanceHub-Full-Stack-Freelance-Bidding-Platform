export default function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <span>Page {page} of {pages}</span>
      <button className="btn btn-ghost btn-sm" disabled={page === pages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}
