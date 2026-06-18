import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import NotificationModal from '../components/NotificationModal';

const severityColors = { merah: '#EF4444', kuning: '#F59E0B', hijau: '#10B981', biru: '#3B82F6' };
const severityTags = { merah: 'tag tag-merah', kuning: 'tag tag-kuning', hijau: 'tag tag-hijau', biru: 'tag tag-biru' };
const statusLabels = {
  dilaporkan: 'Dilaporkan', divalidasi: 'Divalidasi', investigasi: 'Investigasi',
  ditindaklanjuti: 'Ditindaklanjuti', selesai: 'Selesai', ditolak: 'Ditolak',
};
const invTypeLabels = { komprehensif: 'Komprehensif', sederhana: 'Sederhana' };
const tipeInsidenLabels = {
  administrasi_klinik: 'Administrasi Klinik', proses_prosedur_klinis: 'Proses/Prosedur Klinis',
  dokumentasi: 'Dokumentasi', infeksi_nosokomial: 'Infeksi Nosokomial',
  medikasi: 'Medikasi', transfusi_darah: 'Transfusi Darah',
  nutrisi: 'Nutrisi', oksigen_gas: 'Oksigen/Gas',
  alat_medis: 'Alat Medis', perilaku_pasien: 'Perilaku Pasien',
  jatuh: 'Jatuh', kecelakaan: 'Kecelakaan',
  infrastruktur: 'Infrastruktur', resource_organisasi: 'Resource/Organisasi',
  laboratorium: 'Laboratorium',
};

const validTransitions = {
  dilaporkan: ['divalidasi', 'ditolak'],
  divalidasi: ['investigasi', 'ditolak'],
  investigasi: ['ditindaklanjuti', 'ditolak'],
  ditindaklanjuti: ['selesai', 'ditolak'],
  selesai: [],
  ditolak: [],
};

