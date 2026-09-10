import { type ReactNode } from 'react';
import { type Certificate } from '@/lib/supabase';
import { formatDate, formatFileSize } from '@/lib/utils';
import HashDisplay from './HashDisplay';
import { ShieldCheck, AlertTriangle, FileText, Building2, GraduationCap, Calendar, Hash, Box } from 'lucide-react';

interface ResultCardProps {
  result: 'valid' | 'invalid' | 'tampered' | 'not_found';
  certificate?: Certificate | null;
  block?: any | null;
  computedHash?: string | null;
  storedHash?: string | null;
  blockIndex?: number;
  txTimestamp?: string;
  certificateId?: string;
  children?: ReactNode;
}

const config = {
  valid: {
    bg: 'from-green-500/10 to-emerald-500/5',
    border: 'border-green-500/30',
    glow: 'glow-green',
    icon: ShieldCheck,
    iconColor: 'text-green-400',
    title: 'Certificate Verified',
    subtitle: 'The hash matches the on-chain record. This certificate is authentic.',
  },
  invalid: {
    bg: 'from-red-500/10 to-rose-500/5',
    border: 'border-red-500/30',
    glow: 'glow-red',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
    title: 'Hash Mismatch — Invalid',
    subtitle: 'The computed hash does not match the on-chain hash. This certificate may be forged or tampered with.',
  },
  tampered: {
    bg: 'from-red-500/10 to-rose-500/5',
    border: 'border-red-500/30',
    glow: 'glow-red',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
    title: 'Chain Tampered',
    subtitle: 'The blockchain chain integrity check failed. The block data has been altered.',
  },
  not_found: {
    bg: 'from-slate-500/10 to-slate-600/5',
    border: 'border-slate-500/30',
    glow: '',
    icon: AlertTriangle,
    iconColor: 'text-slate-400',
    title: 'Certificate Not Found',
    subtitle: 'No certificate exists with the provided ID. Please check and try again.',
  },
};

export default function ResultCard({
  result,
  certificate,
  block,
  computedHash,
  storedHash,
  blockIndex,
  txTimestamp,
  certificateId,
  children,
}: ResultCardProps) {
  const c = config[result];
  const Icon = c.icon;

  return (
    <div className={`rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} backdrop-blur-xl p-6 sm:p-8 ${c.glow} animate-scale-in`}>
      <div className="flex items-start gap-4 mb-6">
        <div className={`shrink-0 w-14 h-14 rounded-xl bg-navy-800/80 flex items-center justify-center ${c.iconColor}`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h3 className={`text-xl font-display font-bold ${c.iconColor}`}>{c.title}</h3>
          <p className="text-slate-400 text-sm mt-1">{c.subtitle}</p>
        </div>
      </div>

      {certificate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <DetailItem icon={GraduationCap} label="Student" value={certificate.student_name} />
          <DetailItem icon={FileText} label="Course" value={certificate.course} />
          <DetailItem icon={Building2} label="Institution" value={certificate.institution} />
          <DetailItem icon={Calendar} label="Issue Date" value={formatDate(certificate.issue_date)} />
          <DetailItem icon={Hash} label="Certificate ID" value={certificate.certificate_id} mono />
          {certificate.file_size != null && (
            <DetailItem icon={FileText} label="File Size" value={formatFileSize(certificate.file_size)} />
          )}
        </div>
      )}

      {certificateId && !certificate && (
        <div className="mb-6">
          <DetailItem icon={Hash} label="Certificate ID" value={certificateId} mono />
        </div>
      )}

      {storedHash && (
        <div className="space-y-3 mb-4">
          {computedHash && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-slate-500 text-xs font-medium min-w-[120px]">Computed Hash:</span>
              <HashDisplay hash={computedHash} truncate={false} className="flex-1" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-slate-500 text-xs font-medium min-w-[120px]">On-Chain Hash:</span>
            <HashDisplay hash={storedHash} truncate={false} className="flex-1" />
          </div>
        </div>
      )}

      {block && (
        <div className="mt-6 pt-6 border-t border-gold-500/10 space-y-3">
          <h4 className="text-white font-semibold text-sm flex items-center gap-2">
            <Box className="w-4 h-4 text-gold-500" />
            Block Details
          </h4>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-slate-500 text-xs font-medium min-w-[120px]">Block Index:</span>
              <span className="text-gold-400 font-mono text-sm">#{block.block_index ?? blockIndex}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-slate-500 text-xs font-medium min-w-[120px]">Block Hash:</span>
              <HashDisplay hash={block.block_hash || ''} truncate={false} className="flex-1" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-slate-500 text-xs font-medium min-w-[120px]">Previous Block:</span>
              <HashDisplay hash={block.previous_block_hash || ''} truncate={false} className="flex-1" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-slate-500 text-xs font-medium min-w-[120px]">Timestamp:</span>
              <span className="text-slate-300 text-sm font-mono">
                {formatDateTime(block.timestamp || txTimestamp || '')}
              </span>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: any;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-9 h-9 rounded-lg bg-navy-800/50 flex items-center justify-center text-gold-500/70">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-xs">{label}</p>
        <p className={`text-white text-sm font-medium ${mono ? 'font-mono' : ''} truncate`}>{value}</p>
      </div>
    </div>
  );
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
