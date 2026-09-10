import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  FileText,
  FilePlus,
  Hash,
  Link2,
  Lock,
  ArrowRight,
  Boxes,
  Search,
  LogIn,
  TrendingUp,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { api, type StatsResponse } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/Spinner';

export default function Landing() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ============================================================
          PUBLIC HEADER (Visible on Landing when not logged in)
         ============================================================ */}
      {!user && (
        <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-navy-900/80 border-b border-gold-500/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <ShieldCheck className="w-7 h-7 text-gold-500 transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-gold-500/20 blur-lg -z-10" />
              </div>
              <span className="font-display font-bold text-lg text-white tracking-tight">
                Chain<span className="text-gradient-gold">Cert</span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/verify"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-navy-800/60 transition-all"
              >
                <Search className="w-4 h-4 text-gold-400" />
                Verify
              </Link>
              <Link
                to="/ledger"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-navy-800/60 transition-all"
              >
                <Boxes className="w-4 h-4 text-gold-400" />
                Ledger
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 shadow-md shadow-gold-500/15 hover:shadow-gold-500/30 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* ============================================================
          HERO SECTION
         ============================================================ */}
      <section className="relative overflow-hidden pt-24 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20" style={{
          backgroundImage: `linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 mb-8">
              <Lock className="w-3.5 h-3.5 text-gold-400" />
              <span className="text-gold-400 text-xs font-medium tracking-wide">
                SHA-256 HASH-CHAINED VERIFICATION
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
              Verify any certificate
              <br />
              with <span className="text-gradient-gold">blockchain trust</span>
            </h1>

            <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Only the SHA-256 hash of each certificate is stored on-chain — not the file itself.
              Verification is instant, tamper-evident, and cryptographically guaranteed.
            </p>

            {/* CTAs strictly as specified: Login & Verify a Certificate */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  to={`/${user.role}/dashboard`}
                  className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all duration-300 hover:scale-[1.02]"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all duration-300 hover:scale-[1.02]"
                >
                  <LogIn className="w-4 h-4" />
                  Login to Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <Link
                to="/verify"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-navy-800/80 border border-gold-500/25 text-white font-semibold text-sm hover:border-gold-500/50 hover:bg-navy-700/60 transition-all duration-300"
              >
                <Search className="w-4 h-4 text-gold-400" />
                Verify a Certificate
              </Link>
            </div>
          </motion.div>

          {/* Hero visual — chain illustration */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 max-w-5xl mx-auto"
          >
            <div className="glass-card p-6 sm:p-10 glow-gold">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <ChainStep
                  icon={FileText}
                  label="Certificate"
                  sublabel="PDF / Image"
                  color="text-slate-300"
                />
                <ChainArrow />
                <ChainStep
                  icon={Hash}
                  label="SHA-256 Hash"
                  sublabel="Cryptographic fingerprint"
                  color="text-gold-400"
                />
                <ChainArrow />
                <ChainStep
                  icon={Layers}
                  label="Stored On Chain"
                  sublabel="Hash-chained block"
                  color="text-gold-500"
                />
                <ChainArrow />
                <ChainStep
                  icon={ShieldCheck}
                  label="Verify"
                  sublabel="Re-hash & compare"
                  color="text-green-400"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          LIVE STATS STRIP
         ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="text-gold-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={FilePlus} label="Certificates Issued" value={stats?.totalIssued ?? 0} />
              <StatCard icon={ShieldCheck} label="Verified" value={stats?.totalVerified ?? 0} color="text-green-400" />
              <StatCard icon={Boxes} label="Blocks on Chain" value={stats?.totalBlocks ?? 0} />
              <StatCard icon={ShieldAlert} label="Tamper Flags" value={stats?.totalTampered ?? 0} color="text-red-400" />
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS — 3 STEPS
         ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Three steps from issuance to verification. Cryptographic proof in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <StepCard
              step="01"
              icon={FilePlus}
              title="Issue Certificate"
              description="Upload a certificate file and fill in the details. The system computes a SHA-256 hash and creates a new block on the chain."
            />
            <StepCard
              step="02"
              icon={Link2}
              title="Hash Stored On-Chain"
              description="The certificate hash is linked to the previous block, forming a tamper-evident chain. Only the hash is stored — the file stays private."
            />
            <StepCard
              step="03"
              icon={ShieldCheck}
              title="Verify Anytime"
              description="Re-upload the certificate or enter its ID. The system re-hashes and compares against the on-chain record for instant proof."
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          ARCHITECTURE DIAGRAM
         ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Architecture
            </h2>
            <p className="text-slate-400 text-lg">
              Off-chain storage for data, on-chain storage for trust.
            </p>
          </div>

          <div className="glass-card p-6 sm:p-10">
            <div className="space-y-6">
              {/* Layer 1: Certificate */}
              <ArchRow
                badge="1"
                title="Certificate File (Off-Chain)"
                description="PDF or image stored securely in the database"
                icon={FileText}
              />
              <ArchConnector />
              {/* Layer 2: Hash */}
              <ArchRow
                badge="2"
                title="SHA-256 Hash"
                description="Cryptographic fingerprint computed from file content"
                icon={Hash}
                highlight
              />
              <ArchConnector />
              {/* Layer 3: Blockchain */}
              <ArchRow
                badge="3"
                title="Blockchain (On-Chain)"
                description="Hash-chained blocks: each block links to the previous via SHA-256"
                icon={Layers}
              />
              <ArchConnector />
              {/* Layer 4: Verification */}
              <ArchRow
                badge="4"
                title="Verification"
                description="Re-hash uploaded file → compare to on-chain hash → match = valid"
                icon={ShieldCheck}
                highlight
              />
            </div>
          </div>

          {/* Simulated blockchain note */}
          <div className="mt-6 p-4 rounded-xl bg-navy-800/40 border border-gold-500/10">
            <p className="text-slate-500 text-xs leading-relaxed">
              <span className="text-gold-500 font-semibold">Note:</span> This system uses a simulated
              blockchain (hash-chained JSON store) for demonstration. To deploy on Ethereum/Polygon,
              replace the blocks table with a Solidity contract that stores{' '}
              <code className="text-gold-400">mapping(string =&gt; bytes32)</code> and interact via ethers.js.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
         ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card p-10 sm:p-14 glow-gold"
          >
            <ShieldCheck className="w-10 h-10 text-gold-500 mx-auto mb-6" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
              Cryptographic Trust for Every Certificate
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Verify credentials instantly without login, or sign in to issue and manage verifiable academic credentials.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/verify"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all duration-300 hover:scale-[1.02]"
              >
                <Search className="w-4 h-4" />
                Verify a Certificate
                <ArrowRight className="w-4 h-4" />
              </Link>
              {user ? (
                <Link
                  to={`/${user.role}/dashboard`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-navy-800/80 border border-gold-500/25 text-white font-semibold text-sm hover:border-gold-500/50 hover:bg-navy-700/60 transition-all duration-300"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-navy-800/80 border border-gold-500/25 text-white font-semibold text-sm hover:border-gold-500/50 hover:bg-navy-700/60 transition-all duration-300"
                >
                  <LogIn className="w-4 h-4 text-gold-400" />
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// --- Helper components ---

function ChainStep({
  icon: Icon,
  label,
  sublabel,
  color,
}: {
  icon: any;
  label: string;
  sublabel: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 shrink-0">
      <div className={`w-16 h-16 rounded-2xl bg-navy-800/80 border border-gold-500/15 flex items-center justify-center ${color}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-white text-sm font-semibold">{label}</p>
        <p className="text-slate-500 text-xs">{sublabel}</p>
      </div>
    </div>
  );
}

function ChainArrow() {
  return (
    <div className="flex items-center justify-center">
      <ArrowRight className="w-5 h-5 text-gold-500/40 rotate-90 lg:rotate-0" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = 'text-gold-400',
}: {
  icon: any;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="glass-card-hover p-5 text-center">
      <Icon className={`w-6 h-6 ${color} mx-auto mb-3`} />
      <p className="font-display text-2xl sm:text-3xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-slate-500 text-xs mt-1">{label}</p>
    </div>
  );
}

function StepCard({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: string;
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass-card-hover p-8 relative overflow-hidden group"
    >
      <div className="absolute top-4 right-4 font-display text-5xl font-bold text-gold-500/5 group-hover:text-gold-500/10 transition-colors">
        {step}
      </div>
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-5">
          <Icon className="w-6 h-6 text-gold-400" />
        </div>
        <h3 className="font-display text-lg font-semibold text-white mb-3">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function ArchRow({
  badge,
  title,
  description,
  icon: Icon,
  highlight,
}: {
  badge: string;
  title: string;
  description: string;
  icon: any;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl ${highlight ? 'bg-gold-500/5 border border-gold-500/20' : 'bg-navy-800/40 border border-gold-500/5'}`}>
      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm ${highlight ? 'bg-gold-500/20 text-gold-400' : 'bg-navy-700 text-slate-400'}`}>
        {badge}
      </div>
      <div className="shrink-0">
        <Icon className={`w-5 h-5 ${highlight ? 'text-gold-400' : 'text-slate-400'}`} />
      </div>
      <div>
        <h4 className="text-white text-sm font-semibold">{title}</h4>
        <p className="text-slate-500 text-xs">{description}</p>
      </div>
    </div>
  );
}

function ArchConnector() {
  return (
    <div className="flex justify-center">
      <div className="w-px h-6 bg-gradient-to-b from-gold-500/30 to-gold-500/10" />
    </div>
  );
}
