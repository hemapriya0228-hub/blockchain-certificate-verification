import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Building2,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  Briefcase,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { api, type VerifyResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime, truncateHash } from '@/lib/utils';
import HashDisplay from '@/components/HashDisplay';
import ResultCard from '@/components/ResultCard';
import { FullPageSpinner, ButtonSpinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [candidateEmail, setCandidateEmail] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState<VerifyResponse | null>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVerifications = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.employerGetVerifications();
      setVerifications(res.verifications || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load verification history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleVerifyCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateId.trim()) {
      toast.error('Please enter a Certificate ID');
      return;
    }

    setLoading(true);
    setVerificationResult(null);

    try {
      const res = await api.employerVerifyCandidate(candidateEmail.trim(), certificateId.trim());
      setVerificationResult(res);
      if (res.result === 'valid') {
        toast.success('Candidate Certificate Authenticated Successfully!');
      } else if (res.result === 'revoked') {
        toast.error('Warning: Candidate Certificate Has Been Revoked');
      } else if (res.result === 'not_found') {
        toast.error('Certificate ID Not Found');
      } else {
        toast.error('Warning: Certificate Hash Mismatch or Tampered');
      }
      fetchVerifications();
    } catch (err: any) {
      toast.error(err.message || 'Verification request failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = verifications.filter(
    (v) =>
      (v.certificate_id && v.certificate_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.candidate_email && v.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Building2 className="w-3.5 h-3.5" />
              Employer Verification Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome, {user?.fullName || 'Employer Partner'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Verify candidate credentials against on-chain cryptographic signatures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchVerifications}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              Refresh History
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Verification Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Verification Form (Left Column - 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 border border-slate-700/60">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-400" />
              Verify Candidate Credentials
            </h2>

            <form onSubmit={handleVerifyCandidate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Candidate Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="candidate@company.com"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Certificate ID <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CERT-XXXX-XXXX"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <ButtonSpinner />
                    Verifying On-Chain...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify Credential Now
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Verification Result Card */}
          {verificationResult && (
            <ResultCard
              result={verificationResult.result}
              certificate={verificationResult.certificate}
              block={verificationResult.block}
              certificateId={verificationResult.certificateId}
            />
          )}
        </div>

        {/* Verification History (Right Column - 7 cols) */}
        <div className="lg:col-span-7">
          <div className="glass-card p-6 border border-slate-700/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  Candidate Audit History
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recent candidate verification queries by your organisation.
                </p>
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {historyLoading ? (
              <div className="py-12 flex justify-center">
                <FullPageSpinner />
              </div>
            ) : filteredHistory.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No Verification History"
                description="Enter a Certificate ID on the left to verify candidate qualifications."
              />
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-3">Certificate ID</th>
                      <th className="py-3 px-3">Candidate Email</th>
                      <th className="py-3 px-3">Verified Date</th>
                      <th className="py-3 px-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-white">
                          {item.certificate_id}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {item.candidate_email || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {formatDateTime(item.created_at)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              item.result === 'valid'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : item.result === 'revoked'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {item.result === 'valid' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : item.result === 'revoked' ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {item.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
