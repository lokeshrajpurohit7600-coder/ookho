'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useHistory } from '@/context/HistoryContext';
import { getSearchHistory } from '@/lib/api';
import type { HistoryItem } from '@/lib/types';
import {
  X,
  History,
  RotateCcw,
  Search,
  ImageIcon,
  Video,
  FileText,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Loader2,
  Calendar,
} from 'lucide-react';

export function HistoryDrawer() {
  const router = useRouter();
  const { isHistoryOpen, closeHistory } = useHistory();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch search history whenever limit changes or drawer opens
  const fetchHistory = useCallback(async (requestedLimit: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSearchHistory(requestedLimit, 0);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load search history');
    } finally {
      setLoading(false);
    }
  }, []);

  // When drawer opens, reset limit to 10 and fetch initial 10 searches
  useEffect(() => {
    if (isHistoryOpen) {
      setLimit(10);
      setSearchQuery('');
      fetchHistory(10);
    }
  }, [isHistoryOpen, fetchHistory]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHistoryOpen) {
        closeHistory();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryOpen, closeHistory]);

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isHistoryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isHistoryOpen]);

  // Handle clicking "More"
  // Initially at 10 -> loads 100
  // When at 100 -> loads 200
  // When at 200 -> loads 300 (or +100)
  const handleLoadMore = () => {
    let nextLimit = 100;
    if (limit === 10) {
      nextLimit = 100;
    } else if (limit === 100) {
      nextLimit = 200;
    } else {
      nextLimit = limit + 100;
    }
    setLimit(nextLimit);
    fetchHistory(nextLimit);
  };

  const handleSelectReport = (uploadId: string) => {
    closeHistory();
    router.push(`/report/${uploadId}`);
  };

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.original_filename?.toLowerCase().includes(q) ||
        item.file_type?.toLowerCase().includes(q) ||
        item.verdict_label?.toLowerCase().includes(q) ||
        item.summary_text?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Confidence badge helper
  const renderConfidenceBadge = (item: HistoryItem) => {
    if (item.status === 'processing' || item.status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Loader2 className="w-3 h-3 animate-spin" />
          Analyzing...
        </span>
      );
    }

    if (item.ai_confidence === null || item.ai_confidence === undefined) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          No Score
        </span>
      );
    }

    const conf = Math.round(item.ai_confidence);
    if (conf >= 70) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-xs">
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          {conf}% AI
        </span>
      );
    } else if (conf >= 40) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <HelpCircle className="w-3 h-3 text-amber-400" />
          {conf}% Inconclusive
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          {100 - conf}% Real
        </span>
      );
    }
  };

  // Media icon helper
  const renderMediaIcon = (item: HistoryItem) => {
    if (item.file_type === 'video') {
      return (
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
          <Video className="w-5 h-5" />
        </div>
      );
    }
    if (item.file_type === 'text') {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
          <FileText className="w-5 h-5" />
        </div>
      );
    }
    // Image thumbnail or icon
    if (item.file_url) {
      return (
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 overflow-hidden shrink-0 relative group-hover:border-indigo-500/40 transition-colors">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.file_url}
            alt={item.original_filename}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon on error
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
              const iconEl = document.createElement('div');
              iconEl.innerHTML = `<svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
              e.currentTarget.parentElement?.appendChild(iconEl);
            }}
          />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
        <ImageIcon className="w-5 h-5" />
      </div>
    );
  };

  // Determine button text according to user spec
  // 10 -> next is 100
  // 100 -> next is 200
  // etc.
  const getMoreButtonText = () => {
    if (limit === 10) {
      return total > 100 ? 'Show More (100 Searches)' : `Show More (All ${total} Searches)`;
    } else if (limit === 100) {
      return total > 200 ? 'Show More (200 Searches)' : `Show More (All ${total} Searches)`;
    } else {
      const nextTarget = limit + 100;
      return total > nextTarget ? `Show More (${nextTarget} Searches)` : `Show More (All ${total} Searches)`;
    }
  };

  const hasMoreToLoad = items.length < total;

  if (!isHistoryOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        onClick={closeHistory}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Side Drawer Panel */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[490px] lg:w-[540px] bg-[#0c101c]/95 border-l border-white/[0.08] shadow-2xl backdrop-blur-xl flex flex-col transform transition-transform duration-300 ease-out translate-x-0"
        aria-label="Scan History Sidebar"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-white/[0.07] bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                Previous Searches & History
                {total > 0 && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                    {items.length} of {total}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Click any item to inspect its forensic report</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchHistory(limit)}
              disabled={loading}
              title="Refresh History"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-40"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={closeHistory}
              title="Close Panel"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Input */}
        <div className="p-3.5 border-b border-white/[0.05] bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by filename or format..."
              className="w-full bg-slate-900/80 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Drawer Content / List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => fetchHistory(limit)}
                className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {loading && items.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Loading previous searches...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center">
              <History className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-medium text-slate-300">
                {searchQuery ? 'No matching searches found' : 'No previous searches yet'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                {searchQuery
                  ? 'Try a different keyword or filename query.'
                  : 'Upload images, videos, or text to start analyzing digital authenticity.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={item.upload_id || idx}
                onClick={() => handleSelectReport(item.upload_id)}
                className="group relative p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/[0.05] hover:border-indigo-500/30 transition-all cursor-pointer shadow-xs flex items-center gap-3.5"
              >
                {/* Left: Thumbnail or Type Icon */}
                {renderMediaIcon(item)}

                {/* Middle: Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {item.original_filename || 'Untitled Media'}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 shrink-0">
                      {item.file_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formatDate(item.uploaded_at)}
                    </span>
                    {item.verdict_label && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="truncate text-slate-400 text-[10px]">
                          {item.verdict_label}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right / Side: Confidence Badge & Arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  {renderConfidenceBadge(item)}
                  <div className="w-7 h-7 rounded-lg bg-white/[0.03] group-hover:bg-indigo-500/20 text-slate-400 group-hover:text-indigo-300 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))
          )}

          {/* LOAD MORE BUTTON SECTION */}
          {hasMoreToLoad && (
            <div className="pt-2 pb-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-rose-500/15 hover:from-indigo-500/25 hover:via-violet-500/25 hover:to-rose-500/25 border border-indigo-500/30 text-white font-medium text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Loading searches...</span>
                  </>
                ) : (
                  <>
                    <span>+</span>
                    <span>{getMoreButtonText()}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {!hasMoreToLoad && items.length > 0 && (
            <div className="py-3 text-center text-[11px] text-slate-500 font-mono">
              All {total} scans loaded
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-white/[0.07] bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Aookho Forensic Archive</span>
          <button
            onClick={closeHistory}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
