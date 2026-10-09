'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Layers, Sliders, Info, ShieldAlert, Video, Image as ImageIcon } from 'lucide-react';
import { EditedRegion, EditedRegionBox, EditedRegionHeatmap, HeatmapPoint } from '@/lib/types';

interface HeatmapOverlayProps {
  mediaUrl?: string;
  fileType?: 'image' | 'video' | 'text';
  originalFilename?: string;
  regions?: EditedRegion[] | null;
}

export function HeatmapOverlay({
  mediaUrl,
  fileType = 'image',
  originalFilename = 'sample_media',
  regions = []
}: HeatmapOverlayProps) {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const [opacity, setOpacity] = useState(0.75);
  const [selectedBox, setSelectedBox] = useState<EditedRegionBox | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Separate boxes and heatmap points
  const boxes: EditedRegionBox[] = (regions || []).filter(
    (r): r is EditedRegionBox => r.type === 'box'
  );

  const heatmapGroup = (regions || []).find(
    (r): r is EditedRegionHeatmap => r.type === 'heatmap'
  );
  const heatmapPoints: HeatmapPoint[] = heatmapGroup?.points || [];

  // Draw Heatmap on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showHeatmap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear previous drawings
    ctx.clearRect(0, 0, width, height);

    if (heatmapPoints.length === 0) return;

    // Draw radial gradient heat spots
    heatmapPoints.forEach((point) => {
      const px = (point.x / 100) * width;
      const py = (point.y / 100) * height;
      const radius = ((point.radius || 40) / 100) * Math.min(width, height);

      const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
      
      // Warm painterly heat: Crimson -> Amber -> Indigo edge -> transparent
      gradient.addColorStop(0, `rgba(244, 63, 94, ${point.intensity * 0.85})`);
      gradient.addColorStop(0.5, `rgba(245, 158, 11, ${point.intensity * 0.5})`);
      gradient.addColorStop(0.8, `rgba(99, 102, 241, ${point.intensity * 0.25})`);
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [showHeatmap, heatmapPoints]);

  return (
    <div className="artistic-panel rounded-3xl p-6 border border-white/[0.08] flex flex-col gap-4">
      {/* Header with Control Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">
            Forensic Spatial Anomaly Map
          </h3>
        </div>

        {/* Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1 rounded-xl border font-mono transition-all ${
              showHeatmap
                ? 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                : 'bg-slate-900 border-white/[0.06] text-slate-400 hover:text-white'
            }`}
          >
            Heatmap {showHeatmap ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-3 py-1 rounded-xl border font-mono transition-all ${
              showBoxes
                ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 border-white/[0.06] text-slate-400 hover:text-white'
            }`}
          >
            Bounding Boxes {showBoxes ? 'ON' : 'OFF'}
          </button>

          {/* Opacity Slider */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-xl border border-white/[0.06]">
            <Sliders className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-mono">Opacity</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* Main Visualizer Canvas & Media Container */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-video sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-white/[0.08] flex items-center justify-center group select-none"
      >
        {/* Underneath Media (Image / Video) */}
        {mediaUrl ? (
          fileType === 'video' ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={mediaUrl}
              alt={originalFilename}
              className="w-full h-full object-contain"
            />
          )
        ) : (
          /* Artistic media placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/40">
            <div className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center text-indigo-300 mb-3 bg-indigo-950/30">
              <ImageIcon className="w-8 h-8" />
            </div>
            <p className="text-xs font-mono text-slate-400">
              Simulated Forensic Media Canvas ({originalFilename})
            </p>
          </div>
        )}

        {/* Heatmap Overlay Canvas */}
        {showHeatmap && (
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300"
            style={{ opacity }}
          />
        )}

        {/* Bounding Boxes Layer - Clean, crisp, no neon halo */}
        {showBoxes && (
          <div 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity }}
          >
            {boxes.map((box) => (
              <div
                key={box.id}
                onClick={() => setSelectedBox(box)}
                className="absolute border-2 border-rose-500 bg-rose-500/10 rounded pointer-events-auto cursor-pointer hover:border-amber-400 hover:bg-amber-500/15 transition-all group/box"
                style={{
                  left: `${box.box.x}%`,
                  top: `${box.box.y}%`,
                  width: `${box.box.width}%`,
                  height: `${box.box.height}%`,
                }}
              >
                {/* Region Tag */}
                <div className="absolute -top-6 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/95 border border-rose-500/60 text-[10px] font-mono text-rose-300 whitespace-nowrap shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{box.label}</span>
                  <span className="text-white font-bold">{box.confidence.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flagged Region Detail Card (if clicked) */}
      {selectedBox ? (
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-rose-500/30 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-rose-200 block">
                {selectedBox.label} ({selectedBox.confidence.toFixed(1)}% Anomaly Rating)
              </span>
              <p className="text-slate-300 text-[11px] mt-0.5">
                {selectedBox.description || 'Artifact detected in spatial and frequency domain analysis.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedBox(null)}
            className="text-slate-400 hover:text-white text-xs font-mono"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Click flagged bounding boxes above to inspect localized neural anomalies.</span>
        </div>
      )}
    </div>
  );
}
