import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [hospitalName, setHospitalName] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    api.getSettings()
      .then(data => {
        setSettings(data);
        setHospitalName(data.hospital_name || '');
        setLogoPreview(data.hospital_logo || '/logo.png');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveName = async () => {
    setError('');
    setSuccess('');
    if (!hospitalName.trim()) { setError('Nama rumah sakit wajib diisi'); return; }
    setSaving(true);
    try {
      const data = await api.updateSettings({ hospital_name: hospitalName });
      setSettings(data);
      setSuccess('Nama rumah sakit berhasil disimpan');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const data = await api.uploadLogo(logoFile);
      setSettings(data);
      setLogoFile(null);
      setSuccess('Logo berhasil diupload');
    } catch (err) {
      setError(err.message);
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

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ maxWidth: 600, marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Nama Rumah Sakit</h2>
        <div className="form-group">
          <label>Nama Rumah Sakit</label>
          <input type="text" value={hospitalName} onChange={e => setHospitalName(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleSaveName} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
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
