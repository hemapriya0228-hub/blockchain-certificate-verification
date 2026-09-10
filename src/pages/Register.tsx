import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, User, ArrowRight, ShieldCheck, GraduationCap, Briefcase, Building2, Clock, Info } from 'lucide-react';
import { api } from '@/lib/supabase';
import { ButtonSpinner } from '@/components/Spinner';

type RoleChoice = 'admin' | 'teacher' | 'student';

const roleConfig: Record<RoleChoice, { icon: typeof ShieldCheck; label: string; desc: string }> = {
  admin: { icon: Building2, label: 'Admin', desc: 'Approve users & certificates' },
  teacher: { icon: Briefcase, label: 'Teacher', desc: 'Create certificate drafts' },
  student: { icon: GraduationCap, label: 'Student', desc: 'View your certificates' },
};

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RoleChoice>('teacher');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      toast.error('Password must contain uppercase, lowercase, number, and special character');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
      });

      if (res.requiresApproval || role !== 'admin') {
        toast.success('Registration submitted! An admin must approve your account before you can log in.');
      } else {
        toast.success('Account created! Please sign in.');
      }
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="glass-card p-8 glow-gold border border-gold-500/20">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 mb-6 hover:bg-gold-500/20 transition-all">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
              <span className="text-gold-400 text-xs font-medium tracking-wide">ACCOUNT REGISTRATION</span>
            </Link>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Create an Account</h1>
            <p className="text-slate-400 text-sm">
              Select your role. Teacher and Student accounts require Admin approval before login.
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <label className="block text-white text-sm font-semibold mb-3">Select Your Role</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(roleConfig) as RoleChoice[]).map((r) => {
                const cfg = roleConfig[r];
                const Icon = cfg.icon;
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      active
                        ? 'bg-gold-500/10 border-gold-500/40 text-gold-400 shadow-sm'
                        : 'bg-navy-800/40 border-gold-500/10 text-slate-400 hover:border-gold-500/20'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${active ? 'text-gold-400' : 'text-slate-500'}`} />
                    <p className={`text-sm font-medium ${active ? 'text-gold-400' : 'text-slate-300'}`}>{cfg.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{cfg.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Approval notice */}
            <div className="mt-3.5 p-3 rounded-xl bg-navy-800/60 border border-gold-500/15 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                {role === 'admin' ? (
                  <>Administrator registrations require review and authorization by the primary system administrator before access is granted.</>
                ) : (
                  <><strong>{role === 'teacher' ? 'Teacher' : 'Student'}</strong> accounts must wait for Admin approval before login works. Your account will appear in the Admin Dashboard for approval.</>
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-navy-800/60 border border-gold-500/20 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-white text-sm font-semibold mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@institution.edu"
                  className="w-full bg-navy-800/60 border border-gold-500/20 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                    className="w-full bg-navy-800/60 border border-gold-500/20 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:border-gold-500/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-navy-800/60 border border-gold-500/20 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:border-gold-500/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? <ButtonSpinner /> : <ArrowRight className="w-4 h-4" />}
              Submit Registration
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gold-500/10 text-center">
            <p className="text-slate-400 text-sm">
              Already have an approved account?{' '}
              <Link to="/login" className="text-gold-400 hover:text-gold-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/verify" className="text-slate-400 hover:text-gold-400 text-xs transition-colors">
              Employer? No registration needed — verify a certificate directly →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
