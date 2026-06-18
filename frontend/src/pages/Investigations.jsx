import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/client';
import Pagination from '../components/Pagination';

const severityMeta = {
  merah: { label: 'Merah', cls: 'tag-merah' },
  kuning: { label: 'Kuning', cls: 'tag-kuning' },
  hijau: { label: 'Hijau', cls: 'tag-hijau' },
  biru: { label: 'Biru', cls: 'tag-biru' },
};

export default function Investigations() {
  const [investigations, setInvestigations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const params = { page, limit: pageSize || 99999 };
    if (filter) params.status = filter;
    api.getInvestigations(params).then(res => {
      setInvestigations(res.data);
      setPagination(res.pagination);
    }).catch(() => {});
  }, [page, filter, pageSize]);

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

      <div className="table-container incident-table-wrap">
        <table className="table incident-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>Tipe</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Investigasi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {investigations.map((inv, idx) => {
              const sv = severityMeta[inv.severity];
              return (
                <tr key={inv.id} className="incident-row" style={{ animationDelay: `${idx * 0.04}s` }}>
                  <td className="row-num">{idx + 1 + (page - 1) * (pageSize || 20)}</td>
                  <td>{inv.incident_type}</td>
                  <td>
                    {sv ? (
                      <span className={`severity-badge ${sv.cls}`}>
                        <span className="sev-dot" />
                        {sv.label}
                      </span>
                    ) : <span className="severity-badge sev-none">-</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${inv.status === 'selesai' ? 'status-selesai' : 'status-investigasi'}`}>
                      {inv.status === 'selesai' ? 'Selesai' : 'Berlangsung'}
                    </span>
                  </td>
                  <td><span className="type-badge">{inv.type}</span></td>
                  <td className="cell-actions">
                    <Link to={`/investigations/${inv.id}`} className="btn-incident-detail">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Detail
                    </Link>
                  </td>
                </tr>
              );
            })}
            {investigations.length === 0 && (
              <tr><td colSpan={6} className="empty">Belum ada investigasi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination total={pagination.total} page={pagination.page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}
    </div>
  );
}
