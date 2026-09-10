import { Link } from 'react-router-dom';
import { ShieldQuestion, Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="glass-card max-w-lg w-full p-8 md:p-10 border border-gold-500/20 text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-6 text-gold-400 shadow-lg shadow-gold-500/10">
            <ShieldQuestion className="w-10 h-10" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/20 mb-3">
            ERROR 404
          </span>

          <h1 className="font-display text-3xl font-bold text-white mb-3">Page Not Found</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            The resource, verification record, or page you requested does not exist on the ChainCert network or has been relocated.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 transition-all"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>
            <Link
              to="/verify"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-navy-800/80 border border-gold-500/30 text-gold-300 text-xs font-semibold hover:bg-navy-700/80 hover:text-white transition-all"
            >
              <Search className="w-4 h-4" />
              Verify Certificate
            </Link>
          </div>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go back to previous page
          </button>
        </div>
      </div>
    </div>
  );
}
