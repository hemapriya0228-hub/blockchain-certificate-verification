import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/api';
import AccessDenied from '@/pages/AccessDenied';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <AccessDenied requiredRoles={roles} userRole={user.role} />;
  }

  return <>{children}</>;
}

