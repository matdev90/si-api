import { useState, useEffect, useRef } from 'react';
import * as api from '../api/client';
import Pagination from '../components/Pagination';
import NotificationModal from '../components/NotificationModal';

export default function MasterRuangan() {
  const [ruangan, setRuangan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [notif, setNotif] = useState({ message: '', type: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debounceRef = useRef(null);

  const fetchData = () => {
    setLoading(true);
    api.getRuangan().then(res => {
      setRuangan(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filteredRuangan = ruangan.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q));
  });

  const paginatedRuangan = pageSize > 0
    ? filteredRuangan.slice((page - 1) * pageSize, page * pageSize)
    : filteredRuangan;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', description: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditId(r.id);
    setForm({ name: r.name, description: r.description || '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nama ruangan wajib diisi'); return; }
    try {
      if (editId) {
        await api.updateRuangan(editId, form);
        setNotif({ message: 'Ruangan berhasil diperbarui', type: 'success' });
      } else {
        await api.createRuangan(form);
        setNotif({ message: 'Ruangan berhasil ditambahkan', type: 'success' });
      }
      setShowModal(false);
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = (id) => {
    setDeleteTarget(id);
    setNotif({ message: 'Hapus ruangan ini?', type: 'confirm' });
  };

  const handleDeleteConfirm = async (confirmed) => {
    setNotif({ message: '', type: '' });
    if (!confirmed || !deleteTarget) return;
    try {
      await api.deleteRuangan(deleteTarget);
      setNotif({ message: 'Ruangan berhasil dihapus', type: 'success' });
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
        <h1>Master Ruangan</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Tambah Ruangan</button>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Cari Ruangan</label>
          <input type="text" placeholder="Nama ruangan..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        </div>
      </div>

      <div className="table-container incident-table-wrap">
        <table className="table incident-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>Nama</th>
              <th>Deskripsi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRuangan.map((r, idx) => (
              <tr key={r.id} className="incident-row" style={{ animationDelay: `${idx * 0.04}s` }}>
                <td className="row-num">{idx + 1 + (page - 1) * pageSize}</td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td style={{ color: '#64748b' }}>{r.description || '-'}</td>
                <td className="cell-actions">
                  <button className="btn-incident-detail" onClick={() => openEdit(r)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                  <button className="btn-incident-delete" onClick={() => handleDelete(r.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </td>
              </tr>
            ))}
            {filteredRuangan.length === 0 && (
              <tr><td colSpan={4} className="empty">{loading ? 'Memuat...' : 'Belum ada ruangan'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={filteredRuangan.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />

      <NotificationModal message={notif.message} type={notif.type} onClose={() => setNotif({ message: '', type: '' })} onConfirm={handleDeleteConfirm} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Ruangan' : 'Tambah Ruangan'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Nama *</label>
              <input type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Deskripsi</label>
              <textarea rows="3" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-actions">
              <button className="btn" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
