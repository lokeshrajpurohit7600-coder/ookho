import React, { useEffect, useState } from 'react';
import type { PhysicsTelemetry } from '../../types/engine';

interface CursorFieldOverlayProps {
  cursorRef: React.MutableRefObject<{
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    active: boolean;
    speed: number;
  }>;
  repulsionEnabled: boolean;
  repulsionRadius: number;
  repulsionForce: number;
  telemetry: PhysicsTelemetry;
  shockwaveWave: { id: number; x: number; y: number } | null;
}

export const CursorFieldOverlay: React.FC<CursorFieldOverlayProps> = ({
  cursorRef,
  repulsionEnabled,
  repulsionRadius,
  telemetry,
  shockwaveWave,
}) => {
  const [pos, setPos] = useState({ x: -9999, y: -9999, active: false });

  // Update cursor position smoothly via RAF for reticle overlay
  useEffect(() => {
    let animId: number;
    const updateCursor = () => {
      const c = cursorRef.current;
      if (c.active) {
        setPos({ x: c.x, y: c.y, active: true });
      } else {
        setPos((prev) => (prev.active ? { ...prev, active: false } : prev));
      }
      animId = requestAnimationFrame(updateCursor);
    };

    animId = requestAnimationFrame(updateCursor);
    return () => cancelAnimationFrame(animId);
  }, [cursorRef]);

  const diameter = repulsionRadius * 2;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* Shockwave Radial Wave Animation */}
      {shockwaveWave && (
        <div
          key={shockwaveWave.id}
          style={{
            left: `${shockwaveWave.x}px`,
            top: `${shockwaveWave.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute rounded-full border-2 border-cyan-400/80 animate-ping opacity-90 pointer-events-none"
        >
          <div className="w-[1200px] h-[1200px] rounded-full border border-cyan-300/40 bg-cyan-500/5 -translate-x-1/2 -translate-y-1/2" />
        </div>
      )}

      {/* Interactive Cursor Repulsion Reticle */}
      {repulsionEnabled && pos.active && (
        <div
          style={{
            transform: `translate3d(${pos.x - repulsionRadius}px, ${pos.y - repulsionRadius}px, 0px)`,
            width: `${diameter}px`,
            height: `${diameter}px`,
          }}
          className="absolute rounded-full pointer-events-none transition-all duration-75"
        >
          {/* Outer Repulsion Boundary Ring */}
          <div
            className={`w-full h-full rounded-full border border-dashed transition-colors duration-200 ${
              telemetry.isRepelling
                ? 'border-cyan-300/80 bg-cyan-400/10 shadow-[0_0_35px_rgba(56,189,248,0.3)] animate-pulse'
                : 'border-cyan-500/20 bg-cyan-500/[0.02]'
            }`}
          />

          {/* Inner Target Crosshairs */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/20 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/20 -translate-x-1/2" />

          {/* Central Reticle Dot */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-transform ${
              telemetry.isRepelling
                ? 'bg-cyan-300 scale-150 shadow-[0_0_12px_#38bdf8]'
                : 'bg-cyan-400/60'
            }`}
          />

          {/* Monospace Vector Readout */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-400/80 bg-slate-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60 whitespace-nowrap">
            RAD: {repulsionRadius}px | SPEED: {telemetry.cursorSpeed}
          </div>
        </div>
      )}
    </div>
  );
};
