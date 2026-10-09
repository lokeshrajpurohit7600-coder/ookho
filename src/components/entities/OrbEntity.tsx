import React, { useState } from 'react';
import type { EngineEntity } from '../../types/engine';
import { Zap, X } from 'lucide-react';

interface OrbEntityProps {
  entity: EngineEntity;
  registerDomRef: (id: string, el: HTMLElement | null) => void;
  onStartDrag: (id: string, clientX: number, clientY: number) => void;
  onRemove?: (id: string) => void;
}

export const OrbEntity: React.FC<OrbEntityProps> = ({
  entity,
  registerDomRef,
  onStartDrag,
  onRemove,
}) => {
  const [isCharged, setIsCharged] = useState<boolean>(false);
  const radius = entity.dimensions?.radius || 50;
  const diameter = radius * 2;
  const isCyan = entity.metadata?.accentColor !== 'emerald';

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    onStartDrag(entity.id, e.clientX, e.clientY);
  };

  const handleKick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCharged(true);
    setTimeout(() => setIsCharged(false), 800);
  };

  return (
    <div
      ref={(el) => registerDomRef(entity.id, el)}
      onPointerDown={handlePointerDown}
      onClick={handleKick}
      style={{
        width: `${diameter}px`,
        height: `${diameter}px`,
        position: 'absolute',
        top: 0,
        left: 0,
        willChange: 'transform',
      }}
      className="absolute select-none cursor-grab active:cursor-grabbing rounded-full flex items-center justify-center group"
    >
      {/* Outer Rotating Energy Ring */}
      <div
        className={`absolute inset-0 rounded-full border border-dashed animate-spin-slow pointer-events-none transition-all duration-300 ${
          isCyan
            ? 'border-cyan-400/50 group-hover:border-cyan-300'
            : 'border-emerald-400/50 group-hover:border-emerald-300'
        } ${isCharged ? 'scale-125 border-amber-400 opacity-100' : 'opacity-80'}`}
      />

      {/* Secondary Counter-Rotating Orbital Ring */}
      <div
        className={`absolute -inset-2 rounded-full border border-dotted animate-spin-reverse-slow pointer-events-none ${
          isCyan ? 'border-cyan-500/30' : 'border-emerald-500/30'
        }`}
      />

      {/* Glowing Energy Aura */}
      <div
        className={`absolute inset-1 rounded-full blur-md opacity-60 group-hover:opacity-90 transition-opacity duration-200 pointer-events-none ${
          isCyan
            ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-[0_0_30px_rgba(6,182,212,0.6)]'
            : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-[0_0_30px_rgba(16,185,129,0.6)]'
        } ${isCharged ? 'bg-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.9)]' : ''}`}
      />

      {/* Core Plasma Sphere */}
      <div
        className={`relative z-10 w-4/5 h-4/5 rounded-full backdrop-blur-md flex flex-col items-center justify-center p-1 border border-white/20 transition-transform duration-200 group-hover:scale-105 ${
          isCyan ? 'bg-slate-950/80 text-cyan-300' : 'bg-slate-950/80 text-emerald-300'
        }`}
      >
        <Zap
          className={`w-4 h-4 transition-transform duration-300 ${
            isCharged ? 'scale-125 text-amber-400 animate-bounce' : 'animate-pulse'
          }`}
        />
        <span className="text-[8px] font-mono font-bold uppercase tracking-tighter text-center line-clamp-1">
          {entity.title.split(' ')[0]}
        </span>
        <span className="text-[7px] font-mono text-slate-400">
          {entity.mass.toFixed(1)}u
        </span>
      </div>

      {/* Close button on hover */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(entity.id);
          }}
          className="absolute -top-1 -right-1 z-20 opacity-0 group-hover:opacity-100 bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 p-0.5 rounded-full transition-opacity"
          title="Dismiss Orb"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Hover Telemetry Label Tooltip */}
      <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-slate-950/90 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 px-2 py-0.5 rounded shadow-lg">
        {entity.title} // {entity.category}
      </div>
    </div>
  );
};
