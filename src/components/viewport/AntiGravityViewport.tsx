import React, { useRef } from 'react';
import type { AntiGravityConfig } from '../../types/engine';
import { useAntiGravityEngine } from '../../physics/useAntiGravityEngine';
import { CardEntity } from '../entities/CardEntity';
import { TerminalEntity } from '../entities/TerminalEntity';
import { OrbEntity } from '../entities/OrbEntity';
import { HUDControlBar } from '../hud/HUDControlBar';
import { CursorFieldOverlay } from '../hud/CursorFieldOverlay';
import { ShieldCheck, Compass, Move } from 'lucide-react';

interface AntiGravityViewportProps {
  config: AntiGravityConfig;
}

export const AntiGravityViewport: React.FC<AntiGravityViewportProps> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    entities,
    telemetry,
    registerDomRef,
    handlePointerMove,
    handlePointerLeave,
    startDrag,
    endDrag,
    cursorRef,
    shockwaveWave,
    // Physics controls
    worldGravityY,
    setWorldGravityY,
    worldGravityX,
    setWorldGravityX,
    frictionAir,
    setFrictionAir,
    restitution,
    setRestitution,
    repulsionEnabled,
    setRepulsionEnabled,
    repulsionRadius,
    setRepulsionRadius,
    repulsionForce,
    setRepulsionForce,
    // Actions
    triggerShockwave,
    resetPositions,
    toggleGravityInversion,
    spawnEntity,
    removeEntity,
  } = useAntiGravityEngine({ config, containerRef });

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerUp={endDrag}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 cyber-grid select-none"
    >
      {/* Radial Depth Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/15 via-slate-950/80 to-slate-950 pointer-events-none" />

      {/* Cybernetic Grid Alignment Marks */}
      <div className="absolute top-20 left-8 pointer-events-none font-mono text-[9px] text-cyan-500/30 tracking-widest hidden sm:block">
        [SYS_ORIGIN: 00.000 / VIEWPORT_BOUND: LOCKED]
      </div>
      <div className="absolute top-20 right-8 pointer-events-none font-mono text-[9px] text-cyan-500/30 tracking-widest hidden sm:block">
        [VECTOR_SPACE: MATTER_RIGID_HEADLESS]
      </div>
      <div className="absolute bottom-12 left-8 pointer-events-none font-mono text-[9px] text-cyan-500/30 tracking-widest hidden sm:block">
        [SPATIAL_DAMPING: FRICTION_AIR 0.018]
      </div>
      <div className="absolute bottom-12 right-8 pointer-events-none font-mono text-[9px] text-cyan-500/30 tracking-widest hidden sm:block">
        [BOUNDARY_ELASTICITY: RESTITUTION 0.82]
      </div>

      {/* CRT Scanline Overlay for Cybersecurity Aesthetic */}
      <div className="absolute inset-0 scanlines opacity-40 pointer-events-none z-10" />

      {/* Top HUD Control & Telemetry Bar */}
      <HUDControlBar
        telemetry={telemetry}
        worldGravityY={worldGravityY}
        setWorldGravityY={setWorldGravityY}
        worldGravityX={worldGravityX}
        setWorldGravityX={setWorldGravityX}
        frictionAir={frictionAir}
        setFrictionAir={setFrictionAir}
        restitution={restitution}
        setRestitution={setRestitution}
        repulsionEnabled={repulsionEnabled}
        setRepulsionEnabled={setRepulsionEnabled}
        repulsionRadius={repulsionRadius}
        setRepulsionRadius={setRepulsionRadius}
        repulsionForce={repulsionForce}
        setRepulsionForce={setRepulsionForce}
        onTriggerShockwave={triggerShockwave}
        onResetPositions={resetPositions}
        onToggleGravityInversion={toggleGravityInversion}
        onSpawnEntity={spawnEntity}
      />

      {/* Cursor Vector Field & Shockwave Visualizer Overlay */}
      <CursorFieldOverlay
        cursorRef={cursorRef}
        repulsionEnabled={repulsionEnabled}
        repulsionRadius={repulsionRadius}
        repulsionForce={repulsionForce}
        telemetry={telemetry}
        shockwaveWave={shockwaveWave}
      />

      {/* Interactive Physics Bodies Container (DOM HTML Elements) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {entities.map((entity) => {
          if (entity.type === 'terminal') {
            return (
              <div key={entity.id} className="pointer-events-auto">
                <TerminalEntity
                  entity={entity}
                  telemetry={telemetry}
                  registerDomRef={registerDomRef}
                  onStartDrag={startDrag}
                  onToggleGravityInversion={toggleGravityInversion}
                  onTriggerShockwave={triggerShockwave}
                  onResetPositions={resetPositions}
                  onRemove={removeEntity}
                />
              </div>
            );
          }

          if (entity.type === 'orb') {
            return (
              <div key={entity.id} className="pointer-events-auto">
                <OrbEntity
                  entity={entity}
                  registerDomRef={registerDomRef}
                  onStartDrag={startDrag}
                  onRemove={removeEntity}
                />
              </div>
            );
          }

          return (
            <div key={entity.id} className="pointer-events-auto">
              <CardEntity
                entity={entity}
                registerDomRef={registerDomRef}
                onStartDrag={startDrag}
                onRemove={removeEntity}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom Status & Guide Bar */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none px-4 py-2 bg-slate-950/75 backdrop-blur-md border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-cyan-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            ZERO-G STABILIZER: LOCK
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:flex items-center gap-1 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            DRIFT: {worldGravityY < 0 ? '▲ -0.04 G (UPWARD)' : '▼ +0.04 G (DOWNWARD)'}
          </span>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="flex items-center gap-1 text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            <Move className="w-3 h-3 text-cyan-400" />
            <span className="hidden md:inline">DRAG &amp; FLICK CARDS // HOVER FOR REPULSION FIELD</span>
            <span className="md:hidden">DRAG &amp; FLICK</span>
          </span>
          <span className="text-slate-500 hidden lg:inline">
            F = (1 - d/{repulsionRadius}) * {repulsionForce.toFixed(2)}
          </span>
        </div>
      </footer>
    </div>
  );
};
