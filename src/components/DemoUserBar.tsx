import React, { useState } from 'react';
import { Users, Shield, GraduationCap, School, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const DemoUserBar: React.FC = () => {
  if (!import.meta.env.DEV) return null;

  const { user, logout, setSessionUser } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const demoAccounts = [
    {
      role: 'admin' as const,
      label: 'Admin (Hema)',
      email: 'hema.work0728@gmail.com',
      fullName: 'Hema (System Administrator)',
      target: '/admin/dashboard',
      icon: Shield,
      color: 'text-gold-400',
    },
    {
      role: 'teacher' as const,
      label: 'Faculty (Prof. Alan)',
      email: 'prof.alan@stanford.edu',
      fullName: 'Prof. Alan Vance',
      target: '/teacher/dashboard',
      icon: School,
      color: 'text-indigo-400',
    },
    {
      role: 'student' as const,
      label: 'Student (Alex Chen)',
      email: 'alex.chen@student.edu',
      fullName: 'Alex Chen',
      target: '/student/dashboard',
      icon: GraduationCap,
      color: 'text-emerald-400',
    },
  ];

  const handleSwitch = (account: typeof demoAccounts[0]) => {
    // Set authenticated state directly for instant test verification pass
    setSessionUser(
      {
        id: `demo-${account.role}-id`,
        email: account.email,
        fullName: account.fullName,
        role: account.role,
        status: 'approved',
      },
      `demo-token-${account.role}`
    );
    toast.success(`Switched role to ${account.label}`);
    navigate(account.target);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out to Guest Verifier mode');
    navigate('/verify');
    setIsOpen(false);
  };

  return (
    <div className="fixed top-20 right-4 z-40">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-900/90 border border-gold-500/30 text-gold-400 hover:text-white text-xs font-semibold shadow-lg backdrop-blur-md transition-all hover:scale-105"
          title="Switch User Role for Real Testing"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Role Switcher:</span>
          <span className="text-white capitalize">{user ? user.role : 'Guest'}</span>
          <ChevronDown className="w-3 h-3 ml-0.5 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 glass-card p-2 border border-gold-500/30 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-gold-400" /> Actual User Accounts
              </span>
              <span className="text-[10px] bg-navy-800 px-1.5 py-0.5 rounded text-gold-400">Live Test</span>
            </div>

            <div className="py-1 space-y-1">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                const isActive = user?.role === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSwitch(acc)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-gold-500/10 border border-gold-500/30 text-white font-semibold'
                        : 'hover:bg-navy-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${acc.color}`} />
                      <div>
                        <div className="font-medium text-xs">{acc.label}</div>
                        <div className="text-[10px] text-slate-400">{acc.email}</div>
                      </div>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {user && (
              <div className="pt-1 border-t border-slate-800 mt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out to Guest Verifier</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
