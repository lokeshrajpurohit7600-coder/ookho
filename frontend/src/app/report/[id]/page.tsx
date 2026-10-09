'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  Download, 
  Scan,
  Sparkles,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  Bot
} from 'lucide-react';
import { getReport } from '@/lib/api';
import { DetectionReport } from '@/lib/types';
import { ConfidenceGauge } from '@/components/ConfidenceGauge';
import { HeatmapOverlay } from '@/components/HeatmapOverlay';
import { TechniquesList } from '@/components/TechniquesList';
import { MetadataAuditor } from '@/components/MetadataAuditor';
import { EvidenceList } from '@/components/EvidenceList';
import { VoiceAssistantBar } from '@/components/VoiceAssistantBar';

const SCAN_STEPS = [
  'Verifying file encoding and structure...',
  'Analyzing optical sensor noise and frequency spectra...',
  'Checking Error Level Analysis (ELA) and regional boundaries...',
  'Inspecting camera metadata and platform compression profiles...',
  'Synthesizing multi-signal authentication findings...'
];

export default function ReportPage() {
  const params = useParams();
  const uploadId = params?.id as string;

  const [report, setReport] = useState<DetectionReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  
  // Detailed technical breakdown is collapsed by default to keep the interface clean
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    if (!uploadId) return;

    let isSubscribed = true;
    let timer: NodeJS.Timeout;

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % SCAN_STEPS.length);
    }, 900);

    let attempts = 0;
    const MAX_ATTEMPTS = 50; // 60s timeout

    const fetchStatus = async () => {
      try {
        const data = await getReport(uploadId);
        if (!isSubscribed) return;

        if (data.status === 'failed') {
          setError('Forensic pipeline encountered an error processing this media. The file may be corrupted or in an unsupported format.');
          return;
        }

        setReport(data);

        if (data.status === 'pending' || data.status === 'processing') {
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            setError('Forensic analysis timed out after 60 seconds. Please try again or upload a different file.');
            return;
          }
          timer = setTimeout(fetchStatus, 1200);
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        setError(err.message || 'Failed to fetch detection report.');
      }
    };

    fetchStatus();

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      clearInterval(stepTimer);
    };
  }, [uploadId]);

  const handleDownloadJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aookho-report-${uploadId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1. Error State
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">{error}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium text-xs hover:from-indigo-600 hover:to-violet-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload Another File</span>
        </Link>
      </div>
    );
  }

  // 2. Loading State
  if (!report || report.status === 'pending' || report.status === 'processing') {
    return (
      <div className="max-w-xl mx-auto px-4 py-28 text-center">
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-amber-400 animate-spin" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-violet-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center text-amber-300">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
          Analyzing Media Authenticity
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Examining pixel noise, lighting gradients, and compression artifacts
        </p>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/[0.08] text-left max-w-md mx-auto shadow-sm">
          <div className="flex items-center gap-2 mb-1.5 text-xs text-amber-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Current Step:</span>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            {SCAN_STEPS[stepIndex]}
          </p>
        </div>
      </div>
    );
  }

  // 3. Robust Classification & Accuracy Metrics
  const aiPercentage = report.ai_confidence ?? 0;
  const naturalPercentage = Math.max(0, 100 - aiPercentage);

  const verdict = report.metadata_findings?.verdict;
  const isLikelyAI = verdict === 'likely_ai' || 
                     verdict === 'likely_synthetic' || 
                     (!verdict && aiPercentage >= 60);

  const isInconclusive = !isLikelyAI && (
    verdict === 'inconclusive' || 
    (!verdict && aiPercentage >= 35 && aiPercentage < 60)
  );

  const isNatural = !isLikelyAI && !isInconclusive;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 transition-all"
            title="Scan Another File"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Forensic Analysis Result
              </h1>
              
              {/* Top Status Badge: RED for AI, GREEN for Natural, AMBER for Inconclusive */}
              {isLikelyAI && (
                <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wide border bg-red-950/90 text-red-300 border-red-500 shadow-md shadow-red-500/20 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  AI MANIPULATED ({aiPercentage.toFixed(1)}%)
                </span>
              )}

              {isNatural && (
                <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wide border bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  NATURAL / NOT MANIPULATED ({naturalPercentage.toFixed(1)}%)
                </span>
              )}

              {isInconclusive && (
                <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wide border bg-amber-950/90 text-amber-300 border-amber-500 shadow-md shadow-amber-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  INCONCLUSIVE ({aiPercentage.toFixed(1)}% Flagged)
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 font-sans">
              <span className="font-medium text-slate-200 truncate max-w-sm">{report.original_filename}</span>
              <span>•</span>
              <span>{report.created_at ? new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/[0.08] hover:border-white/20 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-xs tracking-wide transition-all shadow-sm"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan Another</span>
          </Link>
        </div>
      </div>

      {/* Prominent High-Impact Verdict Banner (RED for AI Manipulated, GREEN for Natural) */}
      {isLikelyAI && (
        <div className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/90 via-rose-950/80 to-slate-900 border-2 border-red-500/80 shadow-xl shadow-red-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-red-400 tracking-wide">
                  AI MANIPULATED / DEEPFAKE DETECTED
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 font-mono">
                  {aiPercentage.toFixed(1)}% AI Likelihood
                </span>
              </div>
              <p className="text-xs sm:text-sm text-red-200/90 mt-0.5 font-medium">
                High-confidence detection: Multi-signal forensic analysis flagged significant synthetic generative artifacts or digital tampering.
              </p>
            </div>
          </div>
        </div>
      )}

      {isNatural && (
        <div className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-900 border-2 border-emerald-500/80 shadow-xl shadow-emerald-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-emerald-400 tracking-wide">
                  NATURAL — NOT MANIPULATED
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  {naturalPercentage.toFixed(1)}% Natural Capture
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-0.5 font-medium">
                Genuine media: Consistent camera sensor noise, natural lighting gradients, and authentic frequency decay verified across all dimensions.
              </p>
            </div>
          </div>
        </div>
      )}

      {isInconclusive && (
        <div className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-yellow-950/80 to-slate-900 border-2 border-amber-500/80 shadow-xl shadow-amber-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-amber-400 tracking-wide">
                  INCONCLUSIVE — WEAK UNCORROBORATED ARTIFACT
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  {naturalPercentage.toFixed(1)}% Natural / {aiPercentage.toFixed(1)}% Flagged
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-200/90 mt-0.5 font-medium">
                A single weak anomaly was noted but lacks multi-signal corroboration. Likely caused by social media recompression or lighting variance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section: Media Viewer (Left) + Authentication Gauge (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (7 cols): Visual Media Viewer with Anomaly Overlay */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <HeatmapOverlay
            mediaUrl={report.file_url}
            fileType={report.file_type}
            originalFilename={report.original_filename}
            regions={report.edited_regions}
          />
        </div>

        {/* Right (5 cols): Authentication Status Card */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <ConfidenceGauge
            aiConfidence={aiPercentage}
            editConfidence={report.edit_confidence ?? 0}
            verdict={report.metadata_findings?.verdict}
            verdictLabel={report.metadata_findings?.verdict_label}
            triggeredCount={report.metadata_findings?.triggered_count}
          />

          {/* Clean Summary Analysis Box */}
          <div className="p-5 rounded-3xl artistic-panel border border-white/[0.08] text-xs text-slate-300 leading-relaxed">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-semibold text-slate-200">
                Summary Analysis
              </span>
            </div>
            <p className="text-slate-300/90">{report.summary_text}</p>
          </div>
        </div>
      </div>

      {/* PROMINENT AI CHATBOT (Directly visible and easily accessible right here!) */}
      <div className="w-full flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <span>Interactive Forensic AI Assistant</span>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Ask Anything
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Voice & Text Enabled
          </span>
        </div>
        
        {/* Full-featured Chatbot Component */}
        <VoiceAssistantBar uploadId={report.upload_id} />
      </div>

      {/* USER REQUIREMENT:
          Detailed technical report is collapsed behind a clean toggle button.
          No Hindi text used.
      */}
      <div className="w-full flex flex-col items-center justify-center py-6 border-t border-b border-white/[0.08] my-2">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails((prev) => !prev)}
          className="flex items-center gap-3.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-2 border-indigo-500/40 hover:border-indigo-400 text-white font-bold text-sm tracking-wide shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer group"
        >
          <FileText className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>
            {showTechnicalDetails 
              ? 'Hide Technical Forensic Breakdown' 
              : 'View Full Technical Forensic Data (ELA, FFT, Metadata, Noise)'}
          </span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-5 h-5 text-indigo-300 group-hover:-translate-y-0.5 transition-transform" />
          ) : (
            <ChevronDown className="w-5 h-5 text-indigo-300 group-hover:translate-y-0.5 transition-transform animate-bounce" />
          )}
        </button>
        {!showTechnicalDetails && (
          <p className="text-xs text-slate-400 mt-2.5 font-sans text-center">
            Click to inspect detailed 4-Signal metrics, Error Level Analysis (ELA) ratios, FFT spectra, and camera EXIF auditor
          </p>
        )}
      </div>

      {/* DETAILED TECHNICAL BREAKDOWN (Revealed only when button is clicked) */}
      {showTechnicalDetails && (
        <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): 4 Independent Forensic Signals */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <EvidenceList
                evidenceList={report.metadata_findings?.evidence_list || []}
                triggeredCount={report.metadata_findings?.triggered_count ?? 0}
                verdict={report.metadata_findings?.verdict}
                verdictLabel={report.metadata_findings?.verdict_label}
              />
            </div>

            {/* Right Column (5 cols): File Info & Camera Specifications */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <MetadataAuditor
                metadata={report.metadata_findings}
                models={report.model_versions}
              />

              {/* Detected Techniques */}
              <TechniquesList techniques={report.detected_techniques} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
