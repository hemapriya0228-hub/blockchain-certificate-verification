import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  Building2,
  Calendar,
  ShieldCheck,
  Download,
  Link2,
  Copy,
  Check,
  Boxes,
  X,
  Hash,
  Box,
} from 'lucide-react';
import { api, type Certificate, type BlockData } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDate, formatFileSize, copyToClipboard } from '@/lib/utils';
import HashDisplay from '@/components/HashDisplay';
import StatusBadge from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonCard } from '@/components/Skeleton';
import { FullPageSpinner } from '@/components/Spinner';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<(Certificate & { block: BlockData | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<(Certificate & { block: BlockData | null }) | null>(null);

  const fetchCerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.studentGetCertificates();
      setCerts(res.certificates);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCerts();
  }, [fetchCerts]);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
            <LayoutDashboard className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-gold-400 text-xs font-medium tracking-wide">STUDENT DASHBOARD</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome, {user?.fullName}
          </h1>
          <p className="text-slate-400 text-lg">
            Your issued certificates. Download, share, and verify anytime.
          </p>
        </motion.div>

        {/* Certificates grid */}
        {certs.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No Certificates Issued Yet"
            description="When an educator or institutional administrator issues an authentic certificate to your account, it will automatically appear here with blockchain proof."
            actionText="Verify a Certificate"
            actionHref="/verify"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certs.map((cert, idx) => (
              <motion.div
                key={cert.certificate_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="glass-card-hover p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-gold-400" />
                  </div>
                  <StatusBadge status={cert.status} />
                </div>

                <h3 className="font-display text-lg font-bold text-white mb-1">{cert.student_name}</h3>
                <p className="text-slate-400 text-sm mb-4">{cert.course}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400">{cert.institution}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400">Issued {formatDate(cert.issue_date)}</span>
                  </div>
                  {cert.block && (
                    <div className="flex items-center gap-2 text-xs">
                      <Box className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-400">Block #{cert.block.block_index}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-medium hover:bg-gold-500/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Details & QR
                  </button>
                  <CopyLinkButton certId={cert.certificate_id} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedCert && (
        <CertDetailModal cert={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
}

function CopyLinkButton({ certId }: { certId: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/verify?id=${certId}`;

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      toast.success('Verification link copied!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-navy-800 border border-gold-500/15 text-slate-300 text-sm font-medium hover:border-gold-500/30 transition-all"
      title="Copy verification link"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Link2 className="w-3.5 h-3.5" />}
    </button>
  );
}

function CertDetailModal({
  cert,
  onClose,
}: {
  cert: Certificate & { block: BlockData | null };
  onClose: () => void;
}) {
  const qrRef = useRef<HTMLDivElement>(null);
  const verificationUrl = `${window.location.origin}/verify?id=${cert.certificate_id}`;

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx?.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement('a');
      a.download = `${cert.certificate_id}-qr.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast.success('QR Code saved!');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleDownloadCertificate = () => {
    const svg = qrRef.current?.querySelector('svg');
    const svgData = svg ? new XMLSerializer().serializeToString(svg) : '';
    const qrDataUrl = svgData ? 'data:image/svg+xml;base64,' + btoa(svgData) : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to download/print your certificate.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${cert.certificate_id}</title>
          <style>
            @page { size: landscape; margin: 20mm; }
            body {
              font-family: 'Times New Roman', Georgia, serif;
              background: #0a0e27;
              color: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .cert-border {
              border: 8px double #d4af37;
              padding: 40px;
              max-width: 900px;
              width: 100%;
              background: linear-gradient(135deg, #0f1730 0%, #060a1a 100%);
              box-shadow: 0 0 50px rgba(212, 175, 55, 0.2);
              border-radius: 12px;
              text-align: center;
              position: relative;
            }
            .title {
              font-size: 38px;
              letter-spacing: 4px;
              color: #d4af37;
              text-transform: uppercase;
              margin-bottom: 8px;
              font-family: sans-serif;
            }
            .subtitle {
              font-size: 16px;
              color: #94a3b8;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-bottom: 30px;
            }
            .presented {
              font-size: 18px;
              color: #cbd5e1;
              font-style: italic;
              margin-bottom: 12px;
            }
            .recipient {
              font-size: 36px;
              font-weight: bold;
              color: #ffffff;
              border-bottom: 2px solid #d4af37;
              display: inline-block;
              padding: 0 40px 10px;
              margin-bottom: 24px;
            }
            .course {
              font-size: 22px;
              color: #e2e8f0;
              margin-bottom: 10px;
            }
            .institution {
              font-size: 18px;
              color: #d4af37;
              margin-bottom: 35px;
            }
            .footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid rgba(212, 175, 55, 0.3);
              font-family: sans-serif;
              text-align: left;
            }
            .hash-box {
              font-size: 11px;
              color: #94a3b8;
              font-family: monospace;
              max-width: 480px;
              word-break: break-all;
            }
            .qr {
              background: #fff;
              padding: 6px;
              border-radius: 8px;
              display: inline-block;
            }
            @media print {
              body { background: #fff !important; color: #000 !important; }
              .cert-border { border: 8px double #9a7d14 !important; background: #fff !important; color: #000 !important; box-shadow: none !important; }
              .title { color: #854d0e !important; }
              .recipient { color: #000 !important; border-bottom: 2px solid #854d0e !important; }
              .institution { color: #854d0e !important; }
              .course { color: #000 !important; }
              .hash-box { color: #334155 !important; }
            }
          </style>
        </head>
        <body>
          <div class="cert-border">
            <div class="title">Certificate of Completion</div>
            <div class="subtitle">Blockchain Verified Credential</div>
            <div class="presented">This is to certify that</div>
            <div class="recipient">${cert.student_name}</div>
            <div class="course">has successfully completed the curriculum for <strong>${cert.course}</strong></div>
            <div class="institution">Conferred by ${cert.institution} · ${cert.issue_date}</div>
            
            <div class="footer">
              <div class="hash-box">
                <div><strong>Certificate ID:</strong> ${cert.certificate_id}</div>
                <div><strong>SHA-256 Hash:</strong> ${cert.certificate_hash}</div>
                ${cert.block ? `<div><strong>On-Chain Block #${cert.block.block_index}:</strong> ${cert.block.block_hash}</div>` : ''}
                <div style="margin-top: 4px; color: #d4af37;">Verify: ${verificationUrl}</div>
              </div>
              <div class="qr">
                <img src="${qrDataUrl}" width="100" height="100" alt="Verification QR" />
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin border border-gold-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-white">Certificate Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-navy-700/50 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <DetailItem icon={GraduationCap} label="Student" value={cert.student_name} />
          <DetailItem icon={FileText} label="Course" value={cert.course} />
          <DetailItem icon={Building2} label="Institution" value={cert.institution} />
          <DetailItem icon={Calendar} label="Issue Date" value={formatDate(cert.issue_date)} />
        </div>

        {/* Hashes */}
        <div className="space-y-3 mb-6 pt-6 border-t border-gold-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-slate-500 text-xs font-medium min-w-[120px]">Certificate ID:</span>
            <code className="font-mono text-xs text-gold-400 bg-navy-800/50 px-2 py-1 rounded">{cert.certificate_id}</code>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-slate-500 text-xs font-medium min-w-[120px]">Certificate Hash:</span>
            <HashDisplay hash={cert.certificate_hash} truncate={false} className="flex-1" />
          </div>
          {cert.block && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-slate-500 text-xs font-medium min-w-[120px]">Block Hash:</span>
                <HashDisplay hash={cert.block.block_hash} truncate={false} className="flex-1" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-slate-500 text-xs font-medium min-w-[120px]">Block Index:</span>
                <span className="text-gold-400 font-mono text-sm">#{cert.block.block_index}</span>
              </div>
            </>
          )}
          {cert.file_name && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-slate-500 text-xs font-medium min-w-[120px]">File:</span>
              <span className="text-slate-300 text-sm">{cert.file_name} · {formatFileSize(cert.file_size ?? 0)}</span>
            </div>
          )}
        </div>

        {/* QR Code and Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pt-6 border-t border-gold-500/10">
          <div ref={qrRef} className="bg-white p-3 rounded-xl shadow-lg shadow-gold-500/10">
            <QRCodeSVG value={verificationUrl} size={150} level="M" fgColor="#0a0e27" bgColor="#ffffff" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-white font-semibold text-sm mb-1.5 flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="w-4 h-4 text-gold-400" />
              Verifiable Blockchain Credential
            </h4>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              Scan this QR code with any mobile camera to verify this certificate on-chain.
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                onClick={handleDownloadCertificate}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 text-xs font-bold uppercase tracking-wider shadow-md shadow-gold-500/20 hover:shadow-gold-500/40 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF / Print
              </button>
              <button
                onClick={handleDownloadQR}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-medium hover:bg-gold-500/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Save QR (PNG)
              </button>
              <a
                href={verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-navy-800 border border-gold-500/15 text-white text-xs font-medium hover:border-gold-500/40 transition-all"
              >
                <Link2 className="w-3.5 h-3.5" />
                Verify Link
              </a>
            </div>
          </div>
        </div>
      </motion.div>
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
