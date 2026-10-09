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
          {/* Favicon / Artistic Eye Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 via-rose-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center group-hover:border-white/25 transition-all shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
              <path
                d="M4 16C7 9.5 11 6.5 16 6.5C21 6.5 25 9.5 28 16C25 22.5 21 25.5 16 25.5C11 25.5 7 22.5 4 16Z"
                stroke="url(#navEyeStroke)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="16" cy="16" r="5.5" fill="url(#navIrisGrad)" />
              <circle cx="16" cy="16" r="2.8" fill="#090d16" />
              <circle cx="17.5" cy="14.5" r="1.1" fill="#ffffff" />
              <defs>
                <linearGradient id="navEyeStroke" x1="4" y1="16" x2="28" y2="16" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f97316" />
                  <stop offset="0.5" stopColor="#ec4899" />
                  <stop offset="1" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="navIrisGrad" x1="11" y1="11" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#fbbf24" />
                  <stop offset="0.4" stopColor="#f43f5e" />
                  <stop offset="1" stopColor="#6366f1" />
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
