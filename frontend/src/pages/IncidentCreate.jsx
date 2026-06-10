import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/client';

export default function IncidentCreate() {
  const navigate = useNavigate();
  const [ruanganList, setRuanganList] = useState([]);
  const [form, setForm] = useState({
    incident_type: 'KTD', incident_date: '', incident_time: '',
    location: '', description: '', consequence: '',
    immediate_action: '', is_anonymous: false,
    no_rm: '', umur: '', jenis_kelamin: '', penanggung_biaya: '',
    tgl_masuk_rs: '', jam_masuk_rs: '', ruangan_id: '',
    akibat_insiden: '', tindakan_awal: '', tindakan_oleh: '',
    pernah_terjadi: 'Tidak', pencegahan_ulang: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getRuangan().then(list => setRuanganList(list)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.description.trim().length < 15) {
      setError('Kronologi minimal 15 karakter!'); return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        umur: form.umur ? parseInt(form.umur) : undefined,
      };
      const res = await api.createIncident(payload);
      setSuccess(true);
      setTimeout(() => navigate(`/incidents/${res.id}`), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: 500, margin: '3rem auto', textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2>Insiden Berhasil Disimpan!</h2>
          <p style={{ color: '#64748b', margin: '1rem 0' }}>Mengalihkan ke detail insiden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-title">
          <h2>Input Insiden Keselamatan Pasien</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '.85rem' }}>Formulir pelaporan insiden keselamatan pasien</p>
        </div>
        <div className="page-header-actions">
          <button className="btn" onClick={() => navigate('/incidents')}>← Dashboard</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          {/* I. DATA PASIEN */}
          <div className="form-section">
            <h4 className="section-heading">I. Data Pasien</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div className="form-group">
                <label>No. RM <span className="req">*</span></label>
                <input type="text" name="no_rm" value={form.no_rm}
                  onChange={e => setForm(f => ({...f, no_rm: e.target.value.replace(/[^0-9]/g,'')}))} required />
              </div>
              <div className="form-group">
                <label>Umur</label>
                <input type="number" name="umur" value={form.umur} onChange={handleChange} min="0" />
              </div>
              <div className="form-group">
                <label>Jenis Kelamin</label>
                <select name="jenis_kelamin" value={form.jenis_kelamin} onChange={handleChange}>
                  <option value="">-- Pilih --</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div className="form-group">
                <label>Penanggung Biaya</label>
                <select name="penanggung_biaya" value={form.penanggung_biaya} onChange={handleChange}>
                  <option value="">-- Pilih --</option>
                  <option value="Umum">Umum</option>
                  <option value="BPJS">BPJS</option>
                  <option value="Asuransi Lainnya">Asuransi Lainnya</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>Tanggal Masuk RS</label>
                <input type="date" name="tgl_masuk_rs" value={form.tgl_masuk_rs} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Jam Masuk RS</label>
                <input type="time" name="jam_masuk_rs" value={form.jam_masuk_rs} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* II. RINCIAN KEJADIAN */}
          <div className="form-section" style={{ marginTop: '1.5rem' }}>
            <h4 className="section-heading">II. Rincian Kejadian</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Tanggal Kejadian <span className="req">*</span></label>
                <input type="date" name="incident_date" value={form.incident_date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Jam Kejadian <span className="req">*</span></label>
                <input type="time" name="incident_time" value={form.incident_time} onChange={handleChange} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>Jenis Insiden <span className="req">*</span></label>
                <select name="incident_type" value={form.incident_type} onChange={handleChange} required>
                  <option value="KTD">KTD – Kejadian Tidak Diharapkan</option>
                  <option value="KNC">KNC – Kejadian Nyaris Cedera</option>
                  <option value="KPC">KPC – Kejadian Potensial Cedera</option>
                  <option value="KTC">KTC – Kejadian Tidak Cedera</option>
                  <option value="sentinel">Sentinel</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ruangan <span className="req">*</span></label>
                <select name="ruangan_id" value={form.ruangan_id} onChange={handleChange} required>
                  <option value="">-- Pilih --</option>
                  {ruanganList.filter(r => r.is_active !== 0).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>Lokasi Kejadian <span className="req">*</span></label>
              <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="Tuliskan lokasi detail kejadian" required />
            </div>
          </div>

          {/* III. AKIBAT, TINDAKAN & RIWAYAT */}
          <div className="form-section" style={{ marginTop: '1.5rem' }}>
            <h4 className="section-heading">III. Akibat, Tindakan & Riwayat</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Akibat Insiden</label>
                <select name="akibat_insiden" value={form.akibat_insiden} onChange={handleChange}>
                  <option value="">-- Pilih --</option>
                  <option value="Kematian">Kematian</option>
                  <option value="Cedera Berat">Cedera Irreversibel / Berat</option>
                  <option value="Cedera Sedang">Cedera Reversibel / Sedang</option>
                  <option value="Cedera Ringan">Cedera Ringan</option>
                  <option value="Tidak Ada Cedera">Tidak Ada Cedera</option>
                </select>
              </div>
              <div>
                <p style={{ fontSize: '.78rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Tindakan Awal</p>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label>Uraian Tindakan</label>
                  <textarea name="tindakan_awal" value={form.tindakan_awal} onChange={handleChange} rows="2" />
                </div>
                <div className="form-group">
                  <label>Dilakukan Oleh</label>
                  <select name="tindakan_oleh" value={form.tindakan_oleh} onChange={handleChange}>
                    <option value="">-- Pilih --</option>
                    <option value="Tim">Tim</option>
                    <option value="Dokter">Dokter</option>
                    <option value="Perawat">Perawat</option>
                    <option value="Petugas Lain">Petugas Lain</option>
                  </select>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '.78rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>Riwayat Serupa</p>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label>Pernah Terjadi?</label>
                  <select name="pernah_terjadi" value={form.pernah_terjadi} onChange={handleChange}>
                    <option value="Tidak">Tidak</option>
                    <option value="Ya">Ya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Pencegahan (Jika Ya)</label>
                  <textarea name="pencegahan_ulang" value={form.pencegahan_ulang} onChange={handleChange} rows="2" />
                </div>
              </div>
            </div>
          </div>

          {/* IV. KRONOLOGI */}
          <div className="form-section" style={{ marginTop: '1.5rem' }}>
            <h4 className="section-heading">IV. Kronologi Kejadian</h4>
            <div className="form-group">
              <label>Kronologi <span className="req">*</span></label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="4" required
                placeholder="Tuliskan urutan kejadian, siapa yang terlibat, lokasi, waktu kejadian..." />
            </div>
          </div>

          <div className="form-group checkbox" style={{ marginTop: '1rem' }}>
            <label>
              <input type="checkbox" name="is_anonymous" checked={form.is_anonymous} onChange={handleChange} />
              Lapor secara anonim (identitas tidak ditampilkan)
            </label>
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : '💾 Simpan Insiden'}
            </button>
            <button type="button" className="btn" onClick={() => navigate('/incidents')}>✕ Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
}
