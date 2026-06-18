import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import { useAuth } from '../context/AuthContext';
import NotificationModal from '../components/NotificationModal';

const tipeInsidenList = [
  { value: '', label: 'Pilih Tipe Insiden' },
  { value: 'administrasi_klinik', label: 'Administrasi Klinik' },
  { value: 'proses_prosedur_klinis', label: 'Proses / Prosedur Klinis' },
  { value: 'dokumentasi', label: 'Dokumentasi' },
  { value: 'infeksi_nosokomial', label: 'Infeksi Nosokomial (HAI)' },
  { value: 'medikasi', label: 'Medikasi / Cairan Infus' },
  { value: 'transfusi_darah', label: 'Transfusi Darah / Produk Darah' },
  { value: 'nutrisi', label: 'Nutrisi' },
  { value: 'oksigen_gas', label: 'Oksigen / Gas' },
  { value: 'alat_medis', label: 'Alat Medis / Kesehatan' },
  { value: 'perilaku_pasien', label: 'Perilaku Pasien' },
  { value: 'jatuh', label: 'Jatuh' },
  { value: 'kecelakaan', label: 'Kecelakaan' },
  { value: 'infrastruktur', label: 'Infrastruktur / Bangunan' },
  { value: 'resource_organisasi', label: 'Resource / Manajemen Organisasi' },
  { value: 'laboratorium', label: 'Laboratorium / Patologi' },
];

const subtipeByTipe = {
  administrasi_klinik: ['Proses', 'Masalah'],
  proses_prosedur_klinis: ['Proses', 'Masalah'],
  dokumentasi: ['Dokumen Terkait', 'Masalah'],
  infeksi_nosokomial: ['Tipe Organisme', 'Tipe/Bagian Infeksi'],
  medikasi: ['Medikasi Terkait', 'Proses Penggunaan', 'Masalah'],
  transfusi_darah: ['Transfusi Terkait', 'Proses Transfusi', 'Masalah'],
  nutrisi: ['Nutrisi Terkait', 'Proses Nutrisi', 'Masalah'],
  oksigen_gas: ['Oksigen Terkait', 'Proses Penggunaan', 'Masalah'],
  alat_medis: ['Tipe Alat', 'Masalah'],
  perilaku_pasien: ['Perilaku Pasien', 'Agresi/Kekerasan'],
  jatuh: ['Tipe Jatuh', 'Keterlibatan Saat Jatuh'],
  kecelakaan: ['Benturan Tumpul', 'Serangan Tajam', 'Mekanisme Panas', 'Ancaman Pernafasan', 'Paparan Kimia', 'Bencana Alam'],
  infrastruktur: ['Keterlibatan Struktur', 'Masalah'],
  resource_organisasi: ['Beban Kerja', 'Ketersediaan TT', 'SDM', 'Organisasi/Tim', 'Protokol/SOP'],
  laboratorium: ['Pengambilan', 'Transport', 'Sorting', 'Data Entry', 'Prosesing', 'Verifikasi', 'Hasil'],
};

