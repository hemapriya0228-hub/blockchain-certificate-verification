import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, ShieldCheck, Database, Award, CheckCircle, Download, Sparkles, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StoreShowcase() {
  const [deviceFrame, setDeviceFrame] = useState<'iphone' | 'ipad' | 'desktop'>('iphone');
  const [selectedSlide, setSelectedSlide] = useState(0);

  const slides = [
    {
      id: 1,
      badge: 'Screenshot 1 / 5',
      headline: 'Trustless Verification in Seconds',
      subline: 'Verify certificate authenticity instantly with cryptographic SHA-256 accuracy.',
      icon: ShieldCheck,
      color: 'from-amber-500/20 to-gold-500/10',
      uiContent: (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-emerald-300 font-bold text-sm tracking-wider uppercase">Authentic & Verified</span>
            <div className="text-slate-300 text-xs mt-1">Certificate #CERT-8F92-91AB</div>
          </div>
          <div className="p-3 bg-navy-900 rounded-xl border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Student:</span> <strong className="text-white">Alex Chen</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Institution:</span> <strong className="text-white">Stanford University</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Block Index:</span> <strong className="text-gold-400 font-mono">#42</strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      badge: 'Screenshot 2 / 5',
      headline: 'Immutable Blockchain Ledger',
      subline: 'Every credential hash is mathematically chained to the previous block.',
      icon: Database,
      color: 'from-indigo-500/20 to-purple-500/10',
      uiContent: (
        <div className="space-y-3 font-mono text-[11px]">
          <div className="p-3 rounded-xl bg-navy-900/90 border border-slate-800">
            <div className="text-gold-400 font-bold mb-1 flex items-center justify-between">
              <span>Block #42</span> <span className="text-emerald-400 text-[10px]">Verified Chain</span>
            </div>
            <div className="text-slate-400 truncate">Hash: 8a4f9b2c...5e1d</div>
            <div className="text-slate-500 truncate">Prev: 3c1a8e7f...90ab</div>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/90 border border-slate-800">
            <div className="text-gold-400 font-bold mb-1 flex items-center justify-between">
              <span>Block #41</span> <span className="text-emerald-400 text-[10px]">Confirmed</span>
            </div>
            <div className="text-slate-400 truncate">Hash: 3c1a8e7f...90ab</div>
            <div className="text-slate-500 truncate">Prev: 7e2d4f10...44cc</div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      badge: 'Screenshot 3 / 5',
      headline: 'Enterprise Administration Portal',
      subline: 'Multi-role RBAC governance, faculty approval queues & audit logs.',
      icon: Award,
      color: 'from-blue-500/20 to-cyan-500/10',
      uiContent: (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-navy-900 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px]">Issued Certs</div>
              <div className="text-white font-bold text-base">1,248</div>
            </div>
            <div className="p-2.5 bg-navy-900 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px]">Pending Drafts</div>
              <div className="text-gold-400 font-bold text-base">3 New</div>
            </div>
          </div>
          <div className="p-2.5 bg-navy-900 rounded-xl border border-gold-500/20 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Prof. Vance Draft</div>
              <div className="text-[10px] text-slate-400">Data Science Master's</div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-[10px]">Approve</span>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      badge: 'Screenshot 4 / 5',
      headline: 'Faculty Draft & Batch Issuance',
      subline: 'Seamlessly prepare credentials, upload PDFs, and compute SHA-256 digests.',
      icon: Sparkles,
      color: 'from-emerald-500/20 to-teal-500/10',
      uiContent: (
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-navy-900 rounded-xl border border-dashed border-slate-700 text-center">
            <QrCode className="w-8 h-8 text-gold-400 mx-auto mb-1" />
            <div className="text-white font-semibold">Embedded QR Verification</div>
            <div className="text-[10px] text-slate-400">Scannable by any mobile camera</div>
          </div>
          <div className="p-2.5 bg-navy-900 rounded-xl border border-slate-800 flex justify-between">
            <span className="text-slate-400">Digest Engine:</span>
            <span className="text-emerald-400 font-mono text-[10px]">SHA-256 (256-bit)</span>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      badge: 'Screenshot 5 / 5',
      headline: 'Zero-Knowledge Tamper Detection',
      subline: 'Any alteration flags the document immediately. Guaranteed tamper proof.',
      icon: ShieldCheck,
      color: 'from-red-500/20 to-rose-500/10',
      uiContent: (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-center">
            <span className="text-red-400 font-bold text-xs uppercase tracking-wider">Tamper Detected!</span>
            <p className="text-slate-300 text-[11px] mt-1">
              File digest does not match block #42 on-chain record.
            </p>
          </div>
          <div className="p-2.5 bg-navy-900 rounded-xl border border-slate-800 font-mono text-[10px] space-y-1">
            <div className="text-red-400 truncate">Uploaded: c92a1...44ff</div>
            <div className="text-emerald-400 truncate">On-Chain: 8a4f9...5e1d</div>
          </div>
        </div>
      ),
    },
  ];

  const handleDownload = () => {
    toast.success('High-resolution App Store mockups packaged for export!');
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs font-semibold text-gold-400 mb-4">
            <Sparkles className="w-4 h-4 text-gold-400" />
            App Store & Play Store Screenshot Showcase
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
            Production Marketing Showcase
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            High-fidelity device mockups and feature callouts ready for App Store submission (1284x2778 iPhone 6.7&quot; / iPad / Web).
          </p>

          {/* Device Switcher */}
          <div className="inline-flex items-center gap-2 mt-6 p-1 bg-navy-900/90 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setDeviceFrame('iphone')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                deviceFrame === 'iphone' ? 'bg-gold-500 text-navy-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> iPhone 6.7&quot;
            </button>
            <button
              type="button"
              onClick={() => setDeviceFrame('ipad')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                deviceFrame === 'ipad' ? 'bg-gold-500 text-navy-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" /> iPad 12.9&quot;
            </button>
            <button
              type="button"
              onClick={() => setDeviceFrame('desktop')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                deviceFrame === 'desktop' ? 'bg-gold-500 text-navy-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop Web
            </button>
          </div>
        </div>

        {/* Thumbnail Selector */}
        <div className="flex justify-center gap-2 mb-10 overflow-x-auto py-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSlide(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedSlide === idx
                  ? 'bg-navy-800 border-2 border-gold-500 text-white shadow-lg shadow-gold-500/20'
                  : 'bg-navy-900/80 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s.badge}: {s.headline.split(' ')[0]} {s.headline.split(' ')[1]}
            </button>
          ))}
        </div>

        {/* Active Mockup Display */}
        {(() => {
          const current = slides[selectedSlide];
          const Icon = current.icon;

          return (
            <div className="glass-card p-8 sm:p-12 border border-gold-500/20 rounded-3xl mb-12 relative overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                {/* Left Description */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs font-bold text-gold-400">
                    <Icon className="w-3.5 h-3.5" />
                    {current.badge}
                  </div>
                  <h2 className="font-display text-2xl sm:text-4xl font-bold text-white">
                    {current.headline}
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {current.subline}
                  </p>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-gold-500/20 hover:shadow-gold-500/30 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Asset (.PNG)
                    </button>
                  </div>
                </div>

                {/* Right Device Frame */}
                <div className="lg:col-span-7 flex justify-center">
                  <div
                    className={`transition-all duration-300 p-4 rounded-[40px] border-4 border-slate-700 bg-navy-950 shadow-2xl shadow-navy-950/90 ${
                      deviceFrame === 'iphone'
                        ? 'w-[320px] max-w-full'
                        : deviceFrame === 'ipad'
                        ? 'w-[480px] max-w-full'
                        : 'w-[600px] max-w-full'
                    }`}
                  >
                    {/* Speaker/Camera notch */}
                    <div className="w-24 h-4 rounded-full bg-slate-800 mx-auto mb-4" />

                    {/* Inside Display */}
                    <div className="rounded-3xl p-5 bg-gradient-to-b from-navy-900 to-navy-950 border border-slate-800 min-h-[360px] flex flex-col justify-between">
                      <div>
                        {/* Header bar */}
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-gold-400" /> ChainCert
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">Live On-Chain</span>
                        </div>

                        {/* Slide UI */}
                        {current.uiContent}
                      </div>

                      <div className="pt-4 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
                        Cryptographic Verification Engine • ChainCert v2.0
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Gallery Grid of all 5 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {slides.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setSelectedSlide(idx)}
              className={`glass-card p-4 rounded-2xl border cursor-pointer transition-all hover:scale-105 ${
                selectedSlide === idx
                  ? 'border-gold-500 bg-gold-500/5 shadow-lg shadow-gold-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] text-gold-400 font-bold mb-1">{s.badge}</div>
              <h4 className="text-white font-semibold text-xs mb-1 line-clamp-1">{s.headline}</h4>
              <p className="text-slate-400 text-[11px] line-clamp-2">{s.subline}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
