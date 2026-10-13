'use client';

import React from 'react';
import Link from 'next/link';
import { Scan, History } from 'lucide-react';
import { useHistory } from '@/context/HistoryContext';

export function Navbar() {
  const { openHistory } = useHistory();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#0c101c]/85 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand: Favicon and Name in the Corner */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Favicon / Cyber Forensic Eye Icon */}
          <div className="w-9 h-9 rounded-xl bg-[#0f172a] border border-cyan-500/40 flex items-center justify-center group-hover:border-cyan-400/80 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] group-hover:shadow-[0_0_16px_rgba(6,182,212,0.3)]">
            <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
              {/* Eye contour */}
              <path
                d="M5 16C8 9.5 12 7 16 7C20 7 24 9.5 27 16C24 22.5 20 25 16 25C12 25 8 22.5 5 16Z"
                stroke="url(#navEyeStroke)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Iris & Reticle */}
              <circle cx="16" cy="16" r="5.2" fill="url(#navIrisGrad)" stroke="#38bdf8" strokeWidth="0.8" />
              <circle cx="16" cy="16" r="3.2" stroke="#a5f3fc" strokeWidth="0.6" strokeDasharray="2 1.5" />
              <circle cx="16" cy="16" r="1.8" fill="#020617" />
              {/* Specular reflections */}
              <circle cx="17.6" cy="14.2" r="0.9" fill="#ffffff" />
              <circle cx="14.8" cy="17.5" r="0.5" fill="#a5f3fc" />
              {/* Forensic axes */}
              <line x1="2.5" y1="16" x2="5" y2="16" stroke="#00f2fe" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="27" y1="16" x2="29.5" y2="16" stroke="#ec4899" strokeWidth="1.2" strokeLinecap="round" />
              <defs>
                <linearGradient id="navEyeStroke" x1="5" y1="16" x2="27" y2="16" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00f2fe" />
                  <stop offset="0.5" stopColor="#6366f1" />
                  <stop offset="1" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id="navIrisGrad" x1="11" y1="11" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="0.5" stopColor="#6366f1" />
                  <stop offset="1" stopColor="#1e1b4b" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Name Only */}
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-slate-100 transition-colors">
            Aookho
          </span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openHistory}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-emerald-500/40 text-slate-200 hover:text-white font-medium text-xs tracking-wide transition-all shadow-sm cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>History</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-xs tracking-wide transition-all shadow-sm"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
