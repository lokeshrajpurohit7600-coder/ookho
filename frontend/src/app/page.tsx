'use client';

import React from 'react';
import { UploadWidget } from '@/components/UploadWidget';
import { 
  Eye, 
  Radio, 
  Layers,
  History 
} from 'lucide-react';
import { useHistory } from '@/context/HistoryContext';

export default function HomePage() {
  const { openHistory } = useHistory();

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start pb-20 artistic-canvas overflow-hidden">
      {/* Subtle organic artistic ambient color blooms */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-500/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-rose-500/[0.06] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-80 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* HERO SECTION */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-4 text-center relative z-10 flex flex-col items-center">

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          See the Truth in Every Pixel.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300">
            Verify Digital Reality.
          </span>
        </h1>

        {/* UPLOAD WIDGET */}
        <div className="w-full mt-7">
          <UploadWidget />
        </div>
      </section>

      {/* 4 ARTISTIC SIGNALS METRICS BAR */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Signal 1: Spatial & Face Coherence */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] hover:border-rose-500/30 transition-all flex flex-col items-center text-center group">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-2 group-hover:scale-105 transition-transform">
              <Eye className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold font-mono text-white">99.4%</span>
            <span className="text-xs text-rose-300/80 font-medium mt-0.5">Spatial Facial Coherence</span>
          </div>

          {/* Signal 2: Frequency & Sensor Noise */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] hover:border-amber-500/30 transition-all flex flex-col items-center text-center group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-105 transition-transform">
              <Radio className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold font-mono text-white">&lt; 1.8s</span>
            <span className="text-xs text-amber-300/80 font-medium mt-0.5">Frequency & DCT Spectrum</span>
          </div>

          {/* Signal 3: Error Level Analysis */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] hover:border-indigo-500/30 transition-all flex flex-col items-center text-center group">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold font-mono text-white">Multi-Layer</span>
            <span className="text-xs text-indigo-300/80 font-medium mt-0.5">Heatmap Localization</span>
          </div>

          {/* Signal 4: Search & Scan History (Replaced C2PA) */}
          <button
            type="button"
            onClick={openHistory}
            className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] hover:border-emerald-500/40 hover:bg-slate-900/90 transition-all flex flex-col items-center text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 w-full"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold font-mono text-white group-hover:text-emerald-300 transition-colors">
              History
            </span>
            <span className="text-xs text-emerald-300/80 font-medium mt-0.5">
              Previous Searches & Audit
            </span>
          </button>
        </div>
      </section>

    </div>
  );
}
