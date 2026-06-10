import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/client';

const GRADE_LEVELS = {
  BIRU: { label: 'BIRU', color: '#3B82F6', bg: '#EFF6FF', desc: 'Risiko sangat rendah' },
  HIJAU: { label: 'HIJAU', color: '#10B981', bg: '#ECFDF5', desc: 'Risiko rendah – dokumentasi cukup' },
  KUNING: { label: 'KUNING', color: '#F59E0B', bg: '#FFFBEB', desc: 'Risiko sedang – pantau & tangani' },
  ORANYE: { label: 'ORANYE', color: '#F97316', bg: '#FFF7ED', desc: 'Risiko tinggi – tindak lanjut cepat' },
  MERAH: { label: 'MERAH', color: '#EF4444', bg: '#FEF2F2', desc: 'Risiko ekstrem – eskalasi segera' },
};

function calcGrade(prob, damp) {
  if (!prob || !damp) return null;
  const s = prob * damp;
  if (s <= 4) return 'BIRU';
  if (s <= 8) return 'HIJAU';
  if (s <= 15) return 'KUNING';
  return 'MERAH';
}

export default function IncidentCreate() {
  const navigate = useNavigate();
  const [ruanganList, setRuanganList] = useState([]);
  const [form, setForm] = useState({
    incident_type: 'KTD', incident_date: '', incident_time: '',
    location: '', description: '', consequence: '',
    immediate_action: '', is_anonymous: false,
    no_rm: '', umur: '', jenis_kelamin: '', penanggung_biaya: '',
    tgl_masuk_rs: '', jam_masuk_rs: '', ruangan_id: '',
    probabilitas: '', dampak: '',
    akibat_insiden: '', tindakan_awal: '', tindakan_oleh: '',
    pernah_terjadi: 'Tidak', pencegahan_ulang: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getRuangan().then(list => setRuanganList(list)).catch(() => {});
  }, []);

  const grade = calcGrade(
    parseInt(form.probabilitas) || 0,
    parseInt(form.dampak) || 0
  );
  const gradeInfo = grade ? GRADE_LEVELS[grade] : null;

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
        probabilitas: form.probabilitas ? parseInt(form.probabilitas) : undefined,
        dampak: form.dampak ? parseInt(form.dampak) : undefined,
        grade_otomatis: grade,
        consequence: form.akibat_insiden || form.consequence,
        immediate_action: form.tindakan_awal || form.immediate_action || null,
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

      <div className="split-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <div className="card">
            <div className="card-header"><h4>Form Pelaporan Insiden</h4></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* I. DATA PASIEN */}
                <div className="form-section">
                  <h4 className="section-heading">I. Data Pasien</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label>No. RM <span className="req">*</span></label>
                      <input type="text" name="no_rm" value={form.no_rm} onChange={e => { const v = e.target.value.replace(/[^0-9]/g,''); setForm(f => ({...f, no_rm: v})); }} required />
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
                        {ruanganList.map(r => (
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

                {/* III. PENILAIAN RISIKO (PMKP) */}
                <div className="form-section" style={{ marginTop: '1.5rem' }}>
                  <h4 className="section-heading">III. Penilaian Risiko (PMKP)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label>Probabilitas <span className="req">*</span></label>
                      <select name="probabilitas" value={form.probabilitas} onChange={handleChange} required>
                        <option value="">-- Pilih --</option>
                        <option value="1">P1 – Sangat Jarang</option>
                        <option value="2">P2 – Jarang</option>
                        <option value="3">P3 – Mungkin</option>
                        <option value="4">P4 – Sering</option>
                        <option value="5">P5 – Hampir Pasti</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Dampak <span className="req">*</span></label>
                      <select name="dampak" value={form.dampak} onChange={handleChange} required>
                        <option value="">-- Pilih --</option>
                        <option value="1">D1 – Tidak Signifikan</option>
                        <option value="2">D2 – Ringan</option>
                        <option value="3">D3 – Sedang</option>
                        <option value="4">D4 – Berat</option>
                        <option value="5">D5 – Bencana</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Grade Insiden (Auto)</label>
                      {gradeInfo ? (
                        <div style={{ padding: '0.5rem', borderRadius: 6, background: gradeInfo.bg, color: gradeInfo.color, fontWeight: 700, textAlign: 'center', fontSize: '1.1rem' }}>
                          {gradeInfo.label}
                        </div>
                      ) : (
                        <div style={{ padding: '0.5rem', borderRadius: 6, background: '#f1f5f9', color: '#94a3b8', textAlign: 'center' }}>-</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* IV–VI. AKIBAT, TINDAKAN & RIWAYAT */}
                <div className="form-section" style={{ marginTop: '1.5rem' }}>
                  <h4 className="section-heading">IV – VI. Akibat, Tindakan & Riwayat</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label>IV. Akibat Insiden</label>
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
                      <p style={{ fontSize: '.78rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>V. Tindakan Awal</p>
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
                      <p style={{ fontSize: '.78rem', fontWeight: 600, marginBottom: 8, color: '#475569' }}>VI. Riwayat Serupa</p>
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

                {/* VII. KRONOLOGI */}
                <div className="form-section" style={{ marginTop: '1.5rem' }}>
                  <h4 className="section-heading">VII. Kronologi Kejadian</h4>
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
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ position: 'sticky', top: '1rem' }}>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header"><h4>Panduan Grade PMKP</h4></div>
            <div className="card-body" style={{ fontSize: '.83rem' }}>
              <p style={{ color: '#64748b', marginBottom: 12 }}>
                Grade dihitung otomatis berdasarkan <strong>Probabilitas × Dampak</strong>.
              </p>
              {Object.entries(GRADE_LEVELS).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 4, background: v.bg, color: v.color, fontWeight: 600, fontSize: '.75rem', minWidth: 60, textAlign: 'center' }}>{k}</span>
                  <span style={{ color: '#64748b', fontSize: '.78rem' }}>{v.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header"><h4>Grade Saat Ini</h4></div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              {gradeInfo ? (
                <>
                  <p style={{ color: '#64748b', fontSize: '.82rem', marginBottom: 12 }}>Grade risiko berhasil dihitung.</p>
                  <span style={{ display: 'inline-block', padding: '10px 28px', borderRadius: 6, background: gradeInfo.bg, color: gradeInfo.color, fontWeight: 700, fontSize: '1.1rem' }}>{gradeInfo.label}</span>
                </>
              ) : (
                <>
                  <p style={{ color: '#64748b', fontSize: '.82rem', marginBottom: 12 }}>Belum dihitung. Pilih Probabilitas dan Dampak.</p>
                  <span style={{ display: 'inline-block', padding: '10px 28px', borderRadius: 6, background: '#f1f5f9', color: '#94a3b8' }}>-</span>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h4>Info Pengisian</h4></div>
            <div className="card-body" style={{ fontSize: '.82rem' }}>
              <ul style={{ color: '#64748b', margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
                <li>Tanda <span style={{ color: '#dc2626', fontWeight: 700 }}>*</span> wajib diisi</li>
                <li>No. RM hanya angka</li>
                <li>Kronologi minimal 15 karakter</li>
                <li>Grade dihitung otomatis — tidak bisa diedit manual</li>
                <li>Simpan setelah grade terhitung</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
