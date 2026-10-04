import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Building2, Mail, Lock, MapPin, Globe, FileText, ArrowRight, ShieldCheck, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { ButtonSpinner } from '@/components/Spinner';

export default function InstitutionRegister() {
  const navigate = useNavigate();
  const [institutionName, setInstitutionName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('India');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!institutionName.trim()) {
      toast.error('Institution Name is required');
      return;
    }
    if (!email.trim()) {
      toast.error('Official Email is required');
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

    // Timeout safety net (15s) to guarantee loading state never hangs indefinitely
    const timeoutId = setTimeout(() => {
      setLoading(false);
      toast.error('Registration request timed out. Please try again.');
    }, 15000);

    try {
      const res = await api.registerInstitution({
        institutionName: institutionName.trim(),
        email: email.trim(),
        description: description.trim(),
        location: location.trim(),
        country,
        password,
      });

      clearTimeout(timeoutId);
      toast.success(res.message || 'Institution registered successfully! You can sign in now.');
      navigate('/login');
    } catch (err: any) {
      clearTimeout(timeoutId);
      toast.error(err.message || 'Unable to create institution account. Please try again.');
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
        className="w-full max-w-xl"
      >
        <div className="glass-card p-8 glow-gold border border-gold-500/20">
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 mb-6 hover:bg-gold-500/20 transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-gold-400" />
              <span className="text-gold-400 text-xs font-medium tracking-wide">INSTITUTION ONBOARDING</span>
            </Link>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Institution Registration</h1>
            <p className="text-slate-400 text-sm">
              Register an institution profile with your location, description, and issuing identity on ChainCert.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Institution Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Institution Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-navy-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Official Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@institution.edu"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-navy-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description / Details</label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your institution..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-navy-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500/50 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* City / State */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">City / State</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Cambridge, MA"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-navy-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Country</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-navy-950/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-gold-500/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-navy-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-navy-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? <ButtonSpinner /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Processing...' : 'Create Account'}
              </button>

              <Link
                to="/verify"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-gold-500/10 border border-gold-500/25 text-gold-300 hover:text-gold-200 hover:bg-gold-500/20 text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5" />
                Public Verification
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-gold-500/10 text-center">
            <p className="text-slate-400 text-sm">
              Already registered as an institution?{' '}
              <Link to="/login" className="text-gold-400 hover:text-gold-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
