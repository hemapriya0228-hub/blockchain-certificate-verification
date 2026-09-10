import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home, Copy, Check, Download } from 'lucide-react';
import { logCrash, downloadCrashDiagnostics, type CrashReport } from '@/lib/crashReporting';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  crashReport: CrashReport | null;
  copied: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    crashReport: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const report = logCrash(error, errorInfo.componentStack || undefined);
    this.setState({ errorInfo, crashReport: report });
  }

  private handleCopyDiagnostics = () => {
    if (!this.state.crashReport) return;
    navigator.clipboard.writeText(JSON.stringify(this.state.crashReport, null, 2));
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  private handleDownloadReport = () => {
    if (this.state.crashReport) {
      downloadCrashDiagnostics(this.state.crashReport);
    }
  };

  public render() {
    if (this.state.hasError) {
      const incidentId = this.state.crashReport?.incidentId || 'INC-UNKNOWN';

      return (
        <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full p-8 border border-red-500/30 text-center shadow-2xl shadow-red-500/10">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5 text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="font-display text-2xl font-bold text-white mb-2">Something Went Wrong</h1>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              An unexpected runtime error occurred. A diagnostic incident report has been recorded.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900/80 border border-red-500/20 text-xs font-mono text-slate-300 mb-6">
              <span>Incident ID:</span>
              <span className="text-gold-400 font-bold">{incidentId}</span>
            </div>

            {this.state.error && (
              <div className="bg-navy-950/90 rounded-xl p-4 text-left mb-6 border border-red-500/20 overflow-x-auto max-h-48 scrollbar-thin">
                <p className="text-red-400 font-mono text-xs font-semibold mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-slate-500 font-mono text-[11px] whitespace-pre-wrap mt-2">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleCopyDiagnostics}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-navy-800 border border-slate-700 text-slate-300 text-xs hover:border-gold-500/40 hover:text-white transition-all"
              >
                {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                {this.state.copied ? 'Copied Diagnostics' : 'Copy Diagnostics'}
              </button>

              <button
                type="button"
                onClick={this.handleDownloadReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-navy-800 border border-slate-700 text-slate-300 text-xs hover:border-gold-500/40 hover:text-white transition-all"
              >
                <Download className="w-3.5 h-3.5 text-gold-400" />
                Download Report (.json)
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/';
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-navy-800 border border-gold-500/20 text-white text-xs font-semibold hover:bg-navy-700 transition-all"
              >
                <Home className="w-4 h-4 text-gold-400" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
