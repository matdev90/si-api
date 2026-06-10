import { useState, useEffect } from 'react';
import * as api from '../api/client';

export default function MasterRuangan() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.getRuangan().then(res => {
      setItems(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', description: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setForm({ name: item.name, description: item.description || '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nama ruangan wajib diisi'); return; }
    try {
      if (editId) {
        await api.updateRuangan(editId, form);
      } else {
        await api.createRuangan(form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus ruangan ini?')) return;
    try {
      await api.deleteRuangan(id);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Master Ruangan</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Tambah Ruangan</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Deskripsi</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.description || '-'}</td>
                <td>{item.is_active ? '✅ Aktif' : '❌ Nonaktif'}</td>
                <td>
                  <button className="btn btn-sm" onClick={() => openEdit(item)}>Edit</button>
                  <button className="btn btn-sm" style={{ marginLeft: 4, color: '#EF4444' }} onClick={() => handleDelete(item.id)}>Hapus</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="empty">{loading ? 'Memuat...' : 'Belum ada ruangan'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Ruangan' : 'Tambah Ruangan'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Nama Ruangan *</label>
              <input type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="ex: IGD, Rawat Inap, Poli Umum" />
            </div>
            <div className="form-group">
              <label>Deskripsi</label>
              <textarea rows="3" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Keterangan tambahan" />
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
