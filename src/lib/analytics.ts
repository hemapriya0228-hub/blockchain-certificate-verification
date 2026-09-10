// Lightweight Analytics & Telemetry Engine for ChainCert

export interface AnalyticsEvent {
  name: string;
  category: 'auth' | 'verification' | 'issuance' | 'navigation' | 'billing' | 'error' | 'engagement';
  properties?: Record<string, any>;
  timestamp: string;
}

const STORAGE_KEY = 'chaincert_analytics_events';
const CONSENT_KEY = 'chaincert_cookie_consent';
const MAX_STORED_EVENTS = 150;

class AnalyticsService {
  private hasConsent(): boolean {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      return consent === 'all' || consent === 'analytics' || consent === null; // default to allowed until explicitly rejected
    } catch {
      return true;
    }
  }

  public track(name: string, category: AnalyticsEvent['category'], properties?: Record<string, any>) {
    if (!this.hasConsent()) return;

    const event: AnalyticsEvent = {
      name,
      category,
      properties: {
        ...properties,
        url: window.location.pathname,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      },
      timestamp: new Date().toISOString(),
    };

    // 1. Console in development
    if (import.meta.env.DEV) {
      console.log(`[Analytics] [${category.toUpperCase()}] ${name}:`, properties);
    }

    // 2. Buffer in localStorage for audit & debugging
    try {
      const stored = this.getStoredEvents();
      stored.unshift(event);
      if (stored.length > MAX_STORED_EVENTS) stored.length = MAX_STORED_EVENTS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {
      // ignore storage errors
    }

    // 3. Dispatch custom event for in-app telemetry listeners
    window.dispatchEvent(new CustomEvent('chaincert:analytics', { detail: event }));
  }

  public trackPageView(pageName: string) {
    this.track(`view_${pageName}`, 'navigation', { page: pageName, title: document.title });
  }

  public getStoredEvents(): AnalyticsEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public clearEvents() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
}

export const analytics = new AnalyticsService();
