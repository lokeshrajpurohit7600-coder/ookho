'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, Square, MessageSquare } from 'lucide-react';

interface VoiceSummaryProps {
  summaryText?: string | null;
}

export function VoiceSummary({ summaryText }: VoiceSummaryProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }
  }, []);

  const handleSpeak = () => {
    if (!summaryText || typeof window === 'undefined') return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(summaryText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  return (
    <div className="artistic-panel rounded-3xl p-6 border border-white/[0.08] flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">
            Plain-Language Forensic Summary
          </h3>
        </div>

        {/* Voice Playback Button */}
        {speechSupported && summaryText && (
          <button
            type="button"
            onClick={handleSpeak}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
              isPlaying
                ? 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
                : 'bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Voice</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen to Summary</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Summary Text Content */}
      <div className="relative">
        <p className="text-sm text-slate-300 leading-relaxed font-sans">
          {summaryText || "Forensic deconstruction summary is currently being synthesized by Aookho's neural narrative engine."}
        </p>

        {/* Animated Audio Equalizer Bars when speaking */}
        {isPlaying && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
            <span className="text-[11px] font-mono text-amber-300">Voice Assistant:</span>
            <div className="flex items-end gap-1 h-3.5">
              <span className="w-1 bg-amber-400 rounded-full h-2 animate-pulse" />
              <span className="w-1 bg-rose-400 rounded-full h-3.5 animate-bounce" />
              <span className="w-1 bg-indigo-400 rounded-full h-2.5 animate-pulse" />
              <span className="w-1 bg-emerald-400 rounded-full h-1.5 animate-bounce" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
