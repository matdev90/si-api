const PAGE_SIZES = [10, 20, 30, 40, 50];

export default function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = pageSize === 0 ? 1 : Math.ceil(total / pageSize);
  if (total === 0) return null;

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        {pageSize > 0 ? (
          <>Menampilkan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} dari {total}</>
        ) : (
          <>Menampilkan semua ({total})</>
        )}
      </div>
      <div className="pagination-controls">
        <select
          value={pageSize}
          onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
          className="pagination-select"
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          <option value={0}>Semua</option>
        </select>
        {pageSize > 0 && (
          <div className="pagination-nav">
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="pagination-dots">…</span>}
                  <button
                    className={`btn btn-sm ${p === page ? 'btn-primary' : ''}`}
                    onClick={() => onPageChange(p)}
                  >{p}</button>
                </span>
              ))}
            <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
