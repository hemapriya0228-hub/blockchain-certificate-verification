// Global Crash Reporting & Diagnostic Telemetry Engine for ChainCert

export interface CrashReport {
  incidentId: string;
  timestamp: string;
  errorName: string;
  message: string;
  stack?: string;
  componentStack?: string;
  location: string;
  userAgent: string;
  online: boolean;
  viewport: string;
}

const CRASH_LOG_KEY = 'chaincert_crash_reports';
const MAX_CRASH_LOGS = 25;

export function generateIncidentId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `INC-${seg()}-${seg()}`;
}

export function logCrash(error: Error | string, componentStack?: string): CrashReport {
  const errObj = error instanceof Error ? error : new Error(String(error));
  const incidentId = generateIncidentId();

  const report: CrashReport = {
    incidentId,
    timestamp: new Date().toISOString(),
    errorName: errObj.name || 'ApplicationError',
    message: errObj.message || 'Unknown error occurred',
    stack: errObj.stack,
    componentStack,
    location: window.location.href,
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };

  console.error(`[CrashReporting] Incident ${incidentId}:`, report);

  try {
    const existing = getStoredCrashReports();
    existing.unshift(report);
    if (existing.length > MAX_CRASH_LOGS) existing.length = MAX_CRASH_LOGS;
    localStorage.setItem(CRASH_LOG_KEY, JSON.stringify(existing));
  } catch (e) {
    // Ignore storage quota
  }

  // Dispatch event for UI toasts or notifications if app is still mounted
  window.dispatchEvent(new CustomEvent('chaincert:crash', { detail: report }));

  return report;
}

export function getStoredCrashReports(): CrashReport[] {
  try {
    const data = localStorage.getItem(CRASH_LOG_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearCrashReports() {
  try {
    localStorage.removeItem(CRASH_LOG_KEY);
  } catch {}
}

export function downloadCrashDiagnostics(report: CrashReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `incident-${report.incidentId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Attach global unhandled rejection & error listeners once
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logCrash(reason instanceof Error ? reason : new Error(String(reason)));
  });

  window.addEventListener('error', (event) => {
    if (event.error) {
      logCrash(event.error);
    }
  });
}
