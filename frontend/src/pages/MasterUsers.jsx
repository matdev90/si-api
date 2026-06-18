import { useState, useEffect, useRef } from 'react';
import * as api from '../api/client';
import Pagination from '../components/Pagination';
import NotificationModal from '../components/NotificationModal';

const roleLabels = {
  pelapor: 'Pelapor', validator: 'Validator', pmkp: 'PMKP',
  kepala_unit: 'Kepala Unit', manajemen: 'Manajemen', admin: 'Admin',
};

const roleColors = {
  pelapor: '#2563EB', validator: '#7C3AED', pmkp: '#DC2626',
  kepala_unit: '#D97706', manajemen: '#059669', admin: '#1E293B',
};

export default function MasterUsers() {
  const [users, setUsers] = useState([]);
  const [ruangan, setRuangan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'pelapor', unit: '', ruangan_id: '' });
  const [error, setError] = useState('');
  const [notif, setNotif] = useState({ message: '', type: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debounceRef = useRef(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.getUsers(),
      api.getRuangan(),
    ]).then(([uRes, rRes]) => {
      setUsers(uRes.data);
      setRuangan(rRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.username.toLowerCase().includes(q)
      || u.name.toLowerCase().includes(q)
      || (u.current_unit && u.current_unit.toLowerCase().includes(q))
      || (roleLabels[u.role] && roleLabels[u.role].toLowerCase().includes(q));
  });

  const paginatedUsers = pageSize > 0
    ? filteredUsers.slice((page - 1) * pageSize, page * pageSize)
    : filteredUsers;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const openCreate = () => {
    setEditId(null);
    setForm({ username: '', password: '', name: '', role: 'pelapor', unit: '', ruangan_id: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditId(user.id);
    const room = ruangan.find(r => r.id === user.ruangan_id);
    setForm({
      username: user.username, password: '', name: user.name,
      role: user.role, unit: room ? room.name : user.unit,
      ruangan_id: user.ruangan_id || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleRuanganChange = (e) => {
    const id = e.target.value;
    const room = ruangan.find(r => r.id === id);
    setForm(f => ({ ...f, ruangan_id: id, unit: room ? room.name : '' }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) { setError('Nama dan username wajib diisi'); return; }
    if (!editId && !form.password) { setError('Password wajib diisi untuk user baru'); return; }
    try {
      const data = {
        ...form,
        ruangan_id: form.ruangan_id || undefined,
      };
      if (!data.password) delete data.password;
      if (!data.ruangan_id) delete data.ruangan_id;
      if (editId) {
        await api.updateUser(editId, data);
        setNotif({ message: 'Pengguna berhasil diperbarui', type: 'success' });
      } else {
        await api.createUser(data);
        setNotif({ message: 'Pengguna berhasil ditambahkan', type: 'success' });
      }
      setShowModal(false);
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    setDeleteTarget(id);
    setNotif({ message: 'Hapus pengguna ini?', type: 'confirm' });
  };

  const handleDeleteConfirm = async (confirmed) => {
    setNotif({ message: '', type: '' });
    if (!confirmed || !deleteTarget) return;
    try {
      await api.deleteUser(deleteTarget);
      setNotif({ message: 'Pengguna berhasil dihapus', type: 'success' });
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
        <h1>Master Pengguna</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Tambah Pengguna</button>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Cari Pengguna</label>
          <input type="text" placeholder="Username, nama, unit..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        </div>
      </div>

      <div className="table-container incident-table-wrap">
        <table className="table incident-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>Username</th>
              <th>Nama</th>
              <th>Role</th>
              <th>Unit / Ruangan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((u, idx) => (
              <tr key={u.id} className="incident-row" style={{ animationDelay: `${idx * 0.03}s` }}>
                <td className="row-num">{idx + 1 + (page - 1) * pageSize}</td>
                <td style={{ fontWeight: 600 }}>{u.username}</td>
                <td>{u.name}</td>
                <td>
                  <span className="type-badge" style={{
                    background: `${roleColors[u.role] || '#6b7280'}18`,
                    color: roleColors[u.role] || '#6b7280',
                  }}>{roleLabels[u.role] || u.role}</span>
                </td>
                <td style={{ color: '#475569' }}>{u.current_unit || u.unit}</td>
                <td>
                  <span className={`status-badge ${u.is_active ? 'status-selesai' : 'status-ditolak'}`}>
                    {u.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="cell-actions">
                  <button className="btn-incident-detail" onClick={() => openEdit(u)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                  <button className="btn-incident-delete" onClick={() => handleDelete(u.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={7} className="empty">{loading ? 'Memuat...' : 'Belum ada pengguna'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={filteredUsers.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />

      <NotificationModal message={notif.message} type={notif.type} onClose={() => setNotif({ message: '', type: '' })} onConfirm={handleDeleteConfirm} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Pengguna' : 'Tambah Pengguna'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Username *</label>
              <input type="text" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Nama Lengkap *</label>
              <input type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Password {editId ? '(kosongkan jika tidak diubah)' : '*'}</label>
              <input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Unit / Ruangan</label>
              <select value={form.ruangan_id} onChange={handleRuanganChange}>
                <option value="">Pilih Ruangan</option>
                {ruangan.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
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
