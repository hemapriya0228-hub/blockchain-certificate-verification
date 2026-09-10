import React from 'react';
import { ShieldAlert, CheckCircle, Scale, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs font-semibold text-gold-400 mb-4">
            <Scale className="w-4 h-4 text-gold-400" />
            Terms & Conditions
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-sm">
            Effective Date: September 2026 • ChainCert Credential Platform
          </p>
        </div>

        <div className="glass-card p-8 sm:p-12 border border-gold-500/10 rounded-2xl space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold-400" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using ChainCert (&quot;the Platform&quot;), including verifying certificates, registering as an educator or student, or interacting with the blockchain ledger, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-gold-400" />
              2. Nature of Decentralized Verification
            </h2>
            <p className="mb-3">
              ChainCert provides cryptographic mathematical verification that a given digital file exactly matches the SHA-256 hash committed into an immutable blockchain ledger block.
            </p>
            <p>
              ChainCert certifies the tamper-evident state and issuance timestamp of the hash; however, the legal validity of academic accreditations remains with the issuing institution.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gold-400" />
              3. User Responsibilities & Prohibited Uses
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You agree not to upload malware, corrupt payloads, or fraudulent identity documentation.</li>
              <li>You will not attempt to reverse engineer, disrupt, or flood the API endpoints.</li>
              <li>Authorized educators are solely responsible for ensuring certificate accuracy before final administrative submission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Subscriptions & Refunds</h2>
            <p>
              Pro and Institutional subscriptions are billed according to chosen monthly or annual billing cycles. You may cancel at any time. Subscriptions restored via valid receipts or license keys will remain active for the duration of the purchased term.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Inquiries & Legal Notices</h2>
            <p>
              For legal inquiries or copyright notices, please visit our{' '}
              <Link to="/support" className="text-gold-400 underline">
                Support Desk
              </Link>{' '}
              or reach out to legal@chaincert.io.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
