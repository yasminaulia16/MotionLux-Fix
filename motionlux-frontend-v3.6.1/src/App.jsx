import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LampControl from './pages/LampControl';
import Schedule from './pages/Schedule';
import SunriseSunset from './pages/SunriseSunset';
import MotionSensor from './pages/MotionSensor';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Shutdown from './pages/Shutdown';

function Protected() {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading MotionLux...</div>;
  if (!session) return <Login />;
  const isAdmin = profile?.role === 'admin';

  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          {isAdmin ? (
            <>
              {/* Admin: User Management + Shutdown Lamp (+ profil lewat Settings) */}
              <Route path="/users" element={<Users />} />
              <Route path="/shutdown" element={<Shutdown />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/users" replace />} />
            </>
          ) : (
            <>
              {/* User: kontrol lampu */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/lamps/:lampId" element={<LampControl />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/automation" element={<SunriseSunset />} />
              <Route path="/motion-sensor" element={<MotionSensor />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Route>
      </Routes>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Protected />
    </AuthProvider>
  );
}
