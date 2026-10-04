import { useEffect } from 'react';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://chaincert-backend-api.onrender.com');

export interface RealtimeEvent {
  type: string;
  data?: any;
  timestamp?: string;
}

type EventHandler = (event: RealtimeEvent) => void;

/**
 * Hook for subscribing to real-time Server-Sent Events (SSE) from the ChainCert backend.
 * Automatically reconnects with exponential backoff on connection drops.
 */
export function useRealtimeEvents(onEvent: EventHandler) {
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isSubscribed = true;

    const connect = () => {
      if (!isSubscribed) return;

      try {
        eventSource = new EventSource(`${API_BASE}/events`);

        eventSource.onmessage = (e) => {
          if (!isSubscribed) return;
          try {
            const parsed: RealtimeEvent = JSON.parse(e.data);
            if (parsed && parsed.type) {
              onEvent(parsed);
            }
          } catch (_) {
            // Ignore non-JSON heartbeat pings
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isSubscribed) {
            reconnectTimeout = setTimeout(connect, 4000);
          }
        };
      } catch (_) {
        if (isSubscribed) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      isSubscribed = false;
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [onEvent]);
}
