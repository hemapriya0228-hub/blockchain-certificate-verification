import { Clock, ShieldCheck, AlertTriangle, CheckCircle2, FileText, Edit3, Send } from 'lucide-react';

const config: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  // Certificate statuses
  issued: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: FileText, label: 'Issued' },
  verified: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: ShieldCheck, label: 'Verified' },
  tampered: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle, label: 'Tampered' },
  // Draft statuses
  draft: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', icon: Edit3, label: 'Draft' },
  submitted: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock, label: 'Pending' },
  approved: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle, label: 'Rejected' },
  // User statuses
  pending: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock, label: 'Pending' },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = config[status] || config.issued;
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${c.bg} ${c.color}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}
