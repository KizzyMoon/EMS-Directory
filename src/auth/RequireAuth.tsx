import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RequireAuth() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <main className="auth-screen"><div className="auth-panel glass-card"><p className="eyebrow">EMS Directory</p><h1>Checking access</h1><p>Verifying your secure session.</p></div></main>;
  }

  if (status === 'unconfigured') {
    return <Outlet />;
  }

  if (status === 'unauthorised') {
    return <Navigate to="/access-denied" replace />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
