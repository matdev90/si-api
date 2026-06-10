import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentCreate from './pages/IncidentCreate';
import IncidentDetail from './pages/IncidentDetail';
import Investigations from './pages/Investigations';
import InvestigationDetail from './pages/InvestigationDetail';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/incidents" element={<ProtectedRoute><Layout><Incidents /></Layout></ProtectedRoute>} />
          <Route path="/incidents/new" element={<ProtectedRoute roles={['pelapor']}><Layout><IncidentCreate /></Layout></ProtectedRoute>} />
          <Route path="/incidents/:id" element={<ProtectedRoute><Layout><IncidentDetail /></Layout></ProtectedRoute>} />
          <Route path="/investigations" element={<ProtectedRoute roles={['validator', 'pmkp', 'admin']}><Layout><Investigations /></Layout></ProtectedRoute>} />
          <Route path="/investigations/:id" element={<ProtectedRoute roles={['validator', 'pmkp', 'admin']}><Layout><InvestigationDetail /></Layout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
