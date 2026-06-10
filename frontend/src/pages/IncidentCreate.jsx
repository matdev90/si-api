import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/client';

export default function IncidentCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    incident_type: 'KTD', incident_date: '', incident_time: '',
    location: '', description: '', consequence: '',
    immediate_action: '', is_anonymous: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.createIncident(form);
      navigate(`/incidents/${res.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Laporan Insiden Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="card form">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label>Jenis Insiden *</label>
            <select name="incident_type" value={form.incident_type} onChange={handleChange}>
              <option value="KTD">KTD - Kejadian Tidak Diharapkan</option>
              <option value="KNC">KNC - Kejadian Nyaris Cedera</option>
              <option value="KPC">KPC - Kejadian Potensial Cedera</option>
              <option value="KTC">KTC - Kejadian Tidak Cedera</option>
              <option value="sentinel">Sentinel</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tanggal *</label>
            <input type="date" name="incident_date" value={form.incident_date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Waktu *</label>
            <input type="time" name="incident_time" value={form.incident_time} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Lokasi *</label>
          <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="Contoh: IGD, Rawat Inap, Farmasi" required />
        </div>

        <div className="form-group">
          <label>Kronologis Kejadian *</label>
          <textarea name="description" rows="4" value={form.description} onChange={handleChange} placeholder="Jelaskan kronologis kejadian secara detail" required />
        </div>

        <div className="form-group">
          <label>Akibat / Dampak *</label>
          <textarea name="consequence" rows="3" value={form.consequence} onChange={handleChange} placeholder="Jelaskan akibat yang ditimbulkan" required />
        </div>

        <div className="form-group">
          <label>Tindakan Segera</label>
          <textarea name="immediate_action" rows="3" value={form.immediate_action} onChange={handleChange} placeholder="Tindakan yang sudah dilakukan" />
        </div>

        <div className="form-group checkbox">
          <label>
            <input type="checkbox" name="is_anonymous" checked={form.is_anonymous} onChange={handleChange} />
            Lapor secara anonim (identitas tidak ditampilkan)
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn" onClick={() => navigate('/incidents')}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Kirim Laporan'}
          </button>
        </div>
      </form>
    </div>
  );
}
