import React, { useState } from 'react';
import { HelpCircle, Send, CheckCircle2, Search, BookOpen, MessageSquare, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { analytics } from '@/lib/analytics';
import { generateTicketId } from '@/components/SupportModal';

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('verification');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const faqs = [
    {
      q: 'How does cryptographic certificate verification work?',
      a: 'ChainCert takes the digital certificate document and calculates its SHA-256 cryptographic digest. It queries the immutable blockchain ledger for this hash. If the hashes match, the certificate is verified as authentic and unaltered.',
      category: 'verification',
    },
    {
      q: 'Why does my certificate status show "Tampered"?',
      a: 'Any modification—even adding a space, editing a date, or altering an institutional signature—changes the underlying SHA-256 hash. If the computed hash does not match the ledger, the document is flagged as tampered.',
      category: 'verification',
    },
    {
      q: 'How do educators get permission to issue certificates?',
      a: 'Educators register with their institutional email and select the Teacher role. An authorized system administrator reviews and approves the account in the Admin Dashboard before issuance capabilities are activated.',
      category: 'accounts',
    },
    {
      q: 'Can I delete my account and personal data?',
      a: 'Yes. In full accordance with GDPR guidelines, users can permanently delete their personal profiles and data in the account settings menu.',
      category: 'privacy',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const ticketId = generateTicketId();
    analytics.track('support_page_ticket_submitted', 'engagement', { ticketId, category });

    setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem('chaincert_tickets') || '[]');
        stored.unshift({
          ticketId,
          category,
          email,
          subject,
          message,
          timestamp: new Date().toISOString(),
          status: 'open',
        });
        localStorage.setItem('chaincert_tickets', JSON.stringify(stored));
      } catch {}

      setIsSubmitting(false);
      setSubmittedTicket(ticketId);
      toast.success(`Support ticket ${ticketId} created!`);
    }, 1200);
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs font-semibold text-gold-400 mb-4">
            <HelpCircle className="w-4 h-4 text-gold-400" />
            24/7 Academic & Technical Support
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
            How Can We Help You?
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mb-6">
            Search our knowledge base or submit a ticket directly to our blockchain infrastructure engineers.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search verification, drafts, billing, or ledger questions..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-navy-900/90 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-gold-500 transition-all shadow-xl"
            />
          </div>
        </div>

        {/* Quick Help Status Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <Link
            to="/status"
            className="glass-card p-4 border border-emerald-500/20 rounded-2xl flex items-center justify-between hover:border-emerald-500/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <h4 className="text-white font-semibold text-xs">Live System Status</h4>
                <p className="text-emerald-400 text-[11px]">All Services 100% Operational</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            to="/verify"
            className="glass-card p-4 border border-gold-500/20 rounded-2xl flex items-center justify-between hover:border-gold-500/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-gold-400" />
              <div>
                <h4 className="text-white font-semibold text-xs">Instant Verifier</h4>
                <p className="text-slate-400 text-[11px]">Verify credentials on-chain</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            to="/ledger"
            className="glass-card p-4 border border-indigo-500/20 rounded-2xl flex items-center justify-between hover:border-indigo-500/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="text-white font-semibold text-xs">Public Ledger</h4>
                <p className="text-slate-400 text-[11px]">Inspect cryptographic blocks</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        {/* Main Content Grid: FAQ on left, Ticket Form on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* FAQ Column */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold-400" />
              Frequently Asked Questions
            </h3>

            {filteredFaqs.length === 0 ? (
              <p className="text-slate-400 text-sm">No answers matched your query. Use the ticket form to reach out!</p>
            ) : (
              filteredFaqs.map((item, idx) => (
                <div key={idx} className="glass-card p-5 border border-slate-800 rounded-2xl">
                  <h4 className="font-semibold text-white text-sm mb-2">{item.q}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.a}</p>
                </div>
              ))
            )}
          </div>

          {/* Ticket Form Column */}
          <div className="lg:col-span-5">
            <div className="glass-card p-6 sm:p-8 border border-gold-500/20 rounded-3xl sticky top-24 shadow-2xl">
              <h3 className="font-display text-lg font-bold text-white mb-1 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gold-400" />
                Submit Support Ticket
              </h3>
              <p className="text-slate-400 text-xs mb-6">
                Receive guaranteed email response within 2 hours.
              </p>

              {submittedTicket ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-white font-bold text-base mb-1">Ticket Submitted!</h4>
                  <p className="text-slate-400 text-xs mb-4">
                    Your inquiry has been assigned to our tier-1 engineering queue.
                  </p>
                  <div className="inline-block px-4 py-2 bg-navy-900 border border-emerald-500/30 rounded-xl font-mono text-xs text-emerald-300 font-bold mb-5">
                    Ref: {submittedTicket}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setSubmittedTicket(null)}
                      className="px-4 py-2 rounded-xl bg-navy-800 border border-slate-700 text-xs text-slate-300 hover:text-white"
                    >
                      Submit Another Ticket
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-gold-500"
                    >
                      <option value="verification">Verification Issue</option>
                      <option value="issuance">Drafts & Issuance</option>
                      <option value="billing">Billing & Subscriptions</option>
                      <option value="privacy">GDPR / Data Privacy</option>
                      <option value="bug">Bug Report</option>
                      <option value="other">General Technical Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@institution.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Summary of issue"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe what occurred or how we can assist..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-gold-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting Ticket...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Support Ticket
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
