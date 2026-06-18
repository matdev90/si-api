import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import NotificationModal from '../components/NotificationModal';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({ message: '', type: '' });
  const { user, checkPasswordChange } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotif({ message: '', type: '' });
    if (!oldPassword || !newPassword || !confirmPassword) {
      setNotif({ message: 'Semua field wajib diisi', type: 'error' }); return;
    }
    if (newPassword.length < 4) {
      setNotif({ message: 'Password baru minimal 4 karakter', type: 'error' }); return;
    }
    if (newPassword !== confirmPassword) {
      setNotif({ message: 'Konfirmasi password tidak cocok', type: 'error' }); return;
    }
    if (oldPassword === newPassword) {
      setNotif({ message: 'Password baru tidak boleh sama dengan password lama', type: 'error' }); return;
    }
    setLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setNotif({ message: 'Password berhasil diubah', type: 'success' });
      checkPasswordChange();
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setNotif({ message: err.message, type: 'error' });
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

      <NotificationModal message={notif.message} type={notif.type}
        onClose={() => setNotif({ message: '', type: '' })} />
    </div>
  );
}
