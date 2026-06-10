import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Username dan password wajib diisi'); return; }
    setLoading(true);
    try {
      const res = await api.login(username, password);
      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="SI-API" className="login-logo" />
          <h1>SI-API</h1>
          <p>Sistem Informasi Analisa Pelaporan Insiden</p>
          <p className="sub">RSUD dr. R. Soedjono Selong</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Memuat...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
