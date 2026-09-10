import { ShieldCheck, Github, Linkedin, Twitter, Sparkles, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemMonitor } from './SystemMonitor';

export default function Footer() {
  return (
    <footer className="border-t border-gold-500/10 bg-navy-950/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-6 h-6 text-gold-500" />
              <span className="font-display font-bold text-lg text-white">
                Chain<span className="text-gradient-gold">Cert</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed mb-4">
              Decentralized academic and professional certificate verification infrastructure.
              Zero personal data is stored on-chain — SHA-256 cryptographic digests ensure instant mathematical authenticity.
            </p>
            <div className="mt-4">
              <SystemMonitor />
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/verify" className="text-slate-400 hover:text-gold-400 transition-colors">Verify Certificate</Link></li>
              <li><Link to="/ledger" className="text-slate-400 hover:text-gold-400 transition-colors">Public Ledger</Link></li>
              <li><Link to="/store-showcase" className="text-slate-400 hover:text-gold-400 transition-colors flex items-center gap-1"><Sparkles className="w-3 h-3 text-gold-400" /> Store Showcase</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">Support & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/support" className="text-slate-400 hover:text-gold-400 transition-colors">Help Center & FAQs</Link></li>
              <li><Link to="/status" className="text-slate-400 hover:text-gold-400 transition-colors flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" /> System Uptime</Link></li>
              <li><Link to="/privacy-policy" className="text-slate-400 hover:text-gold-400 transition-colors">Privacy Policy (GDPR)</Link></li>
              <li><Link to="/terms" className="text-slate-400 hover:text-gold-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">Connect</h4>
            <div className="flex gap-2.5 mb-4">
              <a href="#" className="w-9 h-9 rounded-xl bg-navy-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-gold-400 hover:border-gold-500/40 transition-all">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-navy-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-gold-400 hover:border-gold-500/40 transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-navy-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-gold-400 hover:border-gold-500/40 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Standard SHA-256 hash chains • Tamper-evident blocks
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © 2026 ChainCert Systems. Cryptographically signed and verified. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link to="/privacy-policy" className="hover:text-slate-400">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-400">Terms</Link>
            <span>•</span>
            <Link to="/support" className="hover:text-slate-400">Support Desk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
