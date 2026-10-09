import React, { useState } from 'react';
import type {
  PhysicsTelemetry,
  EngineEntity,
} from '../../types/engine';
import {
  Sliders,
  Zap,
  RotateCcw,
  Plus,
  ArrowUp,
  ArrowDown,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface HUDControlBarProps {
  telemetry: PhysicsTelemetry;
  worldGravityY: number;
  setWorldGravityY: (val: number) => void;
  worldGravityX: number;
  setWorldGravityX: (val: number) => void;
  frictionAir: number;
  setFrictionAir: (val: number) => void;
  restitution: number;
  setRestitution: (val: number) => void;
  repulsionEnabled: boolean;
  setRepulsionEnabled: (val: boolean) => void;
  repulsionRadius: number;
  setRepulsionRadius: (val: number) => void;
  repulsionForce: number;
  setRepulsionForce: (val: number) => void;
  onTriggerShockwave: () => void;
  onResetPositions: () => void;
  onToggleGravityInversion: () => void;
  onSpawnEntity: (entity: EngineEntity) => void;
}

export const HUDControlBar: React.FC<HUDControlBarProps> = ({
  telemetry,
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
  onTriggerShockwave,
  onResetPositions,
  onToggleGravityInversion,
  onSpawnEntity,
}) => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [spawnDropdownOpen, setSpawnDropdownOpen] = useState<boolean>(false);

  const isUpward = worldGravityY < 0;

  const handleSpawnCard = () => {
    const id = `card-custom-${Date.now()}`;
    const newCard: EngineEntity = {
      id,
      type: 'card',
      title: 'ANOMALY RADAR NODE',
      category: 'TACTICAL ARRAY',
      mass: 4.0,
      dimensions: { width: 310, height: 230 },
      spawnRatio: {
        x: 0.3 + Math.random() * 0.4,
        y: 0.3 + Math.random() * 0.4,
      },
      styleClasses: 'glass-cyber-violet',
      metadata: {
        status: 'ACTIVE',
        badge: 'SURVEILLANCE',
        accentColor: 'purple',
        subtitle: 'PHASED ARRAY RADAR',
        metrics: [
          { label: 'Signal Gain', value: '+34 dB' },
          { label: 'Frequency', value: '18.4 GHz' },
          { label: 'Target Lock', value: 'NOMINAL' },
        ],
      },
    };
    onSpawnEntity(newCard);
    setSpawnDropdownOpen(false);
  };

  const handleSpawnOrb = () => {
    const id = `orb-custom-${Date.now()}`;
    const newOrb: EngineEntity = {
      id,
      type: 'orb',
      title: 'QUANTUM SINGULARITY',
      category: 'ENERGY PROBE',
      mass: 3.5,
      dimensions: { radius: 52 },
      spawnRatio: {
        x: 0.35 + Math.random() * 0.3,
        y: 0.35 + Math.random() * 0.3,
      },
      styleClasses: 'glass-cyber',
      metadata: {
        status: 'ACTIVE',
        badge: 'ORBITAL',
        accentColor: Math.random() > 0.5 ? 'cyan' : 'emerald',
      },
    };
    onSpawnEntity(newOrb);
    setSpawnDropdownOpen(false);
  };

  const handleSpawnTerminal = () => {
    const id = `term-custom-${Date.now()}`;
    const newTerminal: EngineEntity = {
      id,
      type: 'terminal',
      title: 'HEX DECRYPTOR // SUBSYS',
      category: 'CRYPTO ENGINE',
      mass: 5.2,
      dimensions: { width: 420, height: 290 },
      spawnRatio: {
        x: 0.4 + Math.random() * 0.2,
        y: 0.4 + Math.random() * 0.2,
      },
      styleClasses: 'glass-cyber',
      metadata: {
        status: 'ONLINE',
        badge: 'DECRYPT ENGINE',
        accentColor: 'cyan',
        initialLogs: [
          '[CORE] Sub-daemon initialized on isolated channel.',
          '[READY] Monitoring inbound cipher streams.',
        ],
      },
    };
    onSpawnEntity(newTerminal);
    setSpawnDropdownOpen(false);
  };

  // Presets
  const applyPreset = (preset: 'default' | 'lunar' | 'super' | 'earth') => {
    if (preset === 'default') {
      setWorldGravityY(-0.04);
      setWorldGravityX(0);
      setFrictionAir(0.018);
      setRestitution(0.82);
      setRepulsionRadius(180);
      setRepulsionForce(0.05);
    } else if (preset === 'lunar') {
      setWorldGravityY(-0.012);
      setWorldGravityX(0);
      setFrictionAir(0.006);
      setRestitution(0.92);
      setRepulsionRadius(220);
      setRepulsionForce(0.06);
    } else if (preset === 'super') {
      setWorldGravityY(-0.09);
      setWorldGravityX(-0.01);
      setFrictionAir(0.035);
      setRestitution(0.70);
      setRepulsionRadius(200);
      setRepulsionForce(0.08);
    } else if (preset === 'earth') {
      setWorldGravityY(0.05);
      setWorldGravityX(0);
      setFrictionAir(0.02);
      setRestitution(0.65);
      setRepulsionRadius(160);
      setRepulsionForce(0.04);
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
      {/* Primary Top Telemetry & Control Bar */}
      <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border-b border-cyan-500/25 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        {/* Brand & Engine Status */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <h1 className="text-xs font-mono font-bold tracking-widest text-slate-100 uppercase flex items-center gap-2">
              <span>A.N.T.I.G.R.A.V.I.T.Y</span>
              <span className="text-cyan-400 text-[10px] font-normal border border-cyan-500/40 px-1.5 py-0.2 rounded bg-cyan-950/50">
                MATTER.JS HEADLESS
              </span>
            </h1>
            <p className="text-[9px] font-mono text-slate-400 tracking-wider">
              QUANTUM ZERO-G CYBER COMMAND // DOM-SYNCED
            </p>
          </div>
        </div>

        {/* Real-time Telemetry Badges */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[10px]">
          <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded flex items-center gap-1.5 text-slate-300">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>FPS:</span>
            <span className="font-bold text-emerald-400">{telemetry.fps}</span>
          </div>

          <div
            className={`border px-2 py-1 rounded flex items-center gap-1.5 ${
              isUpward
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
            }`}
          >
            {isUpward ? (
              <ArrowUp className="w-3 h-3 text-cyan-400 animate-bounce" />
            ) : (
              <ArrowDown className="w-3 h-3 text-amber-400" />
            )}
            <span>GRAV Y:</span>
            <span className="font-bold">{worldGravityY.toFixed(3)} G</span>
            <span className="text-[8px] opacity-80 uppercase">
              {isUpward ? '[UPWARD DRIFT]' : '[DOWNWARD]'}
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded flex items-center gap-1.5 text-slate-300">
            <Gauge className="w-3 h-3 text-purple-400" />
            <span>DRAG:</span>
            <span className="font-bold text-purple-300">{frictionAir.toFixed(3)}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded flex items-center gap-1.5 text-slate-300">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>BOUNCE:</span>
            <span className="font-bold text-amber-300">{restitution.toFixed(2)}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded flex items-center gap-1.5 text-slate-300">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>BODIES:</span>
            <span className="font-bold text-slate-100">{telemetry.bodyCount}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Gravity Invert Toggle */}
          <button
            onClick={onToggleGravityInversion}
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-all duration-200 border ${
              isUpward
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
            }`}
            title="Invert Gravity Direction"
          >
            {isUpward ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            <span>{isUpward ? 'ANTI-GRAVITY' : 'NORMAL GRAVITY'}</span>
          </button>

          {/* Shockwave Pulse Button */}
          <button
            onClick={onTriggerShockwave}
            className="px-2.5 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/50 hover:bg-purple-500/30 transition-all duration-200 shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95"
            title="Trigger Radial Gravitational Blast"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">SHOCKWAVE</span>
          </button>

          {/* Re-Orbit Align Button */}
          <button
            onClick={onResetPositions}
            className="px-2.5 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
            title="Reset Objects to Orbit Spawns"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RE-ORBIT</span>
          </button>

          {/* Spawn Entity Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSpawnDropdownOpen(!spawnDropdownOpen)}
              className="px-2.5 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>SPAWN</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {spawnDropdownOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-slate-950 border border-emerald-500/40 rounded-lg shadow-2xl py-1 text-xs font-mono z-50 backdrop-blur-xl">
                <button
                  onClick={handleSpawnCard}
                  className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-emerald-950/60 hover:text-emerald-300 flex items-center gap-2 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  + Cyber Card
                </button>
                <button
                  onClick={handleSpawnOrb}
                  className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-emerald-950/60 hover:text-emerald-300 flex items-center gap-2 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  + Plasma Orb
                </button>
                <button
                  onClick={handleSpawnTerminal}
                  className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-emerald-950/60 hover:text-emerald-300 flex items-center gap-2 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  + Kernel Terminal
                </button>
              </div>
            )}
          </div>

          {/* Tuning Console Toggle */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all ${
              drawerOpen
                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">TUNING</span>
            {drawerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Physics Tuning Console Drawer */}
      {drawerOpen && (
        <div className="pointer-events-auto bg-slate-950/95 backdrop-blur-xl border-b border-cyan-500/30 px-6 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs font-mono shadow-2xl">
          {/* Preset Buttons */}
          <div className="col-span-full flex items-center gap-2 pb-2 border-b border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-2">
              PHYSICS PRESETS:
            </span>
            <button
              onClick={() => applyPreset('default')}
              className="px-2.5 py-1 rounded bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50 transition-colors text-[10px]"
            >
              ZERO-G DEFAULT
            </button>
            <button
              onClick={() => applyPreset('lunar')}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-[10px]"
            >
              LUNAR ORBIT
            </button>
            <button
              onClick={() => applyPreset('super')}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-[10px]"
            >
              SUPER ANTI-G
            </button>
            <button
              onClick={() => applyPreset('earth')}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-[10px]"
            >
              EARTH GRAVITY
            </button>
          </div>

          {/* Slider 1: Upward / Downward Gravity Y */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-slate-300 text-[11px] font-semibold">GRAVITY VECTOR Y</span>
              <span className="text-cyan-400 font-bold">{worldGravityY.toFixed(3)} G</span>
            </div>
            <input
              type="range"
              min="-0.12"
              max="0.08"
              step="0.005"
              value={worldGravityY}
              onChange={(e) => setWorldGravityY(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-slate-500 mt-1">
              <span>-0.12 (HIGH ANTI-G)</span>
              <span>0 (WEIGHTLESS)</span>
              <span>+0.08 (EARTH)</span>
            </div>
          </div>

          {/* Slider 2: Lateral Solar Wind Gravity X */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-slate-300 text-[11px] font-semibold">LATERAL DRIFT X</span>
              <span className="text-cyan-400 font-bold">{worldGravityX.toFixed(3)} G</span>
            </div>
            <input
              type="range"
              min="-0.04"
              max="0.04"
              step="0.002"
              value={worldGravityX}
              onChange={(e) => setWorldGravityX(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-slate-500 mt-1">
              <span>-0.04 (LEFT)</span>
              <span>0 (NEUTRAL)</span>
              <span>+0.04 (RIGHT)</span>
            </div>
          </div>

          {/* Slider 3: Air Resistance (frictionAir) */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-slate-300 text-[11px] font-semibold">SPACE DRAG (frictionAir)</span>
              <span className="text-purple-400 font-bold">{frictionAir.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.002"
              max="0.08"
              step="0.002"
              value={frictionAir}
              onChange={(e) => setFrictionAir(parseFloat(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-slate-500 mt-1">
              <span>0.002 (VACUUM)</span>
              <span>0.018 (ZERO-G)</span>
              <span>0.08 (DENSE)</span>
            </div>
          </div>

          {/* Slider 4: Boundary Restitution (Elasticity) */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-slate-300 text-[11px] font-semibold">BOUNDARY BOUNCE</span>
              <span className="text-amber-400 font-bold">{restitution.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.02"
              value={restitution}
              onChange={(e) => setRestitution(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-slate-500 mt-1">
              <span>0.2 (ABSORB)</span>
              <span>0.82 (DEFAULT)</span>
              <span>1.0 (SUPER-ELASTIC)</span>
            </div>
          </div>

          {/* Slider 5: Cursor Repulsion Radius */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-slate-300 text-[11px] font-semibold">REPULSION RADIUS</span>
              <span className="text-cyan-400 font-bold">{repulsionRadius} px</span>
            </div>
            <input
              type="range"
              min="80"
              max="360"
              step="10"
              value={repulsionRadius}
              onChange={(e) => setRepulsionRadius(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-slate-500 mt-1">
              <span>80px</span>
              <span>180px (SCHEMA)</span>
              <span>360px</span>
            </div>
          </div>

          {/* Slider 6: Cursor Repulsion Force */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-slate-300 text-[11px] font-semibold">REPULSION FORCE</span>
              <span className="text-cyan-400 font-bold">{repulsionForce.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.15"
              step="0.005"
              value={repulsionForce}
              onChange={(e) => setRepulsionForce(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-slate-500 mt-1">
              <span>0.01 (GENTLE)</span>
              <span>0.05 (DEFAULT)</span>
              <span>0.15 (STRONG)</span>
            </div>
          </div>

          {/* Toggle: Cursor Vector Field */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-300 text-[11px] font-semibold block">CURSOR VECTOR FIELD</span>
              <span className="text-[9px] text-slate-500">Radial distance repulsion F=(1-d/r)*Fmag</span>
            </div>
            <button
              onClick={() => setRepulsionEnabled(!repulsionEnabled)}
              className={`px-3 py-1.5 rounded font-mono text-[10px] font-bold border transition-colors ${
                repulsionEnabled
                  ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {repulsionEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
