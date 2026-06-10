import { useState, useEffect } from 'react';
import * as api from '../api/client';

const roleLabels = {
  pelapor: 'Pelapor', validator: 'Validator', pmkp: 'PMKP',
  kepala_unit: 'Kepala Unit', manajemen: 'Manajemen', admin: 'Admin',
};

export default function MasterUsers() {
  const [users, setUsers] = useState([]);
  const [ruangan, setRuangan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'pelapor', unit: '' });
  const [error, setError] = useState('');

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

  const openCreate = () => {
    setEditId(null);
    setForm({ username: '', password: '', name: '', role: 'pelapor', unit: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditId(user.id);
    setForm({ username: user.username, password: '', name: user.name, role: user.role, unit: user.unit });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) { setError('Nama dan username wajib diisi'); return; }
    if (!editId && !form.password) { setError('Password wajib diisi untuk user baru'); return; }
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editId) {
        await api.updateUser(editId, data);
      } else {
        await api.createUser(data);
      }
      setShowModal(false);
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await api.deleteUser(id);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Master Pengguna</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Tambah Pengguna</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Nama</th>
              <th>Role</th>
              <th>Unit / Ruangan</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.name}</td>
                <td><span className="tag tag-blue">{roleLabels[u.role] || u.role}</span></td>
                <td>{u.unit}</td>
                <td>{u.is_active ? '✅ Aktif' : '❌ Nonaktif'}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => openEdit(u)}>Edit</button>
                  <button className="btn btn-sm" style={{ marginLeft: 4, color: '#EF4444' }} onClick={() => handleDelete(u.id)}>Hapus</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="empty">{loading ? 'Memuat...' : 'Belum ada pengguna'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

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
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                <option value="">Pilih Ruangan</option>
                {ruangan.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
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
