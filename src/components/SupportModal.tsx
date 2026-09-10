import React, { useState, useEffect } from 'react';
import { HelpCircle, Send, CheckCircle2, X, MessageSquare, BookOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { analytics } from '@/lib/analytics';

export function generateTicketId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `TICK-${seg()}-${seg()}`;
}

export const SupportModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ticket' | 'faq'>('ticket');
  const [category, setCategory] = useState('verification');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = () => {
      setSubmittedTicket(null);
      setIsOpen(true);
    };
    window.addEventListener('chaincert:open-support', handleOpen);
    return () => window.removeEventListener('chaincert:open-support', handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const ticketId = generateTicketId();
    analytics.track('support_ticket_submitted', 'engagement', { ticketId, category });

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
      toast.success(`Ticket ${ticketId} created! Support team notified.`);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card max-w-lg w-full p-6 md:p-8 border border-gold-500/30 shadow-2xl relative">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">ChainCert Support Desk</h3>
            <p className="text-slate-400 text-xs">24/7 Academic & Cryptographic Technical Assistance</p>
          </div>
        </div>

        {/* Tab Switch */}
        <div className="flex border-b border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('ticket')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'ticket'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Submit Support Ticket
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'faq'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Instant Answers (FAQ)
          </button>
        </div>

        {activeTab === 'faq' ? (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin text-xs">
            <div className="p-3 bg-navy-900/80 rounded-xl border border-slate-800">
              <h5 className="font-semibold text-white mb-1">Why does verification say "Tampered"?</h5>
              <p className="text-slate-400 leading-relaxed">
                Even a single changed byte or comma in the uploaded certificate PDF generates a completely different SHA-256 hash than the one immutably recorded in the blockchain block.
              </p>
            </div>
            <div className="p-3 bg-navy-900/80 rounded-xl border border-slate-800">
              <h5 className="font-semibold text-white mb-1">Are gas fees charged for verifying?</h5>
              <p className="text-slate-400 leading-relaxed">
                No. Verification is read-only cryptographic validation and is 100% free with zero gas fees.
              </p>
            </div>
            <div className="p-3 bg-navy-900/80 rounded-xl border border-slate-800">
              <h5 className="font-semibold text-white mb-1">How do newly registered accounts get approved?</h5>
              <p className="text-slate-400 leading-relaxed">
                Faculty and student registrations are placed in a 'pending' state. An authorized institutional administrator reviews credentials in the Admin Dashboard before granting access.
              </p>
            </div>
          </div>
        ) : submittedTicket ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-white font-bold text-base mb-1">Support Ticket Created!</h4>
            <p className="text-slate-400 text-xs mb-3">
              Our engineering & support engineers have received your inquiry.
            </p>
            <div className="inline-block px-4 py-2 bg-navy-900 border border-emerald-500/30 rounded-xl font-mono text-xs text-emerald-300 font-bold mb-5">
              Reference: {submittedTicket}
            </div>
            <div>
              <button
                type="button"
                onClick={() => setSubmittedTicket(null)}
                className="px-4 py-2 rounded-xl bg-navy-800 border border-slate-700 text-xs text-slate-300 hover:text-white"
              >
                Submit Another Inquiry
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-gold-500"
                >
                  <option value="verification">Verification Issue</option>
                  <option value="issuance">Drafts & Issuance</option>
                  <option value="billing">Billing & Tiers</option>
                  <option value="bug">Bug Report</option>
                  <option value="other">General Inquiry</option>
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
                  className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your inquiry"
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Message / Details</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or error details..."
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-gold-500 resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Submit Support Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
