import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/client';

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState(loadSavedColumns);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '', end_date: '', status: '', severity: '', incident_type: '', search: '',
  });
  const [ruangan, setRuangan] = useState([]);

  useEffect(() => {
    api.getRuangan().then(res => setRuangan(res.data)).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { ...filters };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    if (columns.length) params.columns = columns.join(',');

    api.getLaporan(params).then(res => {
      setData(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filters, columns]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
          <button className="btn" onClick={() => setShowColumnPicker(!showColumnPicker)}>
            ⚙ Kolom
          </button>
          <button className="btn" onClick={() => handleExport('excel')}>📥 Excel</button>
          <button className="btn" onClick={() => handleExport('pdf')}>📥 PDF</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Dari</label>
          <input type="date" value={filters.start_date}
            onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div className="filter-group">
          <label>Sampai</label>
          <input type="date" value={filters.end_date}
            onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))} />
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">Semua</option>
            <option value="dilaporkan">Dilaporkan</option>
            <option value="divalidasi">Divalidasi</option>
            <option value="investigasi">Investigasi</option>
            <option value="selesai">Selesai</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Severity</label>
          <select value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}>
            <option value="">Semua</option>
            <option value="merah">Merah</option>
            <option value="kuning">Kuning</option>
            <option value="hijau">Hijau</option>
            <option value="biru">Biru</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Tipe</label>
          <select value={filters.incident_type} onChange={e => setFilters(f => ({ ...f, incident_type: e.target.value }))}>
            <option value="">Semua</option>
            <option value="KTD">KTD</option>
            <option value="KNC">KNC</option>
            <option value="KPC">KPC</option>
            <option value="KTC">KTC</option>
            <option value="sentinel">Sentinel</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Cari</label>
          <input type="text" placeholder="Kata kunci..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        </div>
      </div>

      {/* Column Picker */}
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

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {COLUMN_OPTIONS.filter(c => columns.includes(c.key)).map(c => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {COLUMN_OPTIONS.filter(c => columns.includes(c.key)).map(c => (
                  <td key={c.key}>{row[c.label] || '-'}</td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={columns.length} className="empty">
                {loading ? 'Memuat...' : 'Tidak ada data dengan filter yang dipilih'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
        Total: {data.length} insiden
      </div>
    </div>
  );
}
