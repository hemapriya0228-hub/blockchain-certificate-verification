import React from 'react';
import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs font-semibold text-gold-400 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            GDPR, CCPA & App Store Compliant
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm">
            Effective Date: September 2026 • Last updated: September 10, 2026
          </p>
        </div>

        {/* Content Card */}
        <div className="glass-card p-8 sm:p-12 border border-gold-500/10 rounded-2xl space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-gold-400" />
              1. Our Zero-Knowledge Privacy Architecture
            </h2>
            <p className="mb-3">
              ChainCert operates on a privacy-first cryptographic foundation. Unlike traditional centralized databases, ChainCert <strong>does NOT</strong> store sensitive personal student records, grades, or government identity documents on the public blockchain ledger.
            </p>
            <p>
              When a certificate is processed, our system calculates a 256-bit cryptographic digest (SHA-256 hash) of the document content. Only this irreversible hash is written to the distributed ledger. It is mathematically impossible to reconstruct the original certificate or extract personally identifiable information (PII) from this hash.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-gold-400" />
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>
                <strong>Account Information:</strong> When faculty or administrators register, we collect email addresses, display names, and institutional roles strictly for authentication and authorization.
              </li>
              <li>
                <strong>Certificate Metadata:</strong> Student names, course titles, and issue dates submitted by authorized educators for the purpose of generating verification badges.
              </li>
              <li>
                <strong>Technical Logs:</strong> IP address and user-agent data are retained in temporary rate-limiting logs for a maximum of 30 days to defend against distributed denial-of-service (DDoS) attacks.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold-400" />
              3. Data Retention & Deletion Rights (GDPR / CCPA)
            </h2>
            <p className="mb-3">
              You retain full rights to your personal data under the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className="p-4 bg-navy-900/60 rounded-xl border border-slate-800">
                <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Right to Erasure
                </div>
                <p className="text-xs text-slate-400">
                  You can permanently delete your user account and personal drafts at any time directly through the app settings.
                </p>
              </div>
              <div className="p-4 bg-navy-900/60 rounded-xl border border-slate-800">
                <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Right to Portability
                </div>
                <p className="text-xs text-slate-400">
                  Export all issued certificates and cryptographic verification receipts in open JSON / CSV formats.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Third-Party Services & Subprocessors</h2>
            <p>
              We partner only with security-audited infrastructure providers:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2 text-slate-300">
              <li><strong>Supabase:</strong> Encrypted PostgreSQL database and authentication provider (SOC 2 Type II compliant).</li>
              <li><strong>Vercel:</strong> Global CDN and edge delivery network.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Contact Our Data Protection Officer (DPO)</h2>
            <p>
              If you have any questions regarding privacy compliance or wish to exercise your data rights, contact our privacy officer at{' '}
              <a href="mailto:privacy@chaincert.io" className="text-gold-400 underline">
                privacy@chaincert.io
              </a>{' '}
              or submit a request via our{' '}
              <Link to="/support" className="text-gold-400 underline">
                Support Desk
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
