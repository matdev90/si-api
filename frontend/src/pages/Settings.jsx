import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import NotificationModal from '../components/NotificationModal';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalOwnership, setHospitalOwnership] = useState('');
  const [hospitalType, setHospitalType] = useState('');
  const [hospitalClass, setHospitalClass] = useState('');
  const [hospitalBedCapacity, setHospitalBedCapacity] = useState('');
  const [hospitalProvince, setHospitalProvince] = useState('');
  const [hospitalCode, setHospitalCode] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingHospital, setSavingHospital] = useState(false);
  const [notif, setNotif] = useState({ message: '', type: '' });
  const fileRef = useRef(null);

  useEffect(() => {
    api.getSettings()
      .then(data => {
        setSettings(data);
        setHospitalName(data.hospital_name || '');
        setHospitalOwnership(data.hospital_ownership || '');
        setHospitalType(data.hospital_type || '');
        setHospitalClass(data.hospital_class || '');
        setHospitalBedCapacity(data.hospital_bed_capacity || '');
        setHospitalProvince(data.hospital_province || '');
        setHospitalCode(data.hospital_code || '');
        setLogoPreview(data.hospital_logo || '/logo.png');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveName = async () => {
    setNotif({ message: '', type: '' });
    if (!hospitalName.trim()) { setNotif({ message: 'Nama rumah sakit wajib diisi', type: 'error' }); return; }
    setSaving(true);
    try {
      const data = await api.updateSettings({ hospital_name: hospitalName });
      setSettings(data);
      setNotif({ message: 'Nama rumah sakit berhasil disimpan', type: 'success' });
    } catch (err) {
      setNotif({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHospitalData = async () => {
    setNotif({ message: '', type: '' });
    setSavingHospital(true);
    try {
      const data = await api.updateSettings({
        hospital_ownership: hospitalOwnership,
        hospital_type: hospitalType,
        hospital_class: hospitalClass,
        hospital_bed_capacity: hospitalBedCapacity,
        hospital_province: hospitalProvince,
        hospital_code: hospitalCode,
      });
      setSettings(data);
      setNotif({ message: 'Data rumah sakit berhasil disimpan', type: 'success' });
    } catch (err) {
      setNotif({ message: err.message, type: 'error' });
    } finally {
      setSavingHospital(false);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setNotif({ message: '', type: '' });
    setSaving(true);
    try {
      const data = await api.uploadLogo(logoFile);
      setSettings(data);
      setLogoFile(null);
      setNotif({ message: 'Logo berhasil diupload', type: 'success' });
    } catch (err) {
      setNotif({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading">Memuat...</div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Pengaturan Aplikasi</h1>
      </div>

      <NotificationModal message={notif.message} type={notif.type} onClose={() => setNotif({ message: '', type: '' })} />

      <div className="card" style={{ maxWidth: 700, marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Nama Rumah Sakit</h2>
        <div className="form-group">
          <label>Nama Rumah Sakit</label>
          <input type="text" value={hospitalName} onChange={e => setHospitalName(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleSaveName} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: 700, marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Data Rumah Sakit (Laporan Eksternal)</h2>
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label>Kepemilikan RS</label>
            <select value={hospitalOwnership} onChange={e => setHospitalOwnership(e.target.value)}>
              <option value="">Pilih</option>
              <option value="Pemerintah Pusat">Pemerintah Pusat</option>
              <option value="Pemerintah Daerah">Pemerintah Daerah</option>
              <option value="TNI/POLRI">TNI / POLRI</option>
              <option value="Swasta">Swasta</option>
              <option value="BUMN/BUMD">BUMN / BUMD</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tipe RS</label>
            <select value={hospitalType} onChange={e => setHospitalType(e.target.value)}>
              <option value="">Pilih</option>
              <option value="RS Umum">RS Umum</option>
              <option value="RS Khusus">RS Khusus</option>
              <option value="RSIA">RSIA</option>
              <option value="RS Paru">RS Paru</option>
              <option value="RS Mata">RS Mata</option>
              <option value="RS Orthopedi">RS Orthopedi</option>
              <option value="RS Jantung">RS Jantung</option>
              <option value="RS Jiwa">RS Jiwa</option>
              <option value="RS Kusta">RS Kusta</option>
              <option value="RS Khusus Lainnya">RS Khusus Lainnya</option>
            </select>
          </div>
          <div className="form-group">
            <label>Kelas RS</label>
            <select value={hospitalClass} onChange={e => setHospitalClass(e.target.value)}>
              <option value="">Pilih</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="Pratama">Pratama</option>
              <option value="Madya">Madya</option>
            </select>
          </div>
          <div className="form-group">
            <label>Kapasitas Tempat Tidur</label>
            <input type="text" value={hospitalBedCapacity} onChange={e => setHospitalBedCapacity(e.target.value)} placeholder="Jumlah TT" />
          </div>
          <div className="form-group">
            <label>Propinsi</label>
            <input type="text" value={hospitalProvince} onChange={e => setHospitalProvince(e.target.value)} placeholder="Nama propinsi" />
          </div>
          <div className="form-group">
            <label>Kode RS (KKP-RS)</label>
            <input type="text" value={hospitalCode} onChange={e => setHospitalCode(e.target.value)} placeholder="Kode dari KKP-RS PERSI" />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSaveHospitalData} disabled={savingHospital} style={{ marginTop: 12 }}>
          {savingHospital ? 'Menyimpan...' : 'Simpan Data RS'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        <h2 style={{ marginBottom: '1rem' }}>Logo Rumah Sakit</h2>
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <img src={logoPreview} alt="Logo" style={{ maxWidth: 200, maxHeight: 120, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }} />
        </div>
        <div className="form-group">
          <label>Pilih file logo (PNG/JPG/SVG, max 2MB)</label>
          <input type="file" ref={fileRef} accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoChange} />
        </div>
        {logoFile && (
          <button className="btn btn-primary" onClick={handleUploadLogo} disabled={saving}>
            {saving ? 'Mengupload...' : 'Upload Logo'}
          </button>
        )}
      </div>
    </div>
  );
}
