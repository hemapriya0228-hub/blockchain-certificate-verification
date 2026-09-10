import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Boxes,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Building2,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Hash,
  Link2,
  Box,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { api, type CertListResponse, type CertDetailResponse } from '@/lib/supabase';
import { FullPageSpinner } from '@/components/Spinner';
import HashDisplay from '@/components/HashDisplay';
import StatusBadge from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonCard } from '@/components/Skeleton';
import { analytics } from '@/lib/analytics';
import { formatDate, formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 10;

export default function Ledger() {
  const [data, setData] = useState<CertListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [detail, setDetail] = useState<CertDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCertificates(page, PAGE_SIZE, search);
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCerts();
  }, [fetchCerts]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleRowClick = async (certId: string) => {
    if (expandedRow === certId) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(certId);
    setDetailLoading(true);
    try {
      const res = await api.getCertificate(certId);
      setDetail(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  };

  const certificates = data?.certificates ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
            <Boxes className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-gold-400 text-xs font-medium tracking-wide">PUBLIC LEDGER</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
            Certificate Ledger
          </h1>
          <p className="text-slate-400 text-lg">
            Browse all certificates on the chain. Click any row for block details.
          </p>
        </motion.div>

        {/* Search bar */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Search by institution, student, or certificate ID..."
              className="w-full bg-navy-800/50 border border-gold-500/15 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:border-gold-500/40 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 rounded-xl bg-gold-500/15 border border-gold-500/20 text-gold-400 text-sm font-medium hover:bg-gold-500/25 transition-all"
          >
            Search
          </button>
          {search && (
            <button
              onClick={handleClearSearch}
              className="px-4 rounded-xl bg-navy-800 border border-gold-500/15 text-slate-400 text-sm hover:text-white transition-all"
            >
              Clear
            </button>
          )}
        </div>

        {/* Stats summary */}
        {data && (
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="text-slate-400">
              <span className="text-white font-semibold">{data.total}</span> total certificates
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">
              Page <span className="text-white font-semibold">{page}</span> of {totalPages}
            </span>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title={search ? 'No Certificates Matching Search' : 'No Blockchain Blocks Found'}
            description={
              search
                ? `No credentials found matching "${search}". Clear your filter to view all confirmed ledger records.`
                : 'No certificates have been committed to the distributed ledger yet.'
            }
            actionText={search ? 'Clear Search' : 'Verify a Credential'}
            onAction={search ? handleClearSearch : undefined}
            actionHref={search ? undefined : '/verify'}
          />
        ) : (
          <div className="space-y-3">
            {/* Table header (desktop) */}
            <div className="hidden lg:grid grid-cols-[2fr_1.5fr_1.5fr_2fr_2fr_1fr_auto] gap-4 px-4 py-2 text-xs text-slate-500 font-medium uppercase tracking-wider">
              <span>Cert ID</span>
              <span>Student</span>
              <span>Institution</span>
              <span>Cert Hash</span>
              <span>Block Hash</span>
              <span>Status</span>
              <span></span>
            </div>

            {certificates.map((cert, idx) => (
              <div key={cert.certificate_id}>
                {/* Row */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  onClick={() => handleRowClick(cert.certificate_id)}
                  className={`cursor-pointer rounded-xl border transition-all duration-200 ${
                    expandedRow === cert.certificate_id
                      ? 'bg-navy-800/80 border-gold-500/30'
                      : 'glass-card-hover'
                  }`}
                >
                  {/* Desktop layout */}
                  <div className="hidden lg:grid grid-cols-[2fr_1.5fr_1.5fr_2fr_2fr_1fr_auto] gap-4 px-4 py-4 items-center">
                    <span className="text-gold-400 font-mono text-xs truncate">{cert.certificate_id}</span>
                    <span className="text-white text-sm truncate">{cert.student_name}</span>
                    <span className="text-slate-300 text-sm truncate">{cert.institution}</span>
                    <HashDisplay hash={cert.certificate_hash} truncate className="text-xs" />
                    <HashDisplay hash={cert.block?.block_hash || '—'} truncate className="text-xs" />
                    <StatusBadge status={cert.status} />
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        expandedRow === cert.certificate_id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {/* Mobile layout */}
                  <div className="lg:hidden p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gold-400 font-mono text-xs">{cert.certificate_id}</span>
                      <StatusBadge status={cert.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white font-medium">{cert.student_name}</span>
                      <span className="text-slate-400">{cert.institution}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDate(cert.created_at)}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedRow === cert.certificate_id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expandedRow === cert.certificate_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      {detailLoading ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Loading block details...</div>
                      ) : detail ? (
                        <BlockDetailView detail={detail} onBack={() => setExpandedRow(null)} />
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-sm">No details available</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-navy-800 border border-gold-500/15 text-slate-300 text-sm hover:border-gold-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 7) {
                  if (page > 4) {
                    pageNum = page - 3 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (6 - i);
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      page === pageNum
                        ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-navy-700/50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-navy-800 border border-gold-500/15 text-slate-300 text-sm hover:border-gold-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Block detail view (etherscan-style) ---
function BlockDetailView({ detail, onBack }: { detail: CertDetailResponse; onBack: () => void }) {
  const cert = detail.certificate;
  const block = detail.blocks[0];

  return (
    <div className="mt-2 rounded-xl bg-navy-850/80 border border-gold-500/15 p-6 space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-slate-400 hover:text-gold-400 text-xs font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Collapse
      </button>

      {/* Certificate info */}
      <div>
        <h4 className="text-white font-display font-semibold text-sm mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gold-500" />
          Certificate Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailItem icon={GraduationCap} label="Student" value={cert.student_name} />
          <DetailItem icon={FileText} label="Course" value={cert.course} />
          <DetailItem icon={Building2} label="Institution" value={cert.institution} />
          <DetailItem icon={Calendar} label="Issue Date" value={formatDate(cert.issue_date)} />
          <DetailItem icon={Clock} label="Created" value={formatDateTime(cert.created_at)} />
          <DetailItem icon={Clock} label="Last Verified" value={cert.verified_at ? formatDateTime(cert.verified_at) : 'Never'} />
        </div>
      </div>

      {/* Block info */}
      {block && (
        <div className="pt-4 border-t border-gold-500/10">
          <h4 className="text-white font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <Box className="w-4 h-4 text-gold-500" />
            Block #{block.block_index}
          </h4>
          <div className="space-y-3">
            <BlockRow icon={Hash} label="Certificate Hash" value={block.certificate_hash} />
            <BlockRow icon={Box} label="Block Hash" value={block.block_hash} />
            <BlockRow icon={Link2} label="Previous Block Hash" value={block.previous_block_hash} />
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-slate-500 text-xs font-medium min-w-[140px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Timestamp
              </span>
              <span className="text-slate-300 text-sm font-mono">{formatDateTime(block.timestamp)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Verification logs */}
      {detail.verificationLogs.length > 0 && (
        <div className="pt-4 border-t border-gold-500/10">
          <h4 className="text-white font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-500" />
            Verification History ({detail.verificationLogs.length})
          </h4>
          <div className="space-y-2">
            {detail.verificationLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-navy-800/40">
                <span className="text-slate-400">{formatDateTime(log.created_at)}</span>
                <span
                  className={`font-medium ${
                    log.result === 'valid' ? 'text-green-400' : log.result === 'invalid' || log.result === 'tampered' ? 'text-red-400' : 'text-slate-400'
                  }`}
                >
                  {log.result.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-9 h-9 rounded-lg bg-navy-800/50 flex items-center justify-center text-gold-500/70">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-xs">{label}</p>
        <p className="text-white text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function BlockRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <span className="text-slate-500 text-xs font-medium min-w-[140px] flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </span>
      <HashDisplay hash={value} truncate={false} className="flex-1" />
    </div>
  );
}
