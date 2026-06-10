import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/client';

const severityClass = (s) => {
  if (!s) return 'tag tag-default';
  return `tag tag-${s}`;
};

export default function Investigations() {
  const [investigations, setInvestigations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = { page, limit: 15 };
    if (filter) params.status = filter;
    api.getInvestigations(params).then(res => {
      setInvestigations(res.data);
      setPagination(res.pagination);
    }).catch(() => {});
  }, [page, filter]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Investigasi</h1>
      </div>

      <div className="filters">
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Status</option>
          <option value="berlangsung">Berlangsung</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Tipe</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Investigasi</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {investigations.map(inv => (
              <tr key={inv.id}>
                <td>{inv.incident_type}</td>
                <td><span className={severityClass(inv.severity)}>{inv.severity || '-'}</span></td>
                <td>{inv.status === 'selesai' ? '✅ Selesai' : '⏳ Berlangsung'}</td>
                <td>{inv.type}</td>
                <td><Link to={`/investigations/${inv.id}`} className="btn btn-sm">Detail</Link></td>
              </tr>
            ))}
            {investigations.length === 0 && (
              <tr><td colSpan={5} className="empty">Belum ada investigasi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Halaman {pagination.page} dari {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
