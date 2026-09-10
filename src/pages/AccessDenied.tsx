import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/supabase';
import { ShieldAlert, LogOut, LayoutDashboard, Home, ArrowLeft } from 'lucide-react';

interface AccessDeniedProps {
  requiredRoles?: UserRole[];
  userRole?: UserRole;
}

export default function AccessDenied({ requiredRoles, userRole }: AccessDeniedProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const currentRole = userRole || user?.role;

  const getDashboardPath = () => {
    if (!currentRole) return '/';
    if (currentRole === 'admin') return '/admin/dashboard';
    if (currentRole === 'teacher') return '/teacher/dashboard';
    if (currentRole === 'student') return '/student/dashboard';
    return '/';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="glass-card max-w-lg w-full p-8 md:p-10 border border-red-500/30 text-center shadow-2xl relative overflow-hidden">
        {/* Neon warning glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6 text-red-400 shadow-lg shadow-red-500/10">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 mb-3">
            ERROR 403 — FORBIDDEN
          </span>

          <h1 className="font-display text-3xl font-bold text-white mb-3">Access Restricted</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            You do not possess the required authorization level to view or perform operations on this route.
          </p>

          {/* User & Role Details */}
          <div className="bg-navy-950/70 border border-red-500/20 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Authenticated Account:</span>
              <span className="text-slate-200 font-medium truncate max-w-[200px]">
                {user?.email || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Your Current Role:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-navy-800 text-gold-400 border border-gold-500/20">
                {currentRole || 'Guest'}
              </span>
            </div>
            {requiredRoles && requiredRoles.length > 0 && (
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-400">Required Role:</span>
                <div className="flex gap-1">
                  {requiredRoles.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Link
              to={getDashboardPath()}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              My Dashboard
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-800/80 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/10 hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" />
              Switch Account
            </button>
          </div>

          <div className="flex justify-center gap-4 text-xs text-slate-400">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go Back
            </button>
            <span>•</span>
            <Link to="/" className="inline-flex items-center gap-1 hover:text-gold-400 transition-colors">
              <Home className="w-3.5 h-3.5" />
              Public Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