const fieldHelps = {
  incident_type: (
    <div className="help-card">
      <h4>Jenis Insiden</h4>
      <ul>
        <li><strong>KTD</strong> — Kejadian Tidak Diharapkan (Sudah terjadi cedera)</li>
        <li><strong>KNC</strong> — Kejadian Nyaris Cedera (Belum sampai ke pasien)</li>
        <li><strong>KPC</strong> — Kejadian Potensial Cedera (Belum terjadi, risiko tinggi)</li>
        <li><strong>KTC</strong> — Kejadian Tidak Cedera (Terjadi tapi tidak cedera)</li>
        <li><strong>Sentinel</strong> — Kejadian sangat serius (kematian/cacat permanen)</li>
      </ul>
    </div>
  ),
  incident_date_time: (
    <div className="help-card">
      <h4>Tanggal & Waktu</h4>
      <p>Isi tanggal dan waktu <strong>saat kejadian terjadi</strong>, bukan saat melapor. Laporan harus dibuat maksimal 2×24 jam setelah kejadian.</p>
    </div>
  ),
  location: (
    <div className="help-card">
      <h4>Lokasi</h4>
      <p>Ruangan atau tempat dimana insiden terjadi. Terisi otomatis sesuai unit Anda.</p>
    </div>
  ),
  patient: (
    <div className="help-card">
      <h4>Identitas Pasien</h4>
      <ul>
        <li><strong>No. RM</strong> — Rekam Medis pasien</li>
        <li><strong>Umur</strong> — Pilih rentang usia sesuai standar</li>
        <li><strong>JK</strong> — Jenis kelamin pasien</li>
        <li><strong>Penanggung Biaya</strong> — Pilihan: Pribadi, BPJS, JAMKESMAS, Asuransi Swasta, Perusahaan</li>
        <li><strong>Tgl/Jam Masuk RS</strong> — Waktu masuk rumah sakit</li>
      </ul>
      <p className="help-note">* Kosongkan jika tidak diketahui</p>
    </div>
  ),
  detail: (
    <div className="help-card">
      <h4>Detail Kejadian</h4>
      <ul>
        <li><strong>Ringkasan</strong> — Judul singkat insiden (ex: Pasien jatuh, Salah obat)</li>
        <li><strong>Kronologis</strong> — Uraikan secara kronologis dan detail</li>
        <li><strong>Tipe Insiden</strong> — Klasifikasi berdasarkan Tabel 5 Pedoman IKP</li>
        <li><strong>Spesialisasi</strong> — Kasus penyakit pasien saat insiden</li>
        <li><strong>Akibat Insiden</strong> — Pilih kategori standar: Kematian s/d Tidak Ada Cedera</li>
        <li><strong>Pencegahan Ulang</strong> — Upaya agar kejadian serupa tidak terulang</li>
      </ul>
    </div>
  ),
  anonymous: (
    <div className="help-card help-note">
      <p>Centang <strong>"Lapor Anonim"</strong> jika Anda ingin melaporkan tanpa menampilkan identitas sebagai pelapor.</p>
    </div>
  ),
};

