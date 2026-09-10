import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, Radio } from 'lucide-react';
import { api } from '@/lib/supabase';

export const SystemMonitor: React.FC = () => {
  const [latency, setLatency] = useState<number | null>(null);
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastCheck, setLastCheck] = useState<string>('Checking...');

  useEffect(() => {
    let mounted = true;

    const performPing = async () => {
      const res = await api.checkHealth();
      if (!mounted) return;
      setLatency(res.latencyMs);
      setIsHealthy(res.ok);
      setLastCheck(new Date().toLocaleTimeString());
    };

    performPing();
    const interval = setInterval(performPing, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900/90 border border-slate-700/60 text-[11px] shadow-sm">
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isHealthy ? 'bg-emerald-400' : 'bg-red-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isHealthy ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        />
      </span>

      <span className="font-medium text-slate-300">
        {isHealthy ? 'Systems Operational' : 'Degraded Performance'}
      </span>

      {latency !== null && (
        <span className="text-slate-400 font-mono text-[10px] pl-1 border-l border-slate-700">
          {latency}ms
        </span>
      )}
    </div>
  );
};
