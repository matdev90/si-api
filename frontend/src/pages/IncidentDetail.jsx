import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

const severityColors = { merah: '#EF4444', kuning: '#F59E0B', hijau: '#10B981', biru: '#3B82F6' };
const severityTags = { merah: 'tag tag-merah', kuning: 'tag tag-kuning', hijau: 'tag tag-hijau', biru: 'tag tag-biru' };
const statusLabels = {
  dilaporkan: 'Dilaporkan', divalidasi: 'Divalidasi', investigasi: 'Investigasi',
  ditindaklanjuti: 'Ditindaklanjuti', selesai: 'Selesai', ditolak: 'Ditolak',
};
const invTypeLabels = { komprehensif: 'Komprehensif', sederhana: 'Sederhana' };

function DetailRow({ label, children }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{children || '-'}</span>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="detail-section">
      <h3>{title}</h3>
      {children || <p className="text-muted">-</p>}
    </div>
  );
}

export default function IncidentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gradeSeverity, setGradeSeverity] = useState('');
  const [newStatus, setNewStatus] = useState('');

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
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const handleStatus = async () => {
    if (!newStatus) return;
    try {
      await api.updateIncidentStatus(id, newStatus);
      fetchData();
    } catch (err) { setError(err.message); }
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
        <Link to="/incidents" className="btn">← Kembali</Link>
      </div>

      <div className="detail-grid">
        <div className="card detail-main">
          <DetailRow label="Tipe Insiden">{incident.incident_type}</DetailRow>
          <DetailRow label="Tanggal">{incident.incident_date} {incident.incident_time}</DetailRow>
          <DetailRow label="Lokasi">{incident.location}</DetailRow>
          <DetailRow label="Ruangan">{incident.ruangan_id || '-'}</DetailRow>
          <DetailRow label="Status">{statusLabels[incident.status]}</DetailRow>
          <DetailRow label="Severity">
            {incident.severity
              ? <span className={severityTags[incident.severity]}>{incident.severity.toUpperCase()}</span>
              : <span className="tag tag-default">Belum di-grade</span>}
          </DetailRow>
          <DetailRow label="Pelapor">{incident.reporter_name} ({incident.reporter_unit})</DetailRow>

          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

          <h3 style={{ marginBottom: '0.75rem', fontSize: '.95rem', color: '#475569' }}>Data Pasien</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
            <DetailRow label="No. RM">{incident.no_rm}</DetailRow>
            <DetailRow label="Umur">{incident.umur}</DetailRow>
            <DetailRow label="Jenis Kelamin">{incident.jenis_kelamin}</DetailRow>
            <DetailRow label="Penanggung Biaya">{incident.penanggung_biaya}</DetailRow>
          </div>
          {incident.tgl_masuk_rs && <DetailRow label="Tanggal Masuk RS">{incident.tgl_masuk_rs} {incident.jam_masuk_rs}</DetailRow>}

          <DetailSection title="Akibat Insiden">{incident.akibat_insiden}</DetailSection>

          <DetailSection title="Tindakan Awal">
            {incident.tindakan_awal && <p>{incident.tindakan_awal}</p>}
            {incident.tindakan_oleh && <p style={{ color: '#64748b', fontSize: '.85rem' }}>Dilakukan oleh: {incident.tindakan_oleh}</p>}
          </DetailSection>

          <DetailSection title="Riwayat Serupa">
            {incident.pernah_terjadi === 'Ya' ? (
              <>Pernah terjadi. {incident.pencegahan_ulang && <span>Pencegahan: {incident.pencegahan_ulang}</span>}</>
            ) : 'Tidak pernah terjadi sebelumnya'}
          </DetailSection>

          <DetailSection title="Kronologi">
            <p>{incident.description}</p>
          </DetailSection>

          {incident.immediate_action && (
            <DetailSection title="Tindakan Segera (legacy)">
              <p>{incident.immediate_action}</p>
            </DetailSection>
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
              <button className="btn btn-primary btn-full" onClick={handleGrade} disabled={!gradeSeverity}>
                Simpan Grade
              </button>
            </div>
          )}

          {canUpdateStatus && (
            <div className="card">
              <h3>Update Status</h3>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="form-control">
                <option value="">Pilih Status</option>
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button className="btn btn-full" onClick={handleStatus}
                disabled={!newStatus || newStatus === incident.status}>
                Update
              </button>
            </div>
          )}

          {canExport && (
            <div className="card">
              <h3>Export</h3>
              <button className="btn btn-full" onClick={() => window.open('/api/v1/export/excel', '_blank')}>
                📥 Export Excel
              </button>
              <button className="btn btn-full" onClick={() => window.open('/api/v1/export/pdf', '_blank')}>
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
          <Link to={`/investigations/${incident.investigation.id}`} className="btn">Lihat Detail</Link>
        </div>
      )}
    </div>
  );
}
