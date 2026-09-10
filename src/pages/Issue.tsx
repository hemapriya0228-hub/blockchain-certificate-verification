import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  FilePlus,
  Upload,
  FileText,
  CheckCircle2,
  Download,
  RefreshCw,
  Sparkles,
  Hash,
  Box,
  Shield,
  GraduationCap,
  Building2,
  Calendar,
  IdCard,
} from 'lucide-react';
import { api, type IssueResponse } from '@/lib/supabase';
import { fileToBase64, formatFileSize, generateUUID, validateCertificateFile } from '@/lib/utils';
import { ButtonSpinner } from '@/components/Spinner';
import HashDisplay from '@/components/HashDisplay';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export default function Issue() {
  const [formData, setFormData] = useState({
    studentName: '',
    course: '',
    institution: '',
    issueDate: new Date().toISOString().split('T')[0],
    certificateId: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IssueResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = useCallback(async (selectedFile: File | null) => {
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
      toast.success('File ready for hashing');
    } catch {
      toast.error('Failed to read file');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files?.[0];
      handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const validate = (): boolean => {
    if (!formData.studentName.trim()) {
      toast.error('Student name is required');
      return false;
    }
    if (!formData.course.trim()) {
      toast.error('Course name is required');
      return false;
    }
    if (!formData.institution.trim()) {
      toast.error('Institution name is required');
      return false;
    }
    if (!formData.issueDate) {
      toast.error('Issue date is required');
      return false;
    }
    if (!file) {
      toast.error('Please upload a certificate file');
      return false;
    }
    return true;
  };

  const handleIssue = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.issueCertificate({
        studentName: formData.studentName.trim(),
        course: formData.course.trim(),
        institution: formData.institution.trim(),
        issueDate: formData.issueDate,
        certificateId: formData.certificateId.trim() || undefined,
        fileContent,
        fileName: file!.name,
        fileType: file!.type,
        fileSize: file!.size,
      });

      setResult(response);
      toast.success('Certificate issued on the blockchain!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setFileContent('');
    setFormData({
      studentName: '',
      course: '',
      institution: '',
      issueDate: new Date().toISOString().split('T')[0],
      certificateId: '',
    });
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 256;
      canvas.height = 256;
      ctx?.drawImage(img, 0, 0, 256, 256);
      const link = document.createElement('a');
      link.download = `cert-${result?.certificateId}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const verificationUrl = result
    ? `${window.location.origin}/verify?id=${result.certificateId}`
    : '';

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 mb-6">
            <FilePlus className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-gold-400 text-xs font-medium tracking-wide">ISSUE CERTIFICATE</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Issue a New Certificate
          </h1>
          <p className="text-slate-400 text-lg">
            Upload a certificate, and we'll hash it and store the hash on the blockchain.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {result ? (
            /* ============================================================
                SUCCESS STATE
               ============================================================ */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-xl p-6 sm:p-8 glow-green">
                <div className="flex items-start gap-4 mb-8">
                  <div className="shrink-0 w-14 h-14 rounded-xl bg-navy-800/80 flex items-center justify-center text-green-400">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-green-400">
                      Certificate Issued Successfully
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                      The certificate hash has been recorded on the blockchain in block #{result.blockIndex}.
                    </p>
                  </div>
                </div>

                {/* Certificate details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <DetailItem icon={GraduationCap} label="Student" value={result.certificate.student_name} />
                  <DetailItem icon={FileText} label="Course" value={result.certificate.course} />
                  <DetailItem icon={Building2} label="Institution" value={result.certificate.institution} />
                  <DetailItem icon={Calendar} label="Issue Date" value={formData.issueDate} />
                  <DetailItem icon={IdCard} label="Certificate ID" value={result.certificateId} mono />
                  <DetailItem icon={FileText} label="File" value={`${file?.name} (${formatFileSize(file?.size ?? 0)})`} />
                </div>

                {/* Hashes */}
                <div className="space-y-3 mb-6 pt-6 border-t border-green-500/10">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-slate-500 text-xs font-medium min-w-[120px]">Certificate Hash:</span>
                    <HashDisplay hash={result.hash} truncate={false} className="flex-1" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-slate-500 text-xs font-medium min-w-[120px]">Block Hash:</span>
                    <HashDisplay hash={result.blockHash} truncate={false} className="flex-1" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-slate-500 text-xs font-medium min-w-[120px]">Previous Block:</span>
                    <HashDisplay hash={result.previousBlockHash} truncate={false} className="flex-1" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-slate-500 text-xs font-medium min-w-[120px]">Timestamp:</span>
                    <span className="text-slate-300 text-sm font-mono">
                      {new Date(result.txTimestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pt-6 border-t border-green-500/10">
                  <div ref={qrRef} className="bg-white p-3 rounded-xl">
                    <QRCodeSVG
                      value={verificationUrl}
                      size={160}
                      level="M"
                      fgColor="#0a0e27"
                      bgColor="#ffffff"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gold-400" />
                      Verification QR Code
                    </h4>
                    <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                      Anyone can scan this QR code to instantly verify this certificate's authenticity.
                      The URL encodes the certificate ID for the verification page.
                    </p>
                    <button
                      onClick={handleDownloadQR}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-medium hover:bg-gold-500/20 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download QR
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-green-500/10">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-navy-800 border border-gold-500/20 text-white text-sm font-medium hover:border-gold-500/40 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Issue Another
                  </button>
                  <a
                    href={verificationUrl}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 text-sm font-semibold hover:shadow-gold-500/30 transition-all"
                  >
                    <Shield className="w-4 h-4" />
                    Verify This Certificate
                  </a>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ============================================================
                FORM STATE
               ============================================================ */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="glass-card p-6 sm:p-8"
            >
              {/* File upload */}
              <div className="mb-8">
                <label className="block text-white text-sm font-semibold mb-3">
                  Certificate File <span className="text-red-400">*</span>
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 ${
                    dragActive
                      ? 'border-gold-500/50 bg-gold-500/5'
                      : file
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-gold-500/15 bg-navy-800/30 hover:border-gold-500/30 hover:bg-navy-800/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <div className="p-8 text-center">
                    {file ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{file.name}</p>
                          <p className="text-slate-500 text-xs mt-1">
                            {formatFileSize(file.size)} · {file.type}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            setFileContent('');
                          }}
                          className="text-slate-400 hover:text-red-400 text-xs font-medium transition-colors"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gold-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            Drop your certificate here, or <span className="text-gold-400">browse</span>
                          </p>
                          <p className="text-slate-500 text-xs mt-1">
                            PDF, PNG, JPEG, or WebP · Max 10 MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  label="Student Name"
                  required
                  icon={GraduationCap}
                  value={formData.studentName}
                  onChange={(v) => handleChange('studentName', v)}
                  placeholder="e.g., John Doe"
                />
                <FormField
                  label="Course"
                  required
                  icon={FileText}
                  value={formData.course}
                  onChange={(v) => handleChange('course', v)}
                  placeholder="e.g., Computer Science B.Sc."
                />
                <FormField
                  label="Institution"
                  required
                  icon={Building2}
                  value={formData.institution}
                  onChange={(v) => handleChange('institution', v)}
                  placeholder="e.g., MIT"
                />
                <FormField
                  label="Issue Date"
                  required
                  type="date"
                  icon={Calendar}
                  value={formData.issueDate}
                  onChange={(v) => handleChange('issueDate', v)}
                />
                <div className="sm:col-span-2">
                  <label className="block text-white text-sm font-semibold mb-2">
                    Certificate ID <span className="text-slate-500 font-normal">(auto-generated if empty)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={formData.certificateId}
                        onChange={(e) => handleChange('certificateId', e.target.value)}
                        placeholder="Auto-generated UUID"
                        className="w-full bg-navy-800/50 border border-gold-500/15 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:border-gold-500/40 focus:outline-none transition-colors font-mono"
                      />
                    </div>
                    <button
                      onClick={() => handleChange('certificateId', generateUUID())}
                      className="px-4 rounded-xl bg-navy-800 border border-gold-500/15 text-gold-400 hover:border-gold-500/40 transition-all"
                      title="Generate UUID"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handleIssue}
                disabled={loading}
                className="w-full mt-8 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <ButtonSpinner />
                    Issuing on Blockchain...
                  </>
                ) : (
                  <>
                    <Hash className="w-4 h-4" />
                    Issue on Blockchain
                  </>
                )}
              </button>

              {/* Info note */}
              <div className="mt-6 p-4 rounded-xl bg-navy-800/40 border border-gold-500/10">
                <div className="flex items-start gap-3">
                  <Box className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Clicking this button will compute a SHA-256 hash of your file, create a new block
                    on the simulated blockchain, and save the certificate metadata. Only the hash is
                    stored on-chain — your file content is never exposed.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  required?: boolean;
  icon: any;
  value: string;
  onChange: (value: string) => void;
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
