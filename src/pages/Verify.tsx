import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Upload,
  FileText,
  ShieldCheck,
  IdCard,
  X,
} from 'lucide-react';
import { api, type VerifyResponse } from '@/lib/supabase';
import { fileToBase64, formatFileSize, validateCertificateFile } from '@/lib/utils';
import { ButtonSpinner } from '@/components/Spinner';
import ResultCard from '@/components/ResultCard';

type Tab = 'upload' | 'id';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [certificateId, setCertificateId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill cert ID from URL param (?id=...)
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setCertificateId(id);
      setActiveTab('id');
    }
  }, [searchParams]);

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
    } catch {
      toast.error('Failed to read file');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFileSelect(e.dataTransfer.files?.[0]);
    },
    [handleFileSelect]
  );

  const handleVerify = async () => {
    if (activeTab === 'upload') {
      if (!file) {
        toast.error('Please upload a certificate file');
        return;
      }
      if (!certificateId.trim()) {
        toast.error('Please enter the certificate ID');
        return;
      }
    } else {
      if (!certificateId.trim()) {
        toast.error('Please enter a certificate ID');
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.verifyCertificate({
        certificateId: certificateId.trim(),
        fileContent: fileContent || undefined,
      });
      setResult(response);

      if (response.result === 'valid') {
        toast.success('Certificate verified — hash matches!');
      } else if (response.result === 'invalid') {
        toast.error('Hash mismatch — this certificate is invalid');
      } else if (response.result === 'tampered') {
        toast.error('Chain integrity check failed — tampered!');
      } else {
        toast.error('Certificate not found');
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setFileContent('');
    setCertificateId('');
  };

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
            <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-gold-400 text-xs font-medium tracking-wide">VERIFY CERTIFICATE</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Verify a Certificate
          </h1>
          <p className="text-slate-400 text-lg">
            Upload the certificate file to re-hash and compare, or look up by certificate ID.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-navy-800/50 border border-gold-500/10 mb-6 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-gold-500/15 text-gold-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload & Verify
          </button>
          <button
            onClick={() => setActiveTab('id')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'id'
                ? 'bg-gold-500/15 text-gold-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <IdCard className="w-4 h-4" />
            By Certificate ID
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="verify-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="glass-card p-6 sm:p-8"
            >
              {/* Cert ID input — always shown */}
              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-2">
                  Certificate ID <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    placeholder="e.g., CERT-ABCD-1234 or full UUID"
                    className="w-full bg-navy-800/50 border border-gold-500/15 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:border-gold-500/40 focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              {/* File upload — only in upload tab */}
              {activeTab === 'upload' && (
                <div className="mb-8">
                  <label className="block text-white text-sm font-semibold mb-3">
                    Certificate File <span className="text-red-400">*</span>
                  </label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                    }}
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
                              Drop certificate here, or <span className="text-gold-400">browse</span>
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
                              We'll re-hash the file and compare to the on-chain hash
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Verify button */}
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <ButtonSpinner />
                    Verifying on Blockchain...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Verify Now
                  </>
                )}
              </button>

              {/* Info */}
              <div className="mt-6 p-4 rounded-xl bg-navy-800/40 border border-gold-500/10">
                <p className="text-slate-500 text-xs leading-relaxed">
                  {activeTab === 'upload' ? (
                    <>
                      <span className="text-gold-500 font-semibold">How it works:</span> We compute a
                      SHA-256 hash of your uploaded file and compare it to the hash stored on the
                      blockchain. If they match, the certificate is authentic. If not, it has been
                      tampered with.
                    </>
                  ) : (
                    <>
                      <span className="text-gold-500 font-semibold">How it works:</span> We look up
                      the certificate by ID and verify the blockchain chain integrity. For full
                      verification (file-level), switch to the Upload & Verify tab.
                    </>
                  )}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <ResultCard
                result={result.result}
                certificate={result.certificate}
                block={result.block}
                computedHash={result.computedHash}
                storedHash={result.storedHash}
                certificateId={result.certificateId}
              >
                <div className="mt-6 pt-6 border-t border-gold-500/10">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-800 border border-gold-500/20 text-white text-sm font-medium hover:border-gold-500/40 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Verify Another
                  </button>
                </div>
              </ResultCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