export default function IncidentCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ruangan, setRuangan] = useState([]);
  const [form, setForm] = useState({
    incident_type: 'KTD', incident_date: '', incident_time: '',
    location: '', ruangan_id: '', description: '', consequence: '',
    immediate_action: '', is_anonymous: false,
    no_rm: '', umur: '', jenis_kelamin: '', penanggung_biaya: '',
    tgl_masuk_rs: '', jam_masuk_rs: '',
    akibat_insiden: '', tindakan_awal: '', tindakan_oleh: '',
    pernah_terjadi: 'Tidak', pencegahan_ulang: '',
    incident_summary: '',
    tipe_insiden: '', subtipe_insiden: '',
    spesialisasi: '', unit_penyebab: '',
    first_reporter: '',
  });
  const [activeHelp, setActiveHelp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({ message: '', detail: '', type: '' });

  useEffect(() => {
    api.getRuangan().then(res => {
      setRuangan(res.data);
      if (user?.ruangan_id) {
        const match = res.data.find(r => r.id === user.ruangan_id);
        if (match) setForm(f => ({ ...f, location: match.name, ruangan_id: match.id }));
      } else if (user?.unit) {
        const match = res.data.find(r => r.name.toLowerCase() === user.unit.toLowerCase());
        setForm(f => ({ ...f, location: match ? match.name : user.unit, ruangan_id: match ? match.id : '' }));
      }
    }).catch(() => {});
  }, [user?.unit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFocus = (field) => setActiveHelp(field);
  const handleBlur = () => setActiveHelp(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.umur) delete payload.umur;
      for (const k of ['no_rm', 'tgl_masuk_rs', 'jam_masuk_rs',
        'tindakan_awal', 'pencegahan_ulang', 'incident_summary',
        'tipe_insiden', 'subtipe_insiden', 'spesialisasi', 'unit_penyebab', 'first_reporter']) {
        if (!payload[k]) delete payload[k];
      }
      const res = await api.createIncident(payload);
      setNotif({
        message: 'Laporan berhasil disimpan!',
        detail: `Insiden ${res.incident_type} pada ${res.incident_date} berhasil dilaporkan.`,
        type: 'success',
      });
      setTimeout(() => navigate('/incidents'), 1500);
    } catch (err) {
      setNotif({
        message: 'Gagal menyimpan laporan',
        detail: err.message || 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.',
        type: 'error',
      });
      setLoading(false);
    }
  };

  return (
    <div className="page-full">
      <div className="page-header">
        <h1>Laporan Insiden Baru</h1>
      </div>

      <div className="card single-form-card">
        <form onSubmit={handleSubmit} className="form-in-card">
          <div className="form-side">
            <h3 style={{ marginTop: 0 }}>Informasi Kejadian</h3>
            <div className="form-row">
              <div className="form-group" onFocus={() => handleFocus('incident_type')} onBlur={handleBlur}>
                <label>Jenis Insiden *</label>
                <select name="incident_type" value={form.incident_type} onChange={handleChange}>
                  <option value="KTD">KTD - Kejadian Tidak Diharapkan</option>
                  <option value="KNC">KNC - Kejadian Nyaris Cedera</option>
                  <option value="KPC">KPC - Kejadian Potensial Cedera</option>
                  <option value="KTC">KTC - Kejadian Tidak Cedera</option>
                  <option value="sentinel">Sentinel</option>
                </select>
              </div>
              <div className="form-group" onFocus={() => handleFocus('incident_date_time')} onBlur={handleBlur}>
                <label>Tanggal *</label>
                <input type="date" name="incident_date" value={form.incident_date} onChange={handleChange} required />
              </div>
              <div className="form-group" onFocus={() => handleFocus('incident_date_time')} onBlur={handleBlur}>
                <label>Waktu *</label>
                <input type="time" name="incident_time" value={form.incident_time} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group" onFocus={() => handleFocus('location')} onBlur={handleBlur}>
              <label>Lokasi *</label>
              <input type="text" name="location" value={form.location} onChange={handleChange}
                placeholder="Contoh: IGD, Rawat Inap, Farmasi" required />
            </div>

            <h3>Ringkasan & Klasifikasi</h3>
            <div className="form-group" onFocus={() => handleFocus('detail')} onBlur={handleBlur}>
              <label>Ringkasan Insiden</label>
              <input type="text" name="incident_summary" value={form.incident_summary} onChange={handleChange}
                placeholder="Judul singkat, ex: Pasien jatuh dari tempat tidur, Salah pemberian obat" />
            </div>

            <div className="form-row">
              <div className="form-group" onFocus={() => handleFocus('detail')} onBlur={handleBlur}>
                <label>Tipe Insiden (Tabel 5)</label>
                <select name="tipe_insiden" value={form.tipe_insiden} onChange={e => {
                  handleChange(e);
                  setForm(f => ({ ...f, subtipe_insiden: '' }));
                }}>
                  {tipeInsidenList.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {form.tipe_insiden && subtipeByTipe[form.tipe_insiden] && (
                <div className="form-group" onFocus={() => handleFocus('detail')} onBlur={handleBlur}>
                  <label>Subtipe Insiden</label>
                  <select name="subtipe_insiden" value={form.subtipe_insiden} onChange={handleChange}>
                    <option value="">Pilih Subtipe</option>
                    {subtipeByTipe[form.tipe_insiden].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group" onFocus={() => handleFocus('detail')} onBlur={handleBlur}>
                <label>Spesialisasi Pasien</label>
                <select name="spesialisasi" value={form.spesialisasi} onChange={handleChange}>
                  <option value="">Pilih</option>
                  <option>Penyakit Dalam</option><option>Anak</option><option>Bedah</option>
                  <option>Obstetri Ginekologi</option><option>THT</option><option>Mata</option>
                  <option>Saraf</option><option>Anastesi</option><option>Kulit &amp; Kelamin</option>
                  <option>Jantung</option><option>Paru</option><option>Jiwa</option>
                  <option>Umum</option><option>Lainnya</option>
                </select>
              </div>
              <div className="form-group" onFocus={() => handleFocus('detail')} onBlur={handleBlur}>
                <label>Unit Penyebab</label>
                <input type="text" name="unit_penyebab" value={form.unit_penyebab} onChange={handleChange}
                  placeholder="Unit yang menyebabkan insiden" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" onFocus={() => handleFocus('detail')} onBlur={handleBlur}>
                <label>Orang Pertama Melapor</label>
                <select name="first_reporter" value={form.first_reporter} onChange={handleChange}>
                  <option value="">Pilih</option>
                  <option>Karyawan</option><option>Pasien</option>
                  <option>Keluarga/Pendamping</option><option>Pengunjung</option>
                  <option>Lainnya</option>
                </select>
              </div>
            </div>

            <h3>Identitas Pasien</h3>
            <div className="form-row">
              <div className="form-group">
                <label>No. Rekam Medis</label>
                <input type="text" name="no_rm" value={form.no_rm} onChange={handleChange} placeholder="ex: 01.02.1234"
                  onFocus={() => handleFocus('patient')} onBlur={handleBlur} />
              </div>
              <div className="form-group">
                <label>Umur</label>
                <select name="umur" value={form.umur} onChange={handleChange}
                  onFocus={() => handleFocus('patient')} onBlur={handleBlur}>
                  <option value="">Pilih</option>
                  <option value="0-1_bulan">0-1 bulan</option>
                  <option value="1_bulan-1_tahun">&gt;1 bulan - 1 tahun</option>
                  <option value="1-5_tahun">&gt;1 - 5 tahun</option>
                  <option value="5-15_tahun">&gt;5 - 15 tahun</option>
                  <option value="15-30_tahun">&gt;15 - 30 tahun</option>
                  <option value="30-65_tahun">&gt;30 - 65 tahun</option>
                  <option value="65_plus_tahun">&gt;65 tahun</option>
                </select>
              </div>
              <div className="form-group">
                <label>Jenis Kelamin</label>
                <select name="jenis_kelamin" value={form.jenis_kelamin} onChange={handleChange}
                  onFocus={() => handleFocus('patient')} onBlur={handleBlur}>
                  <option value="">Pilih</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Penanggung Biaya</label>
                <select name="penanggung_biaya" value={form.penanggung_biaya} onChange={handleChange}
                  onFocus={() => handleFocus('patient')} onBlur={handleBlur}>
                  <option value="">Pilih</option>
                  <option value="Pribadi">Pribadi</option>
                  <option value="BPJS">BPJS / ASKES Pemerintah</option>
                  <option value="JAMKESMAS">JAMKESMAS</option>
                  <option value="Asuransi Swasta">Asuransi Swasta</option>
                  <option value="Perusahaan">Perusahaan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tgl Masuk RS</label>
                <input type="date" name="tgl_masuk_rs" value={form.tgl_masuk_rs} onChange={handleChange}
                  onFocus={() => handleFocus('patient')} onBlur={handleBlur} />
              </div>
              <div className="form-group">
                <label>Jam Masuk RS</label>
                <input type="time" name="jam_masuk_rs" value={form.jam_masuk_rs} onChange={handleChange}
                  onFocus={() => handleFocus('patient')} onBlur={handleBlur} />
              </div>
            </div>

            <h3>Detail Kejadian</h3>
            <div className="form-group" onFocus={() => handleFocus('detail')} onBlur={handleBlur}>
              <label>Kronologis Kejadian *</label>
              <textarea name="description" rows="4" value={form.description} onChange={handleChange} placeholder="Jelaskan kronologis kejadian secara detail" required />
            </div>

            <div className="form-group" onFocus={() => handleFocus('detail')} onBlur={handleBlur}>
              <label>Akibat / Dampak *</label>
              <textarea name="consequence" rows="3" value={form.consequence} onChange={handleChange} placeholder="Jelaskan akibat yang ditimbulkan" required />
            </div>

            <div className="form-group" onFocus={() => handleFocus('detail')} onBlur={handleBlur}>
              <label>Tindakan Segera</label>
              <textarea name="immediate_action" rows="3" value={form.immediate_action} onChange={handleChange} placeholder="Tindakan yang sudah dilakukan" />
            </div>

            <div className="form-row">
              <div className="form-group" onFocus={() => handleFocus('detail')} onBlur={handleBlur}>
                <label>Akibat Insiden</label>
                <select name="akibat_insiden" value={form.akibat_insiden} onChange={handleChange}>
                  <option value="">Pilih</option>
                  <option value="Kematian">Kematian</option>
                  <option value="Cedera Berat/Irreversibel">Cedera Berat / Irreversibel</option>
                  <option value="Cedera Sedang/Reversibel">Cedera Sedang / Reversibel</option>
                  <option value="Cedera Ringan">Cedera Ringan</option>
                  <option value="Tidak Ada Cedera">Tidak Ada Cedera</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tindakan Awal</label>
                <input type="text" name="tindakan_awal" value={form.tindakan_awal} onChange={handleChange} placeholder="Tindakan awal yang diberikan" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tindakan Oleh</label>
                <select name="tindakan_oleh" value={form.tindakan_oleh} onChange={handleChange}>
                  <option value="">Pilih</option>
                  <option value="Tim">Tim</option>
                  <option value="Dokter">Dokter</option>
                  <option value="Perawat">Perawat</option>
                  <option value="Petugas Lainnya">Petugas Lainnya</option>
                </select>
              </div>
              <div className="form-group">
                <label>Pernah Terjadi</label>
                <select name="pernah_terjadi" value={form.pernah_terjadi} onChange={handleChange}>
                  <option value="Tidak">Tidak</option>
                  <option value="Ya">Ya</option>
                </select>
              </div>
              <div className="form-group">
                <label>Pencegahan Ulang</label>
                <input type="text" name="pencegahan_ulang" value={form.pencegahan_ulang} onChange={handleChange} placeholder="Upaya pencegahan" />
              </div>
            </div>

            <div className="form-group checkbox" onFocus={() => handleFocus('anonymous')} onBlur={handleBlur}>
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
          </div>

          <div className="help-sidebar">
            <div className="help-sidebar-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>Petunjuk Pengisian</span>
            </div>
            <div className="help-sidebar-content">
              {activeHelp ? (
                fieldHelps[activeHelp]
              ) : (
                <div className="help-card help-default">
                  <div className="help-prosedur">
                    <h4>📌 Prosedur Pelaporan Insiden</h4>
                    <ol>
                      <li><strong>Isi Data Kejadian</strong> — Pilih jenis insiden, tanggal, waktu, dan lokasi kejadian.</li>
                      <li><strong>Identitas Pasien</strong> — Lengkapi data pasien jika tersedia (opsional).</li>
                      <li><strong>Kronologis</strong> — Uraikan kejadian secara detail dan jelas.</li>
                      <li><strong>Akibat & Tindakan</strong> — Jelaskan dampak dan tindakan yang sudah dilakukan.</li>
                      <li><strong>Kirim Laporan</strong> — Klik "Kirim Laporan" untuk mengirim ke sistem.</li>
                    </ol>
                  </div>

                  <div className="help-tips">
                    <h4>💡 Alur setelah melapor</h4>
                    <ul>
                      <li>Laporan masuk ke sistem dengan status <strong>"Dilaporkan"</strong>.</li>
                      <li>Validator akan meninjau dan memberikan grading severity.</li>
                      <li>Jika tervalidasi, PMKP akan melakukan investigasi.</li>
                      <li>Hasil investigasi ditindaklanjuti oleh unit terkait.</li>
                      <li>Laporan <strong>minimal</strong>: Jenis, Tanggal, Waktu, Lokasi, Kronologis, dan Akibat.</li>
                      <li>Data pasien bersifat <strong>opsional</strong> — isi jika tersedia.</li>
                    </ul>
                  </div>

                  <div className="help-tips">
                    <p className="help-focus-hint">👆 Fokus pada salah satu field input untuk melihat petunjuk pengisian secara detail.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      <NotificationModal message={notif.message} type={notif.type}
        onClose={() => { setNotif({ message: '', type: '' }); setLoading(false); }} />
    </div>
  );
}
