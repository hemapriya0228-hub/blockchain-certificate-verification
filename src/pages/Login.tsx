import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight, ShieldCheck, Clock, KeyRound, Sparkles, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ButtonSpinner } from '@/components/Spinner';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingError(null);

    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.fullName}!`);

      // Auto-redirect strictly by role as specified
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        default:
          navigate('/verify');
      }
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      if (msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('approval') || msg.toLowerCase().includes('rejected')) {
        setPendingError(
          msg.toLowerCase().includes('rejected')
            ? 'Your registration has not yet been approved by the Administrator. Please contact your Admin or wait for review.'
            : 'Your account is pending Administrator approval. Once an Admin approves your account, you will be able to log in.'
        );
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setPendingError(null);
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 glow-gold border border-gold-500/20">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 mb-6 hover:bg-gold-500/20 transition-all">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
              <span className="text-gold-400 text-xs font-medium tracking-wide">CHAINCERT AUTHENTICATION</span>
            </Link>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-400 text-sm">
              Sign in to access your role dashboard.
            </p>
          </div>

          {/* Quick Credential Pre-fill for Development Testing Only */}
          {import.meta.env.DEV && (
            <div className="mb-6 p-3 rounded-xl bg-navy-800/60 border border-gold-500/15">
              <div className="flex items-center gap-1.5 text-xs text-gold-400 font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dev Quick Sign-In</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => fillCredentials('hema.work0728@gmail.com', 'Hema')}
                  className="px-2 py-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 font-medium border border-gold-500/20 transition-all text-center"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('testteacher@chaincert.io', 'Password123!')}
                  className="px-2 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-medium border border-blue-500/20 transition-all text-center"
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('teststudent@chaincert.io', 'Password123!')}
                  className="px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/20 transition-all text-center"
                >
                  Student
                </button>
              </div>
            </div>
          )}

          {/* Pending Approval Notice if blocked */}
          {pendingError && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-left animate-fade-in">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-300 mb-1">Awaiting Admin Approval</p>
                <p className="text-xs text-slate-300 leading-relaxed">{pendingError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-navy-800/60 border border-gold-500/20 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-white text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-navy-800/60 border border-gold-500/20 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:border-gold-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? <ButtonSpinner /> : <ArrowRight className="w-4 h-4" />}
              Sign In
            </button>
          </form>

          {/* Public Verification Link for Employers / Public */}
          <div className="mt-6 pt-5 border-t border-gold-500/15">
            <div className="p-4 rounded-xl bg-gradient-to-r from-gold-500/10 via-navy-800/80 to-gold-500/5 border border-gold-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg shadow-gold-500/5">
              <div>
                <p className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <Search className="w-3.5 h-3.5 text-gold-400" />
                  Just verifying a certificate? No login needed →
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Employers and third parties can verify credentials directly on-chain.
                </p>
              </div>
              <Link
                to="/verify"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-500/15 border border-gold-500/30 text-gold-300 hover:text-gold-200 hover:bg-gold-500/25 text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5" />
                Verify a Certificate
              </Link>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-gold-400 hover:text-gold-300 font-semibold transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
