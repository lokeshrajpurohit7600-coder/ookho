'use client';

import React from 'react';
import { Cpu, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

interface ConfidenceGaugeProps {
  aiConfidence: number;      // 0 - 100
  editConfidence?: number;  // 0 - 100
  verdict?: string;
  verdictLabel?: string;
  triggeredCount?: number;
}

export function ConfidenceGauge({ 
  aiConfidence, 
  editConfidence = 0,
  verdict,
  verdictLabel,
  triggeredCount
}: ConfidenceGaugeProps) {
  // 1. Determine classification
  const isHighRisk = verdict === 'likely_ai' || verdict === 'likely_synthetic' || (!verdict && aiConfidence >= 60);
  const isMediumRisk = !isHighRisk && (verdict === 'inconclusive' || (!verdict && aiConfidence >= 35 && aiConfidence < 60));
  const isNatural = !isHighRisk && !isMediumRisk;

  const naturalPercentage = Math.max(0, 100 - aiConfidence);

  // 2. Color and labels based on user requirements:
  // RED for AI Manipulated, GREEN for Natural (Not Manipulated), AMBER for Inconclusive
  const riskColor = isHighRisk 
    ? '#ef4444' // Vibrant Red
    : isMediumRisk 
      ? '#f59e0b' // Amber
      : '#10b981'; // Vibrant Emerald Green

  const displayLabel = isHighRisk
    ? '🔴 AI MANIPULATED'
    : isMediumRisk
      ? '🟡 INCONCLUSIVE'
      : '🟢 NATURAL (NOT MANIPULATED)';

  const centralValue = isNatural ? naturalPercentage : aiConfidence;
  const centralLabel = isHighRisk 
    ? 'AI Manipulated' 
    : isNatural 
      ? 'Natural (Not Manipulated)' 
      : 'Synthetic Indicator';

  // SVG Gauge calculations (Semi-circle from 180deg to 0deg)
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half-circle arc length
  const progress = Math.min(Math.max(centralValue, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className={`artistic-panel rounded-3xl p-6 border flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 ${
        isHighRisk 
          ? 'border-red-500/40 bg-gradient-to-b from-red-950/20 via-slate-900/90 to-slate-900/90 shadow-lg shadow-red-500/5' 
          : isNatural
            ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-slate-900/90 to-slate-900/90 shadow-lg shadow-emerald-500/5'
            : 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-slate-900/90 to-slate-900/90 shadow-lg shadow-amber-500/5'
      }`}
    >
      {/* Top Badge Header */}
      <div className="flex items-center justify-between w-full mb-4">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          Neural Assessment
        </span>
        <span 
          className="text-[11px] font-mono px-3 py-1 rounded-full border font-bold tracking-wide shadow-xs"
          style={{
            color: riskColor,
            borderColor: `${riskColor}50`,
            backgroundColor: `${riskColor}18`
          }}
        >
          {displayLabel}
        </span>
      </div>

      {/* Gauge Visual */}
      <div className="relative w-56 h-32 flex items-end justify-center my-3">
        <svg className="w-56 h-32 overflow-visible" viewBox="0 0 200 110">
          <defs>
            <linearGradient id="gaugeBg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeBg)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Animated Value Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={riskColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Central Metric Readout */}
        <div className="absolute bottom-0 flex flex-col items-center">
          <div className="flex items-baseline">
            <span 
              className="text-4xl sm:text-5xl font-black tracking-tight font-mono"
              style={{ color: riskColor }}
            >
              {centralValue.toFixed(1)}
            </span>
            <span className="text-xl font-bold ml-1 font-mono" style={{ color: riskColor }}>%</span>
          </div>
          <span 
            className="text-[11px] uppercase tracking-wider font-bold mt-0.5"
            style={{ color: riskColor }}
          >
            {centralLabel}
          </span>
        </div>
      </div>

      {/* Outcome Verdict Explanation Box */}
      {isHighRisk && (
        <div className="w-full mt-4 p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-left flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-red-300">AI MANIPULATED</div>
            <p className="text-[11px] text-red-200/80 leading-relaxed mt-0.5">
              High probability of synthetic generative artifacts or digital manipulation ({aiConfidence.toFixed(1)}% AI).
            </p>
          </div>
        </div>
      )}

      {isNatural && (
        <div className="w-full mt-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-left flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-emerald-300">NATURAL / NOT MANIPULATED</div>
            <p className="text-[11px] text-emerald-200/80 leading-relaxed mt-0.5">
              Media exhibits natural sensor noise, consistent optical lighting, and continuous frequency decay ({naturalPercentage.toFixed(1)}% Natural).
            </p>
          </div>
        </div>
      )}

      {isMediumRisk && (
        <div className="w-full mt-4 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-left flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-amber-300">INCONCLUSIVE (1 SIGNAL FLAGGED)</div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
              Single discrepancy observed without multi-signal corroboration. Natural Coherence: {naturalPercentage.toFixed(1)}%.
            </p>
          </div>
        </div>
      )}

      {/* Secondary Metric: Edit Confidence Bar */}
      <div className="w-full mt-4 pt-3.5 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400">Manual / Tool Edit Disparity:</span>
          <span className="font-mono font-semibold text-slate-200">{editConfidence.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500"
            style={{ width: `${Math.min(Math.max(editConfidence, 0), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
