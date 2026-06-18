import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

function getLogo() {
  const path = localStorage.getItem('si_api_logo');
  return path || '/logo.svg';
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState(getLogo);
  const [hospitalName, setHospitalName] = useState('RSUD dr. R. Soedjono Selong');
  const [appName, setAppName] = useState('SI-API');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedLogo = localStorage.getItem('si_api_logo');
    if (savedLogo) {
      const link = document.querySelector('link[rel*="icon"]');
      if (link) link.href = savedLogo;
    }

    fetch('/api/v1/settings/public')
      .then(r => r.json())
      .then(s => {
        if (s.hospital_logo) {
          setLogo(s.hospital_logo);
          localStorage.setItem('si_api_logo', s.hospital_logo);
          const link = document.querySelector('link[rel*="icon"]');
          if (link) link.href = s.hospital_logo;
        }
        if (s.hospital_name) setHospitalName(s.hospital_name);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Username dan password wajib diisi'); return; }
    setLoading(true);
    const start = Date.now();
    try {
      const res = await api.login(username, password);
      const elapsed = Date.now() - start;
      if (elapsed < 2500) await new Promise(r => setTimeout(r, 2500 - elapsed));
      login(res.token, res.user, res.mustChangePassword);
      navigate('/dashboard');
    } catch (err) {
      const elapsed = Date.now() - start;
      if (elapsed < 2500) await new Promise(r => setTimeout(r, 2500 - elapsed));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt={appName} className="login-logo" />
          <h1>{appName}</h1>
          <p>Sistem Informasi Analisa Pelaporan Insiden</p>
          <p className="sub">{hospitalName}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} autoFocus disabled={loading} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="login-loading-overlay">
          <div className="login-loading-3d">
            <div className="ld-orbit">
              <div className="ld-ring-orbit ld-ring-orbit-1"></div>
              <div className="ld-ring-orbit ld-ring-orbit-2"></div>
              <div className="ld-ring-orbit ld-ring-orbit-3"></div>
              <div className="ld-ring-orbit ld-ring-orbit-4"></div>
              <div className="ld-ring-orbit ld-ring-orbit-5"></div>
              <div className="ld-circle-logo">
                <img src={logo} alt="" />
              </div>
            </div>
            <div className="ld-text">Memverifikasi</div>
            <div className="ld-dots">
              <span className="ld-dot"></span>
              <span className="ld-dot"></span>
              <span className="ld-dot"></span>
            </div>
          </div>
          <div className="ld-particles">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="ld-particle" style={{
                '--x': `${Math.random() * 100}%`,
                '--y': `${Math.random() * 100}%`,
                '--s': `${0.3 + Math.random() * 0.7}`,
                '--d': `${Math.random() * 3}s`,
                '--r': `${Math.random() * 360}deg`,
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
