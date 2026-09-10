import React, { useState, useEffect } from 'react';
import { ShieldCheck, Database, Award, CheckCircle, ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';
import { analytics } from '@/lib/analytics';

const STORAGE_KEY = 'chaincert_onboarding_done';

export const OnboardingModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        // slight delay to let page render smoothly
        const timer = setTimeout(() => setIsOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  // Listen for custom trigger to re-open tour (e.g. from help menu)
  useEffect(() => {
    const handleReopen = () => {
      setStep(0);
      setIsOpen(true);
    };
    window.addEventListener('chaincert:open-onboarding', handleReopen);
    return () => window.removeEventListener('chaincert:open-onboarding', handleReopen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    analytics.track('onboarding_skipped', 'engagement', { step });
  };

  const handleFinish = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    analytics.track('onboarding_completed', 'engagement', { totalSteps: 3 });
  };

  const steps = [
    {
      title: 'Welcome to ChainCert',
      subtitle: 'Blockchain-Powered Academic & Professional Credential Infrastructure',
      icon: Award,
      badge: 'Step 1 of 3: Credential Issuance',
      content:
        'Faculty and administrators can create, review, and issue cryptographically signed certificates. Once issued, certificates receive unique tamper-evident IDs and embedded QR codes.',
      points: [
        'Faculty submit certificate drafts for administrative review',
        'Administrators approve or reject drafts with audit trails',
        'Each certificate is assigned an immutable CERT-XXXX-XXXX ID',
      ],
    },
    {
      title: 'SHA-256 Hashing & Ledger',
      subtitle: 'Zero Personal Data Stored On-Chain',
      icon: Database,
      badge: 'Step 2 of 3: Blockchain Security',
      content:
        'Only 256-bit SHA-256 cryptographic hashes are committed to the blockchain. The actual certificate contents remain private and secure on your device.',
      points: [
        'Blocks are cryptographically chained with previous hashes',
        'Any modification of certificate text alters the hash immediately',
        'Transparent public ledger for global trust and auditability',
      ],
    },
    {
      title: 'Instant Tamper Verification',
      subtitle: 'Verify in Seconds Anywhere in the World',
      icon: ShieldCheck,
      badge: 'Step 3 of 3: Trustless Verification',
      content:
        'Employers and universities can verify credentials without logging in. Simply enter a Certificate ID or drop the original PDF to verify authenticity instantly.',
      points: [
        'Real-time hash recomputation against blockchain blocks',
        'Clear status badges: VALID, TAMPERED, or NOT FOUND',
        'Downloadable cryptographic verification receipts',
      ],
    },
  ];

  if (!isOpen) return null;

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card max-w-lg w-full p-8 border border-gold-500/30 shadow-2xl relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs font-semibold text-gold-400 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          {current.badge}
        </div>

        <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-gold-500/30 flex items-center justify-center mb-5 text-gold-400 shadow-inner">
          <Icon className="w-7 h-7" />
        </div>

        <h3 className="font-display text-xl font-bold text-white mb-1">{current.title}</h3>
        <p className="text-gold-400/90 text-xs font-medium mb-3">{current.subtitle}</p>

        <p className="text-slate-300 text-sm leading-relaxed mb-4">{current.content}</p>

        <ul className="space-y-2 mb-6 bg-navy-950/60 p-3.5 rounded-xl border border-slate-800">
          {current.points.map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>

        {/* Progress dots */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-gold-400' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-navy-800 border border-slate-700 text-slate-300 text-xs hover:text-white transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 text-xs font-bold shadow-md shadow-gold-500/20 hover:shadow-gold-500/30 transition-all"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-navy-950 text-xs font-bold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
              >
                Get Started <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
