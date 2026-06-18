import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import NotificationModal from '../components/NotificationModal';

export default function InvestigationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [investigation, setInvestigation] = useState(null);
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notif, setNotif] = useState({ message: '', type: '' });
  const kontributorOptions = [
  'Faktor Eksternal / di Luar RS',
  'Faktor Organisasi & Manajemen',
  'Faktor Lingkungan Kerja',
  'Faktor Tim',
  'Faktor Petugas / Staf',
  'Faktor Tugas',
  'Faktor Pasien',
  'Faktor Komunikasi',
];

const [form, setForm] = useState({
  root_cause: '', recommendations: '', action_plan: '',
  faktor_kontributor: [], pic_name: '', pic_role: '',
  follow_up_actions: '', follow_up_deadline: '', management_review: false,
});

  const fetchData = () => {
    setLoading(true);
    api.getInvestigation(id).then(async data => {
      setInvestigation(data);
      setForm({
        root_cause: data.root_cause || '',
        recommendations: data.recommendations || '',
        action_plan: data.action_plan || '',
        faktor_kontributor: data.faktor_kontributor ? JSON.parse(data.faktor_kontributor) : [],
        pic_name: data.pic_name || '',
        pic_role: data.pic_role || '',
        follow_up_actions: data.follow_up_actions || '',
        follow_up_deadline: data.follow_up_deadline || '',
        management_review: !!data.management_review,
      });
      if (data.incident_id) {
        const inc = await api.getIncident(data.incident_id);
        setIncident(inc);
      }
    }).catch(err => setError(err.message))
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleComplete = async () => {
    try {
      await api.completeInvestigation(id, form);
      setNotif({ message: 'Investigasi berhasil diselesaikan', type: 'success' });
      fetchData();
    } catch (err) { setNotif({ message: err.message, type: 'error' }); }
  };

  if (loading) return <div className="page loading"><div className="spinner" /><p>Memuat...</p></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!investigation) return <div className="page"><p>Investigasi tidak ditemukan</p></div>;

  const canComplete = investigation.status !== 'selesai' && ['pmkp', 'admin'].includes(user.role);
  const isCompleted = investigation.status === 'selesai';

  return (
    <div className="page">
      <div className="page-header">
        <h1>Detail Investigasi</h1>
        <Link to="/investigations" className="btn">← Kembali</Link>
      </div>

      <div className="detail-grid">
        <div className="card detail-main">
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value">{isCompleted ? '✅ Selesai' : '⏳ Berlangsung'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Tipe Investigasi</span>
            <span className="detail-value">{investigation.type}</span>
          </div>
          {incident && (
            <>
              <div className="detail-row">
                <span className="detail-label">Insiden Terkait</span>
                <span className="detail-value">{incident.incident_type} - {incident.description?.substring(0, 100)}</span>
              </div>
              <Link to={`/incidents/${incident.id}`} className="btn btn-sm">Lihat Insiden</Link>
            </>
          )}
        </div>

        <div className="card detail-sidebar">
          {isCompleted ? (
            <div className="alert alert-success">Investigasi sudah selesai</div>
          ) : (
            <div>
              <h3>Selesaikan Investigasi</h3>
              <div className="form-group">
                <label>Root Cause / Akar Masalah *</label>
                <textarea rows="4" value={form.root_cause}
                  onChange={e => setForm(f => ({ ...f, root_cause: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Rekomendasi *</label>
                <textarea rows="4" value={form.recommendations}
                  onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Faktor Kontributor</label>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: 6, padding: 8 }}>
                  {kontributorOptions.map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.faktor_kontributor.includes(opt)}
                        onChange={e => {
                          const next = e.target.checked
                            ? [...form.faktor_kontributor, opt]
                            : form.faktor_kontributor.filter(f => f !== opt);
                          setForm(f => ({ ...f, faktor_kontributor: next }));
                        }} />
                      <span style={{ fontSize: 13 }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Rencana Tindak Lanjut</label>
                <textarea rows="3" value={form.action_plan}
                  onChange={e => setForm(f => ({ ...f, action_plan: e.target.value }))} />
              </div>
              <div className="form-row" style={{ display: 'flex', gap: 8 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>PIC / Penanggung Jawab</label>
                  <input type="text" value={form.pic_name} placeholder="Nama"
                    onChange={e => setForm(f => ({ ...f, pic_name: e.target.value }))} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Jabatan PIC</label>
                  <input type="text" value={form.pic_role} placeholder="Jabatan"
                    onChange={e => setForm(f => ({ ...f, pic_role: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Tindak Lanjut Detail</label>
                <textarea rows="3" value={form.follow_up_actions}
                  onChange={e => setForm(f => ({ ...f, follow_up_actions: e.target.value }))} placeholder="Langkah-langkah tindak lanjut yang akan dilakukan" />
              </div>
              <div className="form-group">
                <label>Deadline Tindak Lanjut</label>
                <input type="date" value={form.follow_up_deadline}
                  onChange={e => setForm(f => ({ ...f, follow_up_deadline: e.target.value }))} />
              </div>
              <div className="form-group checkbox" style={{ margin: '8px 0' }}>
                <label>
                  <input type="checkbox" checked={form.management_review}
                    onChange={e => setForm(f => ({ ...f, management_review: e.target.checked }))} />
                  Manajemen Risiko sudah mereview
                </label>
              </div>
              {canComplete && (
                <button className="btn btn-primary btn-full" onClick={handleComplete}
                  disabled={!form.root_cause || !form.recommendations}>
                  Simpan & Selesaikan
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isCompleted && (
        <div className="card">
          <h3>Hasil Investigasi</h3>
          <div className="detail-section">
            <h4>Akar Masalah</h4>
            <p>{investigation.root_cause}</p>
          </div>
          <div className="detail-section">
            <h4>Rekomendasi</h4>
            <p>{investigation.recommendations}</p>
          </div>
          {investigation.action_plan && (
            <div className="detail-section">
              <h4>Rencana Tindak Lanjut</h4>
              <p>{investigation.action_plan}</p>
            </div>
          )}
          {investigation.faktor_kontributor && (
            <div className="detail-section">
              <h4>Faktor Kontributor</h4>
              <ul>{JSON.parse(investigation.faktor_kontributor).map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
          )}
          {investigation.pic_name && (
            <div className="detail-row">
              <span className="detail-label">PIC</span>
              <span className="detail-value">{investigation.pic_name}{investigation.pic_role ? ` (${investigation.pic_role})` : ''}</span>
            </div>
          )}
          {investigation.follow_up_deadline && (
            <div className="detail-row">
              <span className="detail-label">Deadline Tindak Lanjut</span>
              <span className="detail-value">{investigation.follow_up_deadline}</span>
            </div>
          )}
          {!!investigation.management_review && (
            <div className="detail-row">
              <span className="detail-label">Management Review</span>
              <span className="detail-value">Sudah direview</span>
            </div>
          )}
          {investigation.regrade_severity && (
            <div className="detail-row">
              <span className="detail-label">Grading Ulang</span>
              <span className="detail-value">{investigation.regrade_severity.toUpperCase()}</span>
            </div>
          )}
        </div>
      )}

      <NotificationModal message={notif.message} type={notif.type}
        onClose={() => setNotif({ message: '', type: '' })} />
    </div>
  );
}
