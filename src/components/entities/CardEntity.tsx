import React, { useState } from 'react';
import type { EngineEntity } from '../../types/engine';
import { Shield, ShieldAlert, Cpu, Activity, Radio, Lock, Zap, RefreshCw, X, Move } from 'lucide-react';

interface CardEntityProps {
  entity: EngineEntity;
  registerDomRef: (id: string, el: HTMLElement | null) => void;
  onStartDrag: (id: string, clientX: number, clientY: number) => void;
  onRemove?: (id: string) => void;
}

export const CardEntity: React.FC<CardEntityProps> = ({
  entity,
  registerDomRef,
  onStartDrag,
  onRemove,
}) => {
  const [shieldActive, setShieldActive] = useState<boolean>(true);
  const [overclockActive, setOverclockActive] = useState<boolean>(false);
  const [entropyCounter, setEntropyCounter] = useState<number>(98.4);
  const [cipherKey, setCipherKey] = useState<string>('0x7F..9A2C');

  const width = entity.dimensions?.width || 320;
  const height = entity.dimensions?.height || 250;
  const meta = entity.metadata;

  const handleRotateKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const hex2 = Math.random().toString(16).substring(2, 6).toUpperCase();
    setCipherKey(`0x${hex}..${hex2}`);
    setEntropyCounter((prev) => +(prev + (Math.random() * 0.4 - 0.2)).toFixed(2));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag if not interacting with interactive form controls or buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.no-drag')) {
      return;
    }
    onStartDrag(entity.id, e.clientX, e.clientY);
  };

  // Color theme helpers
  const getAccentBorder = () => {
    switch (meta?.accentColor) {
      case 'emerald':
        return 'border-emerald-500/40 hover:border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
      case 'purple':
        return 'border-purple-500/40 hover:border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.15)]';
      case 'amber':
        return 'border-amber-500/40 hover:border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.15)]';
      default:
        return 'border-cyan-500/40 hover:border-cyan-400/80 shadow-[0_0_20px_rgba(56,189,248,0.15)]';
    }
  };

  const getBadgeColor = () => {
    switch (meta?.accentColor) {
      case 'emerald':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
      case 'purple':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      case 'amber':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      default:
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
    }
  };

  const getIcon = () => {
    switch (meta?.accentColor) {
      case 'emerald':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'purple':
        return <Lock className="w-4 h-4 text-purple-400" />;
      case 'amber':
        return <Radio className="w-4 h-4 text-amber-400" />;
      default:
        return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div
      ref={(el) => registerDomRef(entity.id, el)}
      onPointerDown={handlePointerDown}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
        top: 0,
        left: 0,
        willChange: 'transform',
      }}
      className={`absolute select-none cursor-grab active:cursor-grabbing rounded-xl backdrop-blur-md bg-slate-950/80 border transition-colors duration-200 flex flex-col justify-between p-4 overflow-hidden group ${getAccentBorder()} ${entity.styleClasses}`}
    >
      {/* Corner Cyber Accents */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none" />

      {/* Header Bar with Drag Handle and Controls */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-900/90 border border-slate-800">
              {getIcon()}
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                {entity.category}
              </div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
                {entity.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${getBadgeColor()}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
              {meta?.status || 'ONLINE'}
            </span>
            <div className="text-slate-500 group-hover:text-cyan-400 cursor-move p-1 transition-colors">
              <Move className="w-3.5 h-3.5" />
            </div>
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(entity.id);
                }}
                className="no-drag text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                title="Decommission Node"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Subtitle / Telemetry Info */}
        {meta?.subtitle && (
          <div className="text-[10px] font-mono text-slate-400 tracking-wide mb-2 flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400/80" />
            <span>{meta.subtitle}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 my-2">
          {meta?.metrics?.map((m, idx) => (
            <div
              key={idx}
              className="bg-slate-900/70 border border-slate-800/80 rounded p-2 flex flex-col justify-center"
            >
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                {m.label}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-200 mt-0.5 selectable-text truncate">
                {m.label === 'Cipher Key'
                  ? cipherKey
                  : m.label === 'Entropy Flux'
                  ? `${entropyCounter}%`
                  : m.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Controls within Card (Preserves HTML Clickability) */}
      <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShieldActive(!shieldActive);
            }}
            className={`no-drag px-2.5 py-1 rounded text-[10px] font-mono font-semibold flex items-center gap-1.5 transition-all duration-150 border ${
              shieldActive
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
            }`}
          >
            {shieldActive ? <Shield className="w-3 h-3 text-cyan-400" /> : <ShieldAlert className="w-3 h-3" />}
            SHIELD: {shieldActive ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setOverclockActive(!overclockActive);
            }}
            className={`no-drag px-2.5 py-1 rounded text-[10px] font-mono font-semibold flex items-center gap-1.5 transition-all duration-150 border ${
              overclockActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3 h-3" />
            FLUX: {overclockActive ? '2.4X' : '1.0X'}
          </button>
        </div>

        <button
          onClick={handleRotateKey}
          className="no-drag text-slate-400 hover:text-cyan-300 text-[10px] flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 hover:border-cyan-500/40 transition-colors"
          title="Rotate Encryption Seed"
        >
          <RefreshCw className="w-3 h-3" />
          ROTATE
        </button>
      </div>

      {/* Physics Mass Monospace Tag */}
      <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-600 tracking-wider">
        MASS: {entity.mass.toFixed(1)}u // FRICTION: 0.018
      </div>
    </div>
  );
};
