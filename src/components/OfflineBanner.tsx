import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600/90 text-navy-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-lg sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-center">
        <WifiOff className="w-4 h-4 text-navy-950 animate-pulse" />
        <span>
          You are currently offline. Verification checks and database synchronization may be delayed.
        </span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ml-2 inline-flex items-center gap-1 underline hover:text-black font-bold"
        >
          <RefreshCw className="w-3 h-3" /> Retry Connection
        </button>
      </div>
    </div>
  );
};
