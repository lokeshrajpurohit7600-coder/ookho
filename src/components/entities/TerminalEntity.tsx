import React, { useState, useEffect, useRef } from 'react';
import type { EngineEntity, PhysicsTelemetry } from '../../types/engine';
import { Terminal as TerminalIcon, Send, Trash2, X, Move } from 'lucide-react';

interface TerminalEntityProps {
  entity: EngineEntity;
  telemetry: PhysicsTelemetry;
  registerDomRef: (id: string, el: HTMLElement | null) => void;
  onStartDrag: (id: string, clientX: number, clientY: number) => void;
  onToggleGravityInversion: () => void;
  onTriggerShockwave: () => void;
  onResetPositions: () => void;
  onRemove?: (id: string) => void;
}

export const TerminalEntity: React.FC<TerminalEntityProps> = ({
  entity,
  telemetry,
  registerDomRef,
  onStartDrag,
  onToggleGravityInversion,
  onTriggerShockwave,
  onResetPositions,
  onRemove,
}) => {
  const [logs, setLogs] = useState<string[]>(
    entity.metadata?.initialLogs || [
      '[SYS_INIT] Orbital zero-gravity daemon online.',
      '[PHYSICS] Headless Matter.js engine running pure vector calculus.',
    ]
  );
  const [inputCommand, setInputCommand] = useState<string>('');
  const logEndRef = useRef<HTMLDivElement>(null);

  const width = entity.dimensions?.width || 440;
  const height = entity.dimensions?.height || 310;

  // Stream live cyber defense events periodically
  useEffect(() => {
    const cyberEvents = [
      '[IDS] SYN-flood packet mitigated at gateway 10.0.4.12',
      '[GRAV] Micro-meteoroid deflected via magnetic boundary wall',
      '[HASH] Quantum entanglement key synchronised (99.992% coherence)',
      '[TELEMETRY] Upward anti-gravity drift steady at y: -0.04 G',
      '[NET] Orbital downlink packet verified: SHA3-512 valid',
      '[SCAN] Port 8080 probe rejected by Neural Firewall V4',
      '[VECTOR] Cursor repulsion field scan: 0 threats in 180px radius',
    ];

    const interval = setInterval(() => {
      setLogs((prev) => {
        const nextEvent = cyberEvents[Math.floor(Math.random() * cyberEvents.length)];
        const time = new Date().toTimeString().split(' ')[0];
        const newLogs = [...prev, `[${time}] ${nextEvent}`];
        // Keep last 35 logs
        return newLogs.slice(-35);
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('button') || target.closest('.no-drag')) {
      return;
    }
    onStartDrag(entity.id, e.clientX, e.clientY);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputCommand.trim().toLowerCase();
    if (!cmd) return;

    setLogs((prev) => [...prev, `> ${inputCommand}`]);
    setInputCommand('');

    switch (cmd) {
      case 'help':
        setLogs((prev) => [
          ...prev,
          '[HELP] AVAILABLE COMMANDS:',
          '  invert    - Invert gravity (upward anti-G vs downward Earth gravity)',
          '  pulse     - Trigger radial gravitational shockwave',
          '  shockwave - Alias for pulse',
          '  reset     - Re-orbit all objects to initial spawn ratios',
          '  status    - Print live physics telemetry & engine stats',
          '  clear     - Clear terminal log screen',
          '  ping      - Check orbital uplink latency',
        ]);
        break;
      case 'invert':
        onToggleGravityInversion();
        setLogs((prev) => [...prev, '[SUCCESS] Gravity polarity inverted.']);
        break;
      case 'pulse':
      case 'shockwave':
        onTriggerShockwave();
        setLogs((prev) => [...prev, '[SHOCKWAVE] Gravitational pulse detonated.']);
        break;
      case 'reset':
        onResetPositions();
        setLogs((prev) => [...prev, '[RESET] Entities re-aligned to spawn ratios.']);
        break;
      case 'status':
        setLogs((prev) => [
          ...prev,
          `[STATUS] FPS: ${telemetry.fps} | Bodies: ${telemetry.bodyCount}`,
          `[STATUS] Gravity: (x: ${telemetry.activeGravityX}, y: ${telemetry.activeGravityY})`,
          `[STATUS] Space Drag (frictionAir): ${telemetry.airFriction}`,
          `[STATUS] Elasticity (restitution): ${telemetry.restitution}`,
          `[STATUS] Cursor Distance: ${telemetry.cursorDistance}px`,
        ]);
        break;
      case 'ping':
        setLogs((prev) => [...prev, `[PING] Orbital latency: ${(12 + Math.random() * 5).toFixed(1)} ms`]);
        break;
      case 'clear':
        setLogs([]);
        break;
      default:
        setLogs((prev) => [
          ...prev,
          `[ERR] Unknown command: "${cmd}". Type "help" for valid subroutines.`,
        ]);
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
      className={`absolute select-none cursor-grab active:cursor-grabbing rounded-xl backdrop-blur-md bg-slate-950/90 border border-cyan-500/40 hover:border-cyan-400/80 shadow-[0_0_25px_rgba(56,189,248,0.2)] flex flex-col justify-between p-3.5 overflow-hidden group ${entity.styleClasses}`}
    >
      {/* Corner Cyber Accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-950/80 border border-cyan-800">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="text-[9px] font-mono tracking-widest text-cyan-400/80 uppercase">
              {entity.category}
            </div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 flex items-center gap-1.5">
              {entity.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border bg-emerald-950/80 text-emerald-400 border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
          <button
            onClick={() => setLogs([])}
            className="no-drag text-slate-500 hover:text-slate-300 p-1 transition-colors"
            title="Clear Log History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="text-slate-500 group-hover:text-cyan-400 cursor-move p-1 transition-colors">
            <Move className="w-3.5 h-3.5" />
          </div>
          {onRemove && (
            <button
              onClick={() => onRemove(entity.id)}
              className="no-drag text-slate-500 hover:text-rose-400 p-1 transition-colors"
              title="Close Terminal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Scrollable Logs Area (Selectable Text) */}
      <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 pr-1 space-y-1 selectable-text no-drag bg-slate-950/70 p-2 rounded border border-slate-900">
        {logs.map((log, index) => {
          const isCmd = log.startsWith('>');
          const isErr = log.startsWith('[ERR]');
          const isSuccess = log.startsWith('[SUCCESS]') || log.startsWith('[READY]');
          const isAlert = log.startsWith('[ALERT]') || log.startsWith('[SHOCKWAVE]');

          let colorClass = 'text-cyan-400/90';
          if (isCmd) colorClass = 'text-emerald-400 font-bold';
          else if (isErr) colorClass = 'text-rose-400';
          else if (isSuccess) colorClass = 'text-emerald-300';
          else if (isAlert) colorClass = 'text-amber-400';

          return (
            <div key={index} className={`${colorClass} break-words`}>
              {log}
            </div>
          );
        })}
        <div ref={logEndRef} />
      </div>

      {/* Interactive Command Input Form */}
      <form
        onSubmit={handleCommandSubmit}
        className="mt-2 flex items-center gap-1.5 border-t border-cyan-900/60 pt-2 no-drag"
      >
        <span className="text-emerald-400 font-mono text-xs select-none">&gt;</span>
        <input
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          placeholder="type 'help', 'invert', 'pulse', 'status'..."
          className="flex-1 bg-slate-900/80 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 transition-colors selectable-text"
        />
        <button
          type="submit"
          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded px-2 py-1 text-xs font-mono transition-colors flex items-center gap-1"
        >
          <Send className="w-3 h-3" />
        </button>
      </form>

      {/* Monospace telemetry footer */}
      <div className="mt-1 flex items-center justify-between text-[8px] font-mono text-slate-600">
        <span>MASS: {entity.mass.toFixed(1)}u // TTY: /dev/orb0</span>
        <span>HEADLESS MATTER.JS</span>
      </div>
    </div>
  );
};
