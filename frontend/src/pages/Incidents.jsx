import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import NotificationModal from '../components/NotificationModal';

const severityMeta = {
  merah: { label: 'Merah', cls: 'tag-merah' },
  kuning: { label: 'Kuning', cls: 'tag-kuning' },
  hijau: { label: 'Hijau', cls: 'tag-hijau' },
  biru: { label: 'Biru', cls: 'tag-biru' },
};

const statusMeta = {
  dilaporkan: { label: 'Dilaporkan', cls: 'status-dilaporkan' },
  divalidasi: { label: 'Divalidasi', cls: 'status-divalidasi' },
  investigasi: { label: 'Investigasi', cls: 'status-investigasi' },
  ditindaklanjuti: { label: 'Ditindaklanjuti', cls: 'status-ditindaklanjuti' },
  selesai: { label: 'Selesai', cls: 'status-selesai' },
  ditolak: { label: 'Ditolak', cls: 'status-ditolak' },
};

const typeMeta = {
  KTD: { label: 'KTD', cls: 'type-ktd' },
  KNC: { label: 'KNC', cls: 'type-knc' },
  KPC: { label: 'KPC', cls: 'type-kpc' },
  KTC: { label: 'KTC', cls: 'type-ktc' },
  sentinel: { label: 'Sentinel', cls: 'type-sentinel' },
};

export default function Incidents() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [ruangan, setRuangan] = useState([]);
  const [filters, setFilters] = useState({
    ruangan_id: '', start_date: '', end_date: '', status: '', severity: '', incident_type: '',
  });
  const [search, setSearch] = useState('');
  const [notif, setNotif] = useState({ message: '', type: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    api.getRuangan().then(res => setRuangan(res.data)).catch(() => {});
  }, []);

  const fetchData = () => {
    const params = { page, limit: pageSize || 99999, ...filters };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    if (search) params.search = search;
    api.getIncidents(params).then(res => {
      setIncidents(res.data);
      setPagination(res.pagination);
    }).catch(() => {});
  };

  useEffect(() => { fetchData(); }, [page, pageSize, filters]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const canViewAll = ['admin', 'manajemen', 'pmkp'].includes(user?.role);
  const isAdmin = user?.role === 'admin';

  const handleDelete = (id) => {
    setDeleteTarget(id);
    setNotif({ message: 'Hapus insiden ini?', type: 'confirm' });
  };

  const handleDeleteConfirm = async (confirmed) => {
    setNotif({ message: '', type: '' });
    if (!confirmed || !deleteTarget) return;
    try {
      await api.deleteIncident(deleteTarget);
      setNotif({ message: 'Insiden berhasil dihapus', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setNotif({ message: err.message, type: 'error' });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Semua Insiden</h1>
        {['pelapor', 'manajemen', 'pmkp'].includes(user?.role) && <Link to="/incidents/new" className="btn btn-primary">+ Lapor Baru</Link>}
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Cari</label>
          <input type="text" placeholder="Kata kunci..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ minWidth: 160 }} />
        </div>
        {canViewAll && (
          <div className="filter-group">
            <label>Ruangan</label>
            <select value={filters.ruangan_id} onChange={e => { setFilters(f => ({ ...f, ruangan_id: e.target.value, location: '' })); setPage(1); }}>
              <option value="">Semua Ruangan</option>
              {ruangan.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="filter-group">
          <label>Dari Tgl</label>
          <input type="date" value={filters.start_date}
            onChange={e => { setFilters(f => ({ ...f, start_date: e.target.value })); setPage(1); }} />
        </div>
        <div className="filter-group">
          <label>Sampai Tgl</label>
          <input type="date" value={filters.end_date}
            onChange={e => { setFilters(f => ({ ...f, end_date: e.target.value })); setPage(1); }} />
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
            <option value="">Semua Status</option>
            {Object.entries(statusMeta).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Severity</label>
          <select value={filters.severity} onChange={e => { setFilters(f => ({ ...f, severity: e.target.value })); setPage(1); }}>
            <option value="">Semua Severity</option>
            <option value="merah">Merah</option>
            <option value="kuning">Kuning</option>
            <option value="hijau">Hijau</option>
            <option value="biru">Biru</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Jenis</label>
          <select value={filters.incident_type} onChange={e => { setFilters(f => ({ ...f, incident_type: e.target.value })); setPage(1); }}>
            <option value="">Semua Jenis</option>
            {Object.entries(typeMeta).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container incident-table-wrap">
        <table className="table incident-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>Tgl</th>
              <th>Tipe</th>
              <th>Lokasi</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Pelapor</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc, idx) => {
              const sv = severityMeta[inc.severity];
              const st = statusMeta[inc.status];
              const tp = typeMeta[inc.incident_type];
              return (
                <tr key={inc.id} className="incident-row" style={{ animationDelay: `${idx * 0.04}s` }}>
                  <td className="row-num">{(page - 1) * (pageSize || 20) + idx + 1}</td>
                  <td className="cell-date">{inc.incident_date}</td>
                  <td><span className={`type-badge ${tp?.cls || ''}`}>{tp?.label || inc.incident_type}</span></td>
                  <td className="cell-loc">{inc.current_location || inc.location}</td>
                  <td>
                    {sv ? (
                      <span className={`severity-badge ${sv.cls}`}>
                        <span className="sev-dot" />
                        {sv.label}
                      </span>
                    ) : <span className="severity-badge sev-none">-</span>}
                  </td>
                  <td>
                    {st ? (
                      <span className={`status-badge ${st.cls}`}>{st.label}</span>
                    ) : <span className="status-badge">-</span>}
                  </td>
                  <td className="cell-reporter">{inc.reporter_name}</td>
                  <td className="cell-actions">
                    <Link to={`/incidents/${inc.id}`} className="btn-incident-detail">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Detail
                    </Link>
                    {isAdmin && (
                      <button className="btn-incident-delete" onClick={() => handleDelete(inc.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {incidents.length === 0 && (
              <tr><td colSpan={8} className="empty">Belum ada insiden</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination total={pagination.total} page={pagination.page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <NotificationModal message={notif.message} type={notif.type} onClose={() => setNotif({ message: '', type: '' })} onConfirm={handleDeleteConfirm} />
    </div>
  );
}
