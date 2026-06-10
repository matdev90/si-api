import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function InvestigationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [investigation, setInvestigation] = useState(null);
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ root_cause: '', recommendations: '', action_plan: '' });

  const fetchData = () => {
    setLoading(true);
    api.getInvestigation(id).then(async data => {
      setInvestigation(data);
      setForm({
        root_cause: data.root_cause || '',
        recommendations: data.recommendations || '',
        action_plan: data.action_plan || '',
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
      fetchData();
    } catch (err) { setError(err.message); }
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
                <label>Rencana Tindak Lanjut</label>
                <textarea rows="3" value={form.action_plan}
                  onChange={e => setForm(f => ({ ...f, action_plan: e.target.value }))} />
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
        </div>
      )}
    </div>
  );
}
