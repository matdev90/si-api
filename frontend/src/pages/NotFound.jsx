import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page not-found">
      <h1>404</h1>
      <p>Halaman tidak ditemukan</p>
      <Link to="/dashboard" className="btn btn-primary">Kembali ke Dashboard</Link>
    </div>
  );
}
