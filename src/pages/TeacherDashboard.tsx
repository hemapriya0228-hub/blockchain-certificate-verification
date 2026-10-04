import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  FilePlus,
  Upload,
  FileText,
  GraduationCap,
  Building2,
  Calendar,
  IdCard,
  Mail,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Save,
  Edit3,
  RefreshCw,
  X,
} from 'lucide-react';
import { api, type CertificateDraft } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fileToBase64, formatDate, generateUUID, validateCertificateFile } from '@/lib/utils';
import { ButtonSpinner, FullPageSpinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { useRealtimeEvents } from '@/lib/events';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  draft: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', icon: Edit3, label: 'Draft' },
  submitted: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock, label: 'Pending' },
  approved: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle, label: 'Rejected' },
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<CertificateDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDraft, setEditingDraft] = useState<CertificateDraft | null>(null);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.teacherGetDrafts();
      setDrafts(res.drafts);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRealtimeEvent = useCallback((evt: any) => {
    if (['certificate.approved', 'certificate.rejected', 'certificate.status.updated'].includes(evt.type)) {
      if (evt.type === 'certificate.approved') {
        toast.success('Real-Time Alert: Your certificate draft has been approved by the Administrator!');
      }
      fetchDrafts();
    }
  }, [fetchDrafts]);

  useRealtimeEvents(handleRealtimeEvent);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleEdit = (draft: CertificateDraft) => {
    setEditingDraft(draft);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDraft(null);
    fetchDrafts();
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
              <LayoutDashboard className="w-3.5 h-3.5 text-gold-400" />
              <span className="text-gold-400 text-xs font-medium tracking-wide">
                {user?.role === 'institution' ? 'INSTITUTION DASHBOARD' : 'TEACHER DASHBOARD'}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
              Welcome, {user?.fullName}
            </h1>
            <p className="text-slate-400 text-lg">
              {user?.role === 'institution'
                ? 'Manage institutional credential drafts, student records, and certificate issuance requests.'
                : 'Create certificate drafts and submit them for admin approval.'}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all"
            >
              <FilePlus className="w-4 h-4" />
              New Certificate Draft
            </button>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {showForm ? (
            <DraftForm key="form" existing={editingDraft} onClose={handleFormClose} />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Drafts table */}
              {drafts.length === 0 ? (
                <EmptyState
                  icon={FilePlus}
                  title="No Certificate Drafts Yet"
                  description="Create your first certificate draft. After submitting, your institutional admin can review and commit it to the blockchain."
                  actionText="Create New Draft"
                  onAction={() => setShowForm(true)}
                />
              ) : (
                <div className="space-y-3">
                  {drafts.map((d, idx) => {
                    const cfg = statusConfig[d.status] || statusConfig.draft;
                    const StatusIcon = cfg.icon;
                    return (
                      <motion.div
                        key={d.draft_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.03 }}
                        className="glass-card-hover p-5"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
                            <DraftField icon={GraduationCap} label="Student" value={d.student_name} />
                            <DraftField icon={FileText} label="Course" value={d.course} />
                            <DraftField icon={Building2} label="Institution" value={d.institution} />
                            <DraftField icon={Calendar} label="Issue Date" value={formatDate(d.issue_date)} />
                            <DraftField icon={IdCard} label="Draft ID" value={d.draft_id} mono />
                            <DraftField icon={Clock} label="Created" value={formatDate(d.created_at)} />
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                            {(d.status === 'draft' || d.status === 'rejected') && (
                              <button
                                onClick={() => handleEdit(d)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-800 border border-gold-500/15 text-gold-400 text-sm font-medium hover:border-gold-500/40 transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                {d.status === 'rejected' ? 'Edit & Resubmit' : 'Edit'}
                              </button>
                            )}
                            {d.status === 'approved' && d.certificate_id && (
                              <a
                                href={`/verify?id=${d.certificate_id}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                View Cert
                              </a>
                            )}
                          </div>
                        </div>
                        {d.status === 'rejected' && d.rejection_reason && (
                          <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                            <p className="text-red-400 text-xs">
                              <span className="font-semibold">Rejection reason:</span> {d.rejection_reason}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================
// DRAFT FORM COMPONENT
// ============================================================

function DraftForm({ existing, onClose }: { existing: CertificateDraft | null; onClose: () => void }) {
  const [formData, setFormData] = useState({
    studentName: existing?.student_name || '',
    course: existing?.course || '',
    institution: existing?.institution || '',
    issueDate: existing?.issue_date || new Date().toISOString().split('T')[0],
    studentEmail: existing?.student_email || '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>(existing?.file_content || '');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasExistingFile = !!existing?.file_content && !file;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    const validation = validateCertificateFile(selectedFile);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }
    try {
      const base64 = await fileToBase64(selectedFile);
      setFile(selectedFile);
      setFileContent(base64);
      toast.success('File ready');
    } catch {
      toast.error('Failed to read file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const validate = (): boolean => {
    if (!formData.studentName.trim()) { toast.error('Student name is required'); return false; }
    if (!formData.course.trim()) { toast.error('Course is required'); return false; }
    if (!formData.institution.trim()) { toast.error('Institution is required'); return false; }
    if (!formData.issueDate) { toast.error('Issue date is required'); return false; }
    if (!fileContent) { toast.error('Please upload a certificate file'); return false; }
    return true;
  };

  const handleSubmit = async (submit: boolean) => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.teacherCreateDraft({
        draftId: existing?.draft_id,
        studentName: formData.studentName.trim(),
        course: formData.course.trim(),
        institution: formData.institution.trim(),
        issueDate: formData.issueDate,
        studentEmail: formData.studentEmail.trim() || undefined,
        fileContent,
        fileName: file?.name || existing?.file_name || 'certificate',
        fileType: file?.type || existing?.file_type || 'application/octet-stream',
        fileSize: file?.size || Number(existing?.file_size) || 0,
        submit,
      });
      toast.success(res.message);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-6 sm:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-white">
          {existing ? 'Edit Draft' : 'New Certificate Draft'}
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-navy-700/50 transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* File upload */}
      <div className="mb-6">
        <label className="block text-white text-sm font-semibold mb-3">
          Certificate File <span className="text-red-400">*</span>
        </label>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all ${
            dragActive ? 'border-gold-500/50 bg-gold-500/5'
            : file || hasExistingFile ? 'border-green-500/30 bg-green-500/5'
            : 'border-gold-500/15 bg-navy-800/30 hover:border-gold-500/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="p-6 text-center">
            {file || hasExistingFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-green-400" />
                <p className="text-white text-sm font-medium">{file?.name || existing?.file_name}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setFileContent(''); }}
                  className="text-slate-400 hover:text-red-400 text-xs transition-colors"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gold-400" />
                <p className="text-white text-sm">Drop file or <span className="text-gold-400">browse</span></p>
                <p className="text-slate-500 text-xs">PDF, PNG, JPEG, WebP · Max 10 MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField icon={GraduationCap} label="Student Name" required value={formData.studentName} onChange={(v) => handleChange('studentName', v)} placeholder="John Doe" />
        <FormField icon={FileText} label="Course" required value={formData.course} onChange={(v) => handleChange('course', v)} placeholder="Computer Science B.Sc." />
        <FormField icon={Building2} label="Institution" required value={formData.institution} onChange={(v) => handleChange('institution', v)} placeholder="MIT" />
        <FormField icon={Calendar} label="Issue Date" required type="date" value={formData.issueDate} onChange={(v) => handleChange('issueDate', v)} />
        <FormField icon={Mail} label="Student Email (optional)" value={formData.studentEmail} onChange={(v) => handleChange('studentEmail', v)} placeholder="student@example.com" />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-navy-800 border border-gold-500/20 text-white font-semibold text-sm hover:border-gold-500/40 transition-all disabled:opacity-50"
        >
          {loading ? <ButtonSpinner /> : <Save className="w-4 h-4" />}
          Save as Draft
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all disabled:opacity-50"
        >
          {loading ? <ButtonSpinner /> : <Send className="w-4 h-4" />}
          Submit for Approval
        </button>
      </div>
    </motion.div>
  );
}

function FormField({
  icon: Icon,
  label,
  required,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: any;
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-white text-sm font-semibold mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-navy-800/50 border border-gold-500/15 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:border-gold-500/40 focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}

function DraftField({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-slate-500 text-xs flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3" />
        {label}
      </p>
      <p className={`text-white text-sm font-medium truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
