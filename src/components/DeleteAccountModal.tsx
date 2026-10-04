import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { analytics } from '@/lib/analytics';

export const DeleteAccountModal: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setConfirmText('');
      setIsOpen(true);
    };
    window.addEventListener('chaincert:open-delete-account', handleOpen);
    return () => window.removeEventListener('chaincert:open-delete-account', handleOpen);
  }, []);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim() !== 'DELETE') {
      toast.error('Please type DELETE in all uppercase to confirm.');
      return;
    }

    setIsDeleting(true);
    analytics.track('account_deletion_initiated', 'auth', { userId: user?.id });

    try {
      await api.deleteAccount();
      toast.success('Your account and personal data have been permanently deleted.');
      logout();
      setIsOpen(false);
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card max-w-md w-full p-6 md:p-8 border border-red-500/40 shadow-2xl relative">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="font-display text-xl font-bold text-white mb-2">Delete Account</h3>
        <p className="text-slate-300 text-xs leading-relaxed mb-4">
          This action is permanent and cannot be undone. In compliance with GDPR and App Store guidelines:
        </p>

        <div className="p-3 bg-red-950/40 rounded-xl border border-red-500/20 text-xs text-red-200 space-y-1.5 mb-5">
          <div className="flex items-start gap-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>Permanent Data Removal:</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed pl-5">
            Your login credentials, profile, uncommitted drafts, and notification records will be purged. Public cryptographic block hashes already committed to the distributed ledger remain mathematically immutable.
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Type <span className="font-mono text-red-400 font-bold">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition-all font-mono"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-1/2 py-2.5 rounded-xl bg-navy-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:text-white transition-all"
            >
              Keep Account
            </button>
            <button
              type="submit"
              disabled={confirmText.trim() !== 'DELETE' || isDeleting}
              className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 hover:shadow-red-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete Forever'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
