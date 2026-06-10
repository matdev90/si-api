import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, checkPasswordChange } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Semua field wajib diisi'); return;
    }
    if (newPassword.length < 4) {
      setError('Password baru minimal 4 karakter'); return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok'); return;
    }
    if (oldPassword === newPassword) {
      setError('Password baru tidak boleh sama dengan password lama'); return;
    }
    setLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setSuccess('Password berhasil diubah');
      checkPasswordChange();
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Ganti Password</h1>
        <p className="subtitle">{user?.name}</p>
      </div>
      <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <div className="form-group">
            <label>Password Saat Ini</label>
            <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label>Password Baru</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Konfirmasi Password Baru</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
