'use client';

import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  Binary, 
  Radio, 
  Sparkles,
  Info
} from 'lucide-react';
import { EvidenceItem } from '@/lib/types';

interface EvidenceListProps {
  evidenceList?: EvidenceItem[];
  triggeredCount?: number;
  verdict?: string;
  verdictLabel?: string;
}

export function EvidenceList({
  evidenceList = [],
  triggeredCount = 0,
  verdict = 'authentic',
  verdictLabel = 'AUTHENTIC / UNMANIPULATED'
}: EvidenceListProps) {
  const getSignalConfig = (key: string) => {
    switch (key) {
      case 'ela':
        return {
          icon: <Layers className="w-4 h-4 text-indigo-400" />,
          accent: 'indigo',
          badgeBg: 'bg-indigo-950/50',
          badgeBorder: 'border-indigo-500/30',
          badgeText: 'text-indigo-300'
        };
      case 'metadata':
        return {
          icon: <Binary className="w-4 h-4 text-emerald-400" />,
          accent: 'emerald',
          badgeBg: 'bg-emerald-950/50',
          badgeBorder: 'border-emerald-500/30',
          badgeText: 'text-emerald-300'
        };
      case 'frequency':
        return {
          icon: <Radio className="w-4 h-4 text-amber-400" />,
          accent: 'amber',
          badgeBg: 'bg-amber-950/50',
          badgeBorder: 'border-amber-500/30',
          badgeText: 'text-amber-300'
        };
      case 'spatial':
        return {
          icon: <Sparkles className="w-4 h-4 text-rose-400" />,
          accent: 'rose',
          badgeBg: 'bg-rose-950/50',
          badgeBorder: 'border-rose-500/30',
          badgeText: 'text-rose-300'
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-slate-400" />,
          accent: 'slate',
          badgeBg: 'bg-slate-900',
          badgeBorder: 'border-slate-800',
          badgeText: 'text-slate-300'
        };
    }
  };

  const isLikelyAI = triggeredCount >= 2;
  const isInconclusive = triggeredCount === 1;

  return (
    <div className="artistic-panel rounded-3xl p-6 border border-white/[0.08] flex flex-col gap-5">
      {/* Header & Multi-Signal Rule Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Multi-Signal Forensic Breakdown</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-normal bg-slate-900 border border-white/10 text-slate-300">
              {triggeredCount} of 4 Signals Flagged
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Requires at least 2 independent signals above calibrated threshold to confirm manipulation.
          </p>
        </div>

        {/* Verdict Banner */}
        <div className="flex items-center gap-2">
          {isLikelyAI ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-mono font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Likely AI / Manipulated</span>
            </div>
          ) : isInconclusive ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs font-mono font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Inconclusive (1 Signal)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-mono font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Authentic Camera Capture</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidenceList.map((item) => {
          const isTriggered = item.triggered;
          const config = getSignalConfig(item.key);

          return (
            <div
              key={item.key}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3.5 ${
                isTriggered
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-slate-900/50 border-white/[0.06] hover:border-white/10'
              }`}
            >
              {/* Signal Title & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-slate-800/80 border border-white/10`}>
                    {config.icon}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Threshold: {item.threshold.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-semibold border ${
                    isTriggered
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      : 'bg-slate-900 text-slate-400 border-white/[0.06]'
                  }`}
                >
                  {isTriggered ? 'FLAGGED' : 'NORMAL'}
                </span>
              </div>

              {/* Score Meter */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400 text-[11px]">Signal Intensity:</span>
                  <span className={`font-bold ${isTriggered ? 'text-rose-300' : 'text-slate-200'}`}>
                    {item.score.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/[0.06] relative">
                  {/* Calibrated threshold marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                    style={{ left: `${item.threshold}%` }}
                    title={`Threshold: ${item.threshold}%`}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isTriggered
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                        : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
                    }`}
                    style={{ width: `${Math.min(item.score, 100)}%` }}
                  />
                </div>
              </div>

              {/* Forensic Note */}
              <p className="text-[11px] text-slate-300 leading-relaxed border-t border-white/[0.06] pt-2.5">
                {item.note || 'Signal measured within expected photographic limits.'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
