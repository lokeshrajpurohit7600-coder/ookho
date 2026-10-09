'use client';

import React from 'react';
import { AlertOctagon, Cpu, Eye, Radio, Sparkles } from 'lucide-react';

interface TechniquesListProps {
  techniques?: string[] | null;
}

export function TechniquesList({ techniques = [] }: TechniquesListProps) {
  const list = techniques && techniques.length > 0 ? techniques : ['No anomalous synthetic techniques detected'];

  const getTechniqueConfig = (tech: string) => {
    const lower = tech.toLowerCase();
    if (lower.includes('face') || lower.includes('swap') || lower.includes('eye') || lower.includes('corneal')) {
      return {
        icon: <Eye className="w-4 h-4 text-rose-400" />,
        badgeBg: 'bg-rose-500/10',
        badgeBorder: 'border-rose-500/20'
      };
    }
    if (lower.includes('frequency') || lower.includes('noise') || lower.includes('spectral')) {
      return {
        icon: <Radio className="w-4 h-4 text-amber-400" />,
        badgeBg: 'bg-amber-500/10',
        badgeBorder: 'border-amber-500/20'
      };
    }
    if (lower.includes('gan') || lower.includes('diffusion') || lower.includes('synthetic')) {
      return {
        icon: <Cpu className="w-4 h-4 text-indigo-400" />,
        badgeBg: 'bg-indigo-500/10',
        badgeBorder: 'border-indigo-500/20'
      };
    }
    return {
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      badgeBg: 'bg-purple-500/10',
      badgeBorder: 'border-purple-500/20'
    };
  };

  return (
    <div className="artistic-panel rounded-3xl p-6 border border-white/[0.08] flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-semibold text-white">
            Detected Synthesis Techniques
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-white/[0.08]">
          {list.length} Identified
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.map((tech, idx) => {
          const config = getTechniqueConfig(tech);
          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-3 group"
            >
              <div className={`p-2 rounded-xl ${config.badgeBg} border ${config.badgeBorder} flex-shrink-0 group-hover:scale-105 transition-transform`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-200 block truncate group-hover:text-amber-200 transition-colors">
                  {tech}
                </span>
                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                  Signature #{idx + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
