import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

const severityColors = { merah: '#dc2626', kuning: '#d97706', hijau: '#16a34a', biru: '#2563eb' };
const statusLabels = {
  dilaporkan: 'Dilaporkan', divalidasi: 'Divalidasi', investigasi: 'Investigasi',
  ditindaklanjuti: 'Ditindaklanjuti', selesai: 'Selesai', ditolak: 'Ditolak',
};
const invTypeLabels = { komprehensif: 'Komprehensif', sederhana: 'Sederhana' };

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

  if (loading) return <div className="page"><p>Memuat...</p></div>;
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
            <span className="detail-value">{incident.location}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value">{statusLabels[incident.status]}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Severity</span>
            <span className="detail-value">
              {incident.severity
                ? <span style={{ color: severityColors[incident.severity], fontWeight: 'bold' }}>{incident.severity.toUpperCase()}</span>
                : <span className="tag tag-default">Belum di-grade</span>}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Pelapor</span>
            <span className="detail-value">{incident.reporter_name} ({incident.reporter_unit})</span>
          </div>
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
        </div>

        <div className="detail-sidebar">
          {canGrade && (
            <div className="card">
              <h3>Grading Insiden</h3>
              <select value={gradeSeverity} onChange={e => setGradeSeverity(e.target.value)} className="form-control">
                <option value="">Pilih Severity</option>
                <option value="biru">Biru</option>
                <option value="hijau">Hijau</option>
                <option value="kuning">Kuning</option>
                <option value="merah">Merah</option>
              </select>
              <button className="btn btn-primary btn-full" onClick={handleGrade} disabled={!gradeSeverity}>Simpan Grade</button>
            </div>
          )}

          {canUpdateStatus && (
            <div className="card">
              <h3>Update Status</h3>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="form-control">
                <option value="">Pilih Status</option>
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button className="btn btn-full" onClick={handleStatus} disabled={!newStatus || newStatus === incident.status}>Update</button>
            </div>
          )}

          {canExport && (
            <div className="card">
              <h3>Export</h3>
              <button className="btn btn-full" onClick={() => window.open('/api/v1/export/excel', '_blank')}>📥 Export Excel</button>
              <button className="btn btn-full" onClick={() => window.open('/api/v1/export/pdf', '_blank')}>📥 Export PDF</button>
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
