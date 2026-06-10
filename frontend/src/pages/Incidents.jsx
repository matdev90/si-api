import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Incidents() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = () => {
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (filter) params.status = filter;
    api.getIncidents(params).then(res => {
      setIncidents(res.data);
      setPagination(res.pagination);
    }).catch(() => {});
  };

  useEffect(() => { fetchData(); }, [page, filter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const severityClass = (s) => {
    if (!s) return 'tag tag-default';
    return `tag tag-${s}`;
  };

  const statusLabels = {
    dilaporkan: 'Dilaporkan', divalidasi: 'Divalidasi', investigasi: 'Investigasi',
    ditindaklanjuti: 'Ditindaklanjuti', selesai: 'Selesai', ditolak: 'Ditolak',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Daftar Insiden</h1>
        <Link to="/incidents/new" className="btn btn-primary">+ Lapor Baru</Link>
      </div>

      <div className="filters">
        <form onSubmit={handleSearch} className="search-form">
          <input type="text" placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn">Cari</button>
        </form>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Status</option>
          <option value="dilaporkan">Dilaporkan</option>
          <option value="divalidasi">Divalidasi</option>
          <option value="investigasi">Investigasi</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Tgl</th>
              <th>Tipe</th>
              <th>Lokasi</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Pelapor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {incidents.map(inc => (
              <tr key={inc.id}>
                <td>{inc.incident_date}</td>
                <td>{inc.incident_type}</td>
                <td>{inc.location}</td>
                <td><span className={severityClass(inc.severity)}>{inc.severity || '-'}</span></td>
                <td>{statusLabels[inc.status] || inc.status}</td>
                <td>{inc.reporter_name}</td>
                <td><Link to={`/incidents/${inc.id}`} className="btn btn-sm">Detail</Link></td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr><td colSpan={7} className="empty">Belum ada insiden</td></tr>
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
