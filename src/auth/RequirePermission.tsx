import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { hasAnyPermission, type Permission } from './permissions';

interface RequirePermissionProps {
  permissions: Permission[];
}

export function RequirePermission({ permissions }: RequirePermissionProps) {
  const { user } = useAuth();

  if (!hasAnyPermission(user, permissions)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}
