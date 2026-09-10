import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard, truncateHash } from '@/lib/utils';

interface HashDisplayProps {
  hash: string;
  label?: string;
  truncate?: boolean;
  className?: string;
}

export default function HashDisplay({ hash, label, truncate = true, className = '' }: HashDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(hash);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const display = truncate ? truncateHash(hash) : hash;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-slate-500 text-xs font-medium">{label}:</span>}
      <code className="font-mono text-xs text-gold-400/90 bg-navy-800/50 px-2 py-1 rounded">
        {display}
      </code>
      <button
        onClick={handleCopy}
        className="text-slate-500 hover:text-gold-400 transition-colors p-1 rounded hover:bg-navy-700/50"
        title="Copy to clipboard"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