export default function IncidentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gradeSeverity, setGradeSeverity] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [notif, setNotif] = useState({ message: '', type: '' });

  const fetchData = () => {
    setLoading(true);
    api.getIncident(id).then(data => {
      setIncident(data);
      setGradeSeverity(data.severity || '');
      setNewStatus(data.status || '');
    }).catch(err => setError(err.message))
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleGrade = async () => {
    if (!gradeSeverity) return;
    try {
      await api.gradeIncident(id, gradeSeverity);
      setNotif({ message: `Grade ${gradeSeverity} berhasil disimpan`, type: 'success' });
      fetchData();
    } catch (err) { setNotif({ message: err.message, type: 'error' }); }
  };

  const handleStatus = async () => {
    if (!newStatus) return;
    try {
      await api.updateIncidentStatus(id, newStatus);
      setNotif({ message: 'Status berhasil diperbarui', type: 'success' });
      fetchData();
    } catch (err) { setNotif({ message: err.message, type: 'error' }); }
  };

  if (loading) return <div className="page loading"><div className="spinner" /><p>Memuat...</p></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!incident) return <div className="page"><p>Insiden tidak ditemukan</p></div>;

  const canGrade = !incident.severity && ['validator', 'pmkp', 'admin'].includes(user.role);
  const canUpdateStatus = ['pmkp', 'validator', 'admin'].includes(user.role);
  const canExport = ['pmkp', 'manajemen', 'admin', 'kepala_unit'].includes(user.role);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Detail Insiden</h1>
        <Link to="/incidents" className="btn btn-back">← Kembali</Link>
      </div>

      <div className="detail-grid">
        <div className="card detail-main">
          <div className="detail-row">
            <span className="detail-label">Tipe Insiden</span>
            <span className="detail-value">{incident.incident_type}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Tanggal</span>
            <span className="detail-value">{incident.incident_date} {incident.incident_time}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Lokasi</span>
            <span className="detail-value">
              {incident.current_location || incident.location}
              {incident.location && incident.ruangan_id && incident.location !== incident.current_location
                ? ` (${incident.location})` : ''}
            </span>
          </div>
          {incident.incident_summary && (
            <div className="detail-row">
              <span className="detail-label">Ringkasan</span>
              <span className="detail-value">{incident.incident_summary}</span>
            </div>
          )}
          {incident.tipe_insiden && (
            <div className="detail-row">
              <span className="detail-label">Klasifikasi</span>
              <span className="detail-value">{tipeInsidenLabels[incident.tipe_insiden] || incident.tipe_insiden}{incident.subtipe_insiden ? ` - ${incident.subtipe_insiden}` : ''}</span>
            </div>
          )}
          {incident.spesialisasi && (
            <div className="detail-row">
              <span className="detail-label">Spesialisasi</span>
              <span className="detail-value">{incident.spesialisasi}</span>
            </div>
          )}
          {incident.unit_penyebab && (
            <div className="detail-row">
              <span className="detail-label">Unit Penyebab</span>
              <span className="detail-value">{incident.unit_penyebab}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value">{statusLabels[incident.status]}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Severity</span>
            <span className="detail-value">
              {incident.severity
                ? <span className={severityTags[incident.severity]}>{incident.severity.toUpperCase()}</span>
                : <span className="tag tag-default">Belum di-grade</span>}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Pelapor</span>
            <span className="detail-value">{incident.reporter_name} ({incident.reporter_unit})</span>
          </div>
          {incident.first_reporter && (
            <div className="detail-row">
              <span className="detail-label">Pertama Melapor</span>
              <span className="detail-value">{incident.first_reporter}</span>
            </div>
          )}
          <div className="detail-section">
            <h3>Kronologis</h3>
            <p>{incident.description}</p>
          </div>
          <div className="detail-section">
            <h3>Akibat</h3>
            <p>{incident.consequence}</p>
          </div>
          {incident.immediate_action && (
            <div className="detail-section">
              <h3>Tindakan Segera</h3>
              <p>{incident.immediate_action}</p>
            </div>
          )}
          {incident.akibat_insiden && (
            <div className="detail-row">
              <span className="detail-label">Akibat Insiden</span>
              <span className="detail-value">{incident.akibat_insiden}</span>
            </div>
          )}
          {incident.tindakan_awal && (
            <div className="detail-row">
              <span className="detail-label">Tindakan Awal</span>
              <span className="detail-value">{incident.tindakan_awal}</span>
            </div>
          )}
          {incident.tindakan_oleh && (
            <div className="detail-row">
              <span className="detail-label">Tindakan Oleh</span>
              <span className="detail-value">{incident.tindakan_oleh}</span>
            </div>
          )}
          {incident.pernah_terjadi === 'Ya' && (
            <div className="detail-row">
              <span className="detail-label">Pernah Terjadi</span>
              <span className="detail-value">{incident.pernah_terjadi}</span>
            </div>
          )}
          {incident.pencegahan_ulang && (
            <div className="detail-row">
              <span className="detail-label">Pencegahan Ulang</span>
              <span className="detail-value">{incident.pencegahan_ulang}</span>
            </div>
          )}
          {incident.no_rm && (
            <div className="detail-row">
              <span className="detail-label">No. RM</span>
              <span className="detail-value">{incident.no_rm}</span>
            </div>
          )}
          {incident.umur && (
            <div className="detail-row">
              <span className="detail-label">Umur</span>
              <span className="detail-value">{incident.umur}</span>
            </div>
          )}
          {incident.jenis_kelamin && (
            <div className="detail-row">
              <span className="detail-label">JK</span>
              <span className="detail-value">{incident.jenis_kelamin}</span>
            </div>
          )}
          {incident.penanggung_biaya && (
            <div className="detail-row">
              <span className="detail-label">Penanggung Biaya</span>
              <span className="detail-value">{incident.penanggung_biaya}</span>
            </div>
          )}
        </div>

        <div className="detail-sidebar">
          {canGrade && (
            <div className="card">
              <h3>Grading Insiden</h3>
              <div className="grade-options">
                {['biru', 'hijau', 'kuning', 'merah'].map(s => (
                  <label key={s} className={`grade-option ${gradeSeverity === s ? 'selected' : ''}`}
                    style={{ '--grade-color': severityColors[s], '--grade-color-bg': `${severityColors[s]}15` }}>
                    <input type="radio" name="severity" value={s}
                      checked={gradeSeverity === s}
                      onChange={e => setGradeSeverity(e.target.value)} />
                    <span className="grade-option-dot" />
                    <span className="grade-option-label">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                  </label>
                ))}
              </div>
              <button className="btn btn-grade btn-full" onClick={handleGrade} disabled={!gradeSeverity}>
                Simpan Grade
              </button>
            </div>
          )}

          {canUpdateStatus && (
            <div className="card">
              <h3>Update Status</h3>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="form-control">
                <option value="">Pilih Status</option>
                {(validTransitions[incident.status] || []).map(k => <option key={k} value={k}>{statusLabels[k]}</option>)}
              </select>
              <button className="btn btn-status btn-full" onClick={handleStatus}
                disabled={!newStatus || newStatus === incident.status}>
                Update Status
              </button>
            </div>
          )}

          {canExport && (
            <div className="card">
              <h3>Export</h3>
              <button className="btn btn-export-excel btn-full" style={{ marginBottom: 8 }} onClick={() => window.open('/api/v1/laporan/export/excel', '_blank')}>
                📥 Export Excel
              </button>
              <button className="btn btn-export-pdf btn-full" onClick={() => window.open('/api/v1/laporan/export/pdf', '_blank')}>
                📥 Export PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {incident.investigation && (
        <div className="card">
          <h2>Investigasi</h2>
          <div className="detail-row">
            <span className="detail-label">Tipe</span>
            <span className="detail-value">{invTypeLabels[incident.investigation.type]}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value">{incident.investigation.status === 'selesai' ? '✅ Selesai' : '⏳ Berlangsung'}</span>
          </div>
          <Link to={`/investigations/${incident.investigation.id}`} className="btn btn-investigation">Lihat Detail</Link>
        </div>
      )}

      <NotificationModal message={notif.message} type={notif.type}
        onClose={() => setNotif({ message: '', type: '' })} />
    </div>
  );
}
