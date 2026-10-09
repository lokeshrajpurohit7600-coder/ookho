'use client';

import React from 'react';
import { ShieldCheck, Binary, Cpu } from 'lucide-react';

interface MetadataAuditorProps {
  metadata?: Record<string, any> | null;
  models?: Record<string, string> | null;
}

export function MetadataAuditor({ metadata, models }: MetadataAuditorProps) {
  const metadataEntries = metadata ? Object.entries(metadata) : [];
  const modelEntries = models ? Object.entries(models) : [];

  return (
    <div className="artistic-panel rounded-3xl p-6 border border-white/[0.08] flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">
            Forensic Metadata & Model Audit Trail
          </h3>
        </div>
        <span className="text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Tamper-Evident Record
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metadata Findings */}
        <div>
          <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-3">
            EXIF & File Provenance
          </h4>
          <div className="space-y-2">
            {metadataEntries.length > 0 ? (
              metadataEntries.map(([key, val]) => (
                <div 
                  key={key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs"
                >
                  <span className="text-slate-400 font-mono capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono font-medium text-slate-200">
                    {typeof val === 'boolean' 
                      ? (val ? 'Anomaly Detected' : 'Normal') 
                      : (val === null ? 'None (Stripped)' : String(val))}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-mono">No metadata records found.</p>
            )}
          </div>
        </div>

        {/* Contributing Model Versions */}
        <div>
          <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-3">
            Contributing Detector Models
          </h4>
          <div className="space-y-2">
            {modelEntries.length > 0 ? (
              modelEntries.map(([modelKey, version]) => (
                <div 
                  key={modelKey}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-400 font-mono capitalize">
                      {modelKey.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="font-mono font-medium text-indigo-300 px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-[11px]">
                    {version}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-mono">No detector versions recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
