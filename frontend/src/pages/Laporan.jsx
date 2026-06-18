import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../api/client';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

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

const COLUMN_OPTIONS = [
  { key: 'incident_date', label: 'Tanggal' },
  { key: 'incident_time', label: 'Waktu' },
  { key: 'incident_type', label: 'Tipe' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'location', label: 'Lokasi' },
  { key: 'reporter_name', label: 'Pelapor' },
  { key: 'reporter_unit', label: 'Unit' },
  { key: 'description', label: 'Kronologis' },
  { key: 'consequence', label: 'Akibat' },
  { key: 'immediate_action', label: 'Tindakan' },
];

const STORAGE_KEY = 'laporan_columns';

function loadSavedColumns() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return COLUMN_OPTIONS.map(c => c.key);
}

export default function Laporan() {
  const { user } = useAuth();
  const canViewAll = ['admin', 'manajemen', 'pmkp'].includes(user?.role);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState(loadSavedColumns);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    start_date: '', end_date: '', status: '', severity: '', incident_type: '', ruangan_id: '',
  });
  const [ruangan, setRuangan] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    api.getRuangan().then(res => setRuangan(res.data)).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { ...filters };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    if (search) params.search = search;
    if (columns.length) params.columns = columns.join(',');

    api.getLaporan(params).then(res => {
      setData(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filters, columns, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const paginatedData = pageSize > 0
    ? data.slice((page - 1) * pageSize, page * pageSize)
    : data;

  const toggleColumn = (key) => {
    setColumns(prev => {
      const next = prev.includes(key)
        ? prev.filter(c => c !== key)
        : [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleExport = async (format) => {
    const params = { ...filters };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    if (search) params.search = search;
    if (columns.length) params.columns = columns.join(',');

    try {
      const fn = format === 'excel' ? api.exportLaporanExcel : api.exportLaporanPDF;
      const res = await fn(params);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_insiden_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mengexport: ' + err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Laporan Insiden</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setShowColumnPicker(!showColumnPicker)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            Kolom
          </button>
          <button className="btn btn-export-excel" onClick={() => handleExport('excel')}>📥 Excel</button>
          <button className="btn btn-export-pdf" onClick={() => handleExport('pdf')}>📥 PDF</button>
        </div>
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
            onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div className="filter-group">
          <label>Sampai Tgl</label>
          <input type="date" value={filters.end_date}
            onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))} />
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">Semua Status</option>
            {Object.entries(statusMeta).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Severity</label>
          <select value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}>
            <option value="">Semua Severity</option>
            <option value="merah">Merah</option>
            <option value="kuning">Kuning</option>
            <option value="hijau">Hijau</option>
            <option value="biru">Biru</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Jenis</label>
          <select value={filters.incident_type} onChange={e => setFilters(f => ({ ...f, incident_type: e.target.value }))}>
            <option value="">Semua Jenis</option>
            {Object.entries(typeMeta).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {showColumnPicker && (
        <div className="column-picker">
          {COLUMN_OPTIONS.map(c => (
            <label key={c.key} className="column-pick-item">
              <input type="checkbox" checked={columns.includes(c.key)}
                onChange={() => toggleColumn(c.key)} />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      )}

      <div className="table-container incident-table-wrap">
        <table className="table incident-table">
          <thead>
            <tr>
              <th>NO</th>
              {COLUMN_OPTIONS.filter(c => columns.includes(c.key)).map(c => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => {
              const sv = severityMeta[row['Severity']];
              const st = statusMeta[row['Status']];
              const tp = typeMeta[row['Tipe']];
              return (
                <tr key={i} className="incident-row" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="row-num">{i + 1 + (page - 1) * pageSize}</td>
                  {COLUMN_OPTIONS.filter(c => columns.includes(c.key)).map(c => {
                    const raw = row[c.label];
                    let content;
                    if (c.key === 'severity') {
                      content = sv ? (
                        <span className={`severity-badge ${sv.cls}`}>
                          <span className="sev-dot" />
                          {sv.label}
                        </span>
                      ) : <span className="severity-badge sev-none">-</span>;
                    } else if (c.key === 'status') {
                      content = st ? (
                        <span className={`status-badge ${st.cls}`}>{st.label}</span>
                      ) : <span className="status-badge">-</span>;
                    } else if (c.key === 'incident_type') {
                      content = tp ? (
                        <span className={`type-badge ${tp.cls}`}>{tp.label}</span>
                      ) : raw;
                    } else {
                      content = raw || '-';
                    }
                    return <td key={c.key}>{content}</td>;
                  })}
                  <td className="cell-actions">
                    {row._id && (
                      <a href={`/incidents/${row._id}`} className="btn-incident-detail">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Detail
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
              {data.length === 0 && (
              <tr><td colSpan={columns.length + 2} className="empty">
                {loading ? 'Memuat...' : 'Tidak ada data dengan filter yang dipilih'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={data.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}
