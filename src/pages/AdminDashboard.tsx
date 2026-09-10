import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Boxes,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  FilePlus,
  TrendingUp,
  Activity,
  ChevronRight,
  GraduationCap,
  Building2,
  Calendar,
  AlertTriangle,
  Search,
  ExternalLink,
  MessageSquare,
  X,
  Trash2,
  Ban,
} from 'lucide-react';
import { api, type UserProfile, type CertificateDraft, type StatsResponse, type Certificate, type BlockData } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDate, formatDateTime, formatFileSize } from '@/lib/utils';
import HashDisplay from '@/components/HashDisplay';
import StatusBadge from '@/components/StatusBadge';
import { FullPageSpinner, ButtonSpinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<CertificateDraft[]>([]);
  const [recentBlocks, setRecentBlocks] = useState<(Certificate & { block: BlockData | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'users' | 'drafts' | 'ledger'>('users');
  const [userFilter, setUserFilter] = useState<'pending' | 'all'>('pending');
  const [rejectModalDraft, setRejectModalDraft] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, draftsRes, certsRes] = await Promise.all([
        api.getStats(),
        api.adminGetUsers(),
        api.adminGetPendingDrafts(),
        api.getCertificates(1, 10),
      ]);
      setStats(statsRes);
      setAllUsers(usersRes.users || []);
      setPendingDrafts(draftsRes.drafts || []);
      setRecentBlocks(certsRes.certificates || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendingUsers = allUsers.filter((u) => u.status !== 'approved');

  const displayedUsers = userFilter === 'pending' ? pendingUsers : allUsers;

  const handleApproveUser = async (userId: string) => {
    setActionLoading(`user-${userId}`);
    try {
      const res = await api.adminApproveUser(userId);
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'approved' } : u))
      );
      toast.success(res.message || 'User approved successfully! They can now log in.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    setActionLoading(`user-${userId}`);
    try {
      const res = await api.adminRejectUser(userId);
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' } : u))
      );
      toast.success(res.message || 'User access rejected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveDraft = async (draftId: string) => {
    setActionLoading(`draft-${draftId}`);
    try {
      const res = await api.adminApproveDraft(draftId);
      setPendingDrafts((prev) => prev.filter((d) => d.draft_id !== draftId));
      toast.success(`Draft approved! Certificate ${res.certificate?.certificate_id} issued on-chain!`);
      // Refresh stats and blocks
      const [statsRes, certsRes] = await Promise.all([api.getStats(), api.getCertificates(1, 10)]);
      setStats(statsRes);
      setRecentBlocks(certsRes.certificates || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve draft');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmRejectDraft = async () => {
    if (!rejectModalDraft) return;
    const draftId = rejectModalDraft;
    setActionLoading(`draft-${draftId}`);
    try {
      await api.adminRejectDraft(draftId, rejectionReason.trim() || 'Rejected by administrator');
      setPendingDrafts((prev) => prev.filter((d) => d.draft_id !== draftId));
      toast.success('Draft rejected. Teacher has been notified.');
      setRejectModalDraft(null);
      setRejectionReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject draft');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!window.confirm(`Permanently delete certificate draft ${draftId}?`)) return;
    setActionLoading(`draft-del-${draftId}`);
    try {
      await api.adminDeleteDraft(draftId);
      setPendingDrafts((prev) => prev.filter((d) => d.draft_id !== draftId));
      toast.success('Draft permanently deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete draft');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeCertificate = async (certId: string) => {
    if (!window.confirm(`Are you sure you want to revoke Certificate ${certId}? This is an immutable administrator action.`)) return;
    setActionLoading(`cert-revoke-${certId}`);
    try {
      await api.adminRevokeCertificate(certId);
      setRecentBlocks((prev) =>
        prev.map((c) => (c.certificate_id === certId ? { ...c, status: 'revoked' } : c))
      );
      toast.success(`Certificate ${certId} revoked`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke certificate');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 mb-3">
            <LayoutDashboard className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-gold-400 text-xs font-semibold tracking-wider uppercase">ADMINISTRATOR CONTROL PANEL</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome, {user?.fullName}
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Approve registered accounts, review certificate drafts for on-chain issuance, and monitor blockchain ledger.
          </p>
        </motion.div>

        {/* Primary Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FilePlus} label="Issued Certificates" value={stats?.totalIssued ?? 0} color="text-gold-400" />
          <StatCard icon={ShieldCheck} label="Verified Count" value={stats?.totalVerified ?? 0} color="text-green-400" />
          <StatCard icon={Users} label="Pending Users" value={pendingUsers.length} color="text-amber-400" />
          <StatCard icon={FileCheck} label="Pending Drafts" value={pendingDrafts.length} color="text-amber-400" />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-5 border border-gold-500/15">
            <div className="flex items-center gap-2.5 mb-2">
              <Boxes className="w-4 h-4 text-blue-400" />
              <h3 className="text-slate-300 font-medium text-xs uppercase tracking-wider">Blocks on Chain</h3>
            </div>
            <p className="font-display text-2xl font-bold text-white">{stats?.totalBlocks ?? 0}</p>
          </div>
          <div className="glass-card p-5 border border-gold-500/15">
            <div className="flex items-center gap-2.5 mb-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <h3 className="text-slate-300 font-medium text-xs uppercase tracking-wider">Verification Attempts</h3>
            </div>
            <p className="font-display text-2xl font-bold text-white">{stats?.totalVerifications ?? 0}</p>
          </div>
          <div className="glass-card p-5 border border-gold-500/15">
            <div className="flex items-center gap-2.5 mb-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="text-slate-300 font-medium text-xs uppercase tracking-wider">Tamper Detections</h3>
            </div>
            <p className="font-display text-2xl font-bold text-white">{stats?.totalTampered ?? 0}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-navy-800/60 border border-gold-500/15 mb-6 max-w-xl">
          <button
            onClick={() => setTab('users')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'users' ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            User Approvals
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('drafts')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'drafts' ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Draft Approvals
            {pendingDrafts.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                {pendingDrafts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('ledger')}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === 'ledger' ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Blockchain Ledger
          </button>
        </div>

        {/* Tab Content: Users */}
        {tab === 'users' && (
          <div className="space-y-4">
            {/* User sub-filter */}
            <div className="flex items-center justify-between gap-4 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    userFilter === 'pending'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white bg-navy-800/40'
                  }`}
                >
                  Pending Approval ({pendingUsers.length})
                </button>
                <button
                  onClick={() => setUserFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    userFilter === 'all'
                      ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                      : 'text-slate-400 hover:text-white bg-navy-800/40'
                  }`}
                >
                  All Users ({allUsers.length})
                </button>
              </div>
              <span className="text-xs text-slate-500">
                Teacher & Student accounts require approval before login works.
              </span>
            </div>

            {displayedUsers.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title={userFilter === 'pending' ? 'No Pending User Approvals' : 'No Registered Users Found'}
                description={
                  userFilter === 'pending'
                    ? 'All educator and student accounts have been approved. New registrations requiring review will appear here.'
                    : 'No user accounts found in the registry.'
                }
              />
            ) : (
              <div className="space-y-3">
                {displayedUsers.map((u, idx) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className="glass-card-hover p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gold-500/15"
                  >
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 w-11 h-11 rounded-xl bg-navy-700/70 border border-gold-500/15 flex items-center justify-center text-gold-400">
                        <UserRoleIcon role={u.role} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <p className="text-white font-semibold text-sm">{u.full_name}</p>
                          <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-navy-800 text-gold-400/90 border border-gold-500/20">
                            {u.role}
                          </span>
                          <StatusBadge status={u.status} />
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{u.email}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Registered: {formatDate(u.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {u.status !== 'approved' ? (
                        <>
                          <button
                            onClick={() => handleApproveUser(u.id)}
                            disabled={actionLoading === `user-${u.id}`}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/25 transition-all disabled:opacity-50"
                          >
                            {actionLoading === `user-${u.id}` ? <ButtonSpinner /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Approve Account
                          </button>
                          <button
                            onClick={() => handleRejectUser(u.id)}
                            disabled={actionLoading === `user-${u.id}`}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRejectUser(u.id)}
                          disabled={actionLoading === `user-${u.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-medium border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
                          title="Revoke access"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Revoke Access
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Draft Approvals (State Machine) */}
        {tab === 'drafts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs text-slate-400">
                State Machine: Draft &rarr; Submitted &rarr; Approved (Auto-issues block on chain) / Rejected.
              </span>
              <span className="text-xs text-gold-400 font-mono">
                {pendingDrafts.length} pending review
              </span>
            </div>

            {pendingDrafts.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                title="No Drafts Pending Review"
                description="When faculty submit certificate drafts for review, they will appear here for cryptographic validation and blockchain block minting."
                actionText="View Ledger"
                actionHref="/ledger"
              />
            ) : (
              <div className="space-y-4">
                {pendingDrafts.map((d, idx) => (
                  <motion.div
                    key={d.draft_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    className="glass-card-hover p-6 border border-gold-500/15"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gold-500/10">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gold-400 bg-gold-500/10 px-2.5 py-1 rounded-md border border-gold-500/20">
                          {d.draft_id}
                        </span>
                        <span className="text-slate-500 text-xs">Submitted {formatDateTime(d.updated_at)}</span>
                      </div>
                      <StatusBadge status="submitted" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-slate-500 text-xs">Student Name</p>
                        <p className="text-white font-semibold text-sm">{d.student_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Course</p>
                        <p className="text-white font-semibold text-sm">{d.course}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Institution</p>
                        <p className="text-white font-semibold text-sm">{d.institution}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Issue Date</p>
                        <p className="text-white font-semibold text-sm">{formatDate(d.issue_date)}</p>
                      </div>
                    </div>

                    {d.student_email && (
                      <p className="text-xs text-slate-400 mb-4">
                        Linked Student Email: <span className="text-gold-300 font-mono">{d.student_email}</span>
                      </p>
                    )}

                    {d.file_name && (
                      <div className="mb-5 p-3 rounded-lg bg-navy-800/60 border border-gold-500/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <FileCheck className="w-4 h-4 text-gold-400" />
                          <span className="text-slate-200 font-medium">{d.file_name}</span>
                          <span className="text-slate-500">· {formatFileSize(Number(d.file_size || 0))}</span>
                        </div>
                        <span className="text-[11px] text-green-400 font-medium bg-green-500/10 px-2 py-0.5 rounded">
                          SHA-256 Hash Generated on Approval
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => handleApproveDraft(d.draft_id)}
                        disabled={actionLoading === `draft-${d.draft_id}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all disabled:opacity-50"
                      >
                        {actionLoading === `draft-${d.draft_id}` ? <ButtonSpinner /> : <ShieldCheck className="w-4 h-4" />}
                        Approve & Issue on Blockchain
                      </button>
                      <button
                        onClick={() => {
                          setRejectModalDraft(d.draft_id);
                          setRejectionReason('');
                        }}
                        disabled={actionLoading === `draft-${d.draft_id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject with Reason
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(d.draft_id)}
                        disabled={actionLoading === `draft-del-${d.draft_id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-navy-800 border border-red-500/20 text-red-400/80 hover:text-red-300 hover:bg-red-500/15 text-xs font-semibold transition-all disabled:opacity-50"
                        title="Delete draft permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Full Blockchain Ledger */}
        {tab === 'ledger' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 pb-2">
              <div>
                <h3 className="text-white font-semibold text-base">On-Chain Cryptographic Blocks</h3>
                <p className="text-slate-400 text-xs">Immutable chain linkage: blockHash = SHA256(certificateId + certHash + prevBlockHash + timestamp).</p>
              </div>
              <Link
                to="/ledger"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-gold-400 bg-gold-500/10 border border-gold-500/20 hover:bg-gold-500/20 transition-all"
              >
                <span>Full Ledger Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentBlocks.length === 0 ? (
              <div className="glass-card p-12 text-center border border-gold-500/15">
                <Boxes className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-white font-semibold text-lg mb-1">No blocks mined yet</h3>
                <p className="text-slate-400 text-sm">When certificate drafts are approved, new blocks will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBlocks.map((c, idx) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className="glass-card-hover p-5 border border-gold-500/15"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {c.block ? (
                          <span className="font-mono text-xs font-bold text-gold-400 bg-navy-800 px-2.5 py-1 rounded border border-gold-500/20">
                            Block #{c.block.block_index}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Block Pending</span>
                        )}
                        <span className="font-mono text-xs text-slate-300">{c.certificate_id}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="flex items-center gap-3">
                        {c.status !== 'revoked' && (
                          <button
                            onClick={() => handleRevokeCertificate(c.certificate_id)}
                            disabled={actionLoading === `cert-revoke-${c.certificate_id}`}
                            className="text-xs text-red-400 hover:text-red-300 font-medium inline-flex items-center gap-1 hover:underline transition-colors disabled:opacity-50"
                            title="Revoke this certificate on-chain"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Revoke Certificate
                          </button>
                        )}
                        <Link
                          to={`/verify?id=${c.certificate_id}`}
                          className="text-xs text-gold-400 hover:text-gold-300 font-medium inline-flex items-center gap-1"
                        >
                          Verify on Chain &rarr;
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                      <div>
                        <span className="text-slate-500">Student:</span> <span className="text-white font-medium">{c.student_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Course:</span> <span className="text-white font-medium">{c.course}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Institution:</span> <span className="text-white font-medium">{c.institution}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Date:</span> <span className="text-white font-medium">{formatDate(c.issue_date)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-gold-500/10">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-slate-500 text-[11px] min-w-[110px]">Certificate Hash:</span>
                        <HashDisplay hash={c.certificate_hash} truncate={false} className="flex-1" />
                      </div>
                      {c.block && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-slate-500 text-[11px] min-w-[110px]">Block Hash:</span>
                          <HashDisplay hash={c.block.block_hash} truncate={false} className="flex-1" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rejection Modal with custom reason */}
        <AnimatePresence>
          {rejectModalDraft && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-6 max-w-md w-full border border-red-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    Reject Certificate Draft
                  </h3>
                  <button onClick={() => setRejectModalDraft(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-slate-300 text-xs mb-3">
                  Provide a clear reason so the teacher can edit and resubmit this certificate draft:
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Student name misspelling or course date mismatch..."
                  rows={3}
                  className="w-full bg-navy-800/80 border border-gold-500/20 rounded-xl p-3 text-white text-sm placeholder-slate-500 focus:border-red-400 focus:outline-none mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setRejectModalDraft(null)}
                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRejectDraft}
                    disabled={actionLoading === `draft-${rejectModalDraft}`}
                    className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 text-xs font-semibold"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="glass-card-hover p-5 border border-gold-500/15"
    >
      <Icon className={`w-5 h-5 ${color} mb-2.5`} />
      <p className="font-display text-2xl sm:text-3xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-slate-400 text-xs mt-1">{label}</p>
    </motion.div>
  );
}

function UserRoleIcon({ role }: { role: string }) {
  if (role === 'admin') return <Building2 className="w-5 h-5 text-gold-400" />;
  if (role === 'teacher') return <FileCheck className="w-5 h-5 text-blue-400" />;
  return <GraduationCap className="w-5 h-5 text-emerald-400" />;
}
