import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Boxes,
  Search,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Trash2,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/api';
import { SystemMonitor } from './SystemMonitor';

interface NavItem {
  label: string;
  path: string;
  icon: any;
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNavLinks = (role?: UserRole): NavItem[] => {
    if (!role) {
      return [
        { label: 'Verify', path: '/verify', icon: Search },
        { label: 'Ledger', path: '/ledger', icon: Boxes },
        { label: 'Status', path: '/status', icon: Activity },
        { label: 'Support', path: '/support', icon: HelpCircle },
      ];
    }

    switch (role) {
      case 'admin':
        return [
          { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Ledger', path: '/ledger', icon: Boxes },
          { label: 'Verify', path: '/verify', icon: Search },
          { label: 'Status', path: '/status', icon: Activity },
        ];
      case 'teacher':
        return [
          { label: 'Teacher Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
          { label: 'Ledger', path: '/ledger', icon: Boxes },
          { label: 'Verify', path: '/verify', icon: Search },
        ];
      case 'student':
        return [
          { label: 'My Certificates', path: '/student/dashboard', icon: GraduationCap },
          { label: 'Verify', path: '/verify', icon: Search },
        ];
      case 'employer':
        return [
          { label: 'Employer Portal', path: '/employer/dashboard', icon: GraduationCap },
          { label: 'Verify', path: '/verify', icon: Search },
          { label: 'Ledger', path: '/ledger', icon: Boxes },
        ];
      default:
        return [
          { label: 'Verify', path: '/verify', icon: Search },
          { label: 'Ledger', path: '/ledger', icon: Boxes },
        ];
    }
  };

  const navLinks = getNavLinks(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
    setProfileOpen(false);
  };

  const openOnboarding = () => {
    window.dispatchEvent(new CustomEvent('chaincert:open-onboarding'));
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const openDeleteAccount = () => {
    window.dispatchEvent(new CustomEvent('chaincert:open-delete-account'));
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-gold-500/15 text-gold-400 border-gold-500/30';
      case 'teacher':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'student':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'employer':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-navy-900/85 border-b border-gold-500/15 shadow-lg shadow-navy-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to={user ? `/${user.role}/dashboard` : '/'}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative">
              <ShieldCheck className="w-7 h-7 text-gold-500 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gold-500/20 blur-lg -z-10" />
            </div>
            <span className="font-display font-bold text-lg text-white tracking-tight">
              Chain<span className="text-gradient-gold">Cert</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'text-gold-400 bg-gold-500/10 border border-gold-500/20 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-gold-400/80" />
                  {link.label}
                </Link>
              );
            })}

            {/* Public vs Auth Actions */}
            {!user ? (
              <div className="flex items-center gap-2.5 ml-3 pl-3 border-l border-slate-800">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-navy-800 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold text-xs shadow-md shadow-gold-500/20 hover:shadow-gold-500/40 transition-all"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-3 pl-3 border-l border-gold-500/15" ref={profileRef}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-800/90 border border-slate-700 hover:border-gold-500/40 transition-all text-xs"
                  >
                    <span className="font-semibold text-white max-w-[120px] truncate">
                      {user.fullName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getRoleBadgeStyle(user.role)}`}>
                      {user.role}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Profile & Settings Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-card p-1.5 border border-gold-500/30 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                      <div className="px-3 py-2 border-b border-slate-800 text-[11px]">
                        <div className="font-medium text-white truncate">{user.fullName}</div>
                        <div className="text-slate-400 truncate">{user.email}</div>
                      </div>

                      <div className="py-1 text-xs space-y-0.5">
                        <button
                          type="button"
                          onClick={openOnboarding}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-navy-800 flex items-center gap-2 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                          <span>Product Tour</span>
                        </button>

                        <button
                          type="button"
                          onClick={openDeleteAccount}
                          className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Account</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-navy-800 flex items-center gap-2 transition-all"
                        >
                          <LogOut className="w-3.5 h-3.5 text-slate-400" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-slate-300 hover:text-white p-2 rounded-xl hover:bg-navy-800 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 flex flex-col gap-1.5 border-t border-gold-500/10 animate-fade-in">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'text-gold-400 bg-gold-500/10 border border-gold-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-gold-400" />
                  {link.label}
                </Link>
              );
            })}

            {user ? (
              <div className="pt-3 mt-2 border-t border-gold-500/10 space-y-2 px-2">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <p className="text-xs font-bold text-white">{user.fullName}</p>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getRoleBadgeStyle(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={openDeleteAccount}
                    className="w-full px-3 py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-[11px] text-red-300 hover:bg-red-900/40 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-slate-800 px-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-navy-800 text-xs font-semibold text-white border border-slate-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 text-xs font-bold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
