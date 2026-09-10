import React from 'react';
import { LucideIcon, FileQuestion, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileQuestion,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`glass-card p-10 text-center border border-dashed border-slate-700/60 rounded-2xl max-w-lg mx-auto my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-navy-800/80 border border-gold-500/20 flex items-center justify-center mx-auto mb-4 text-gold-400 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="font-display text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && (
        <div>
          {actionHref ? (
            <Link
              to={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              {actionText}
            </Link>
          ) : onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              {actionText}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};
