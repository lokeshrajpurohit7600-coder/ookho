'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  X,
  FileSearch
} from 'lucide-react';
import { uploadMediaFile, uploadTextSnippet } from '@/lib/api';

const SAMPLE_AI_TEXT = `Furthermore, it is essential to recognize that generative artificial intelligence models operate by optimizing statistical likelihood across high-dimensional semantic spaces. In this context, the integration of multimodal perceptual pipelines facilitates seamless synthesized content generation. Therefore, analyzing frequency distributions and latent feature representations remains a crucial step in maintaining epistemic integrity across digital communications.`;

export function UploadWidget() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'media' | 'text'>('media');
  
  // Media file state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Text state
  const [textContent, setTextContent] = useState('');
  
  // Loading & error state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setErrorMessage(null);
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm', 'gif'];
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(ext) && !selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      setErrorMessage(`Unsupported format .${ext}. Please upload JPG, PNG, WEBP, or MP4/MOV/WEBM video.`);
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (activeTab === 'media') {
        if (!file) {
          setErrorMessage('Please select an image or video file to analyze.');
          setIsLoading(false);
          return;
        }
        const res = await uploadMediaFile(file);
        router.push(`/report/${res.upload_id}`);
      } else {
        if (!textContent.trim()) {
          setErrorMessage('Please enter or paste text content to analyze.');
          setIsLoading(false);
          return;
        }
        const res = await uploadTextSnippet(textContent);
        router.push(`/report/${res.upload_id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis initiation failed. Please check backend connection.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto artistic-panel rounded-3xl p-6 sm:p-8 border border-white/[0.08] relative overflow-hidden">
      {/* Subtle warm ambient light in corner */}
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-gradient-to-br from-indigo-500/15 via-rose-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Segmented Artistic Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-white/[0.07] w-fit mb-6">
        <button
          type="button"
          onClick={() => { setActiveTab('media'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-wide transition-all ${
            activeTab === 'media'
              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Image & Video Forensics</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('text'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-wide transition-all ${
            activeTab === 'text'
              ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Synthetic Text Detector</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-start gap-3 text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-rose-100">Upload Issue</span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* MEDIA TAB */}
      {activeTab === 'media' && (
        <div>
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-950/30'
                  : 'border-white/[0.12] hover:border-white/25 bg-slate-900/40 hover:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-violet-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center text-indigo-300">
                <Upload className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-semibold text-white">
                  Drop image or video here, or <span className="text-amber-300 underline decoration-amber-300/40 underline-offset-4">browse files</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Supports JPG, PNG, WEBP, MP4, MOV, WEBM
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/[0.06] text-[11px] text-rose-300 font-mono">
                  FaceForensics++
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/[0.06] text-[11px] text-amber-300 font-mono">
                  Frequency DCT
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/[0.06] text-[11px] text-emerald-300 font-mono">
                  EXIF & Sensor Audit
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/[0.08] flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Thumbnail */}
              <div className="w-24 h-24 rounded-xl bg-slate-950 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Film className="w-8 h-8 text-indigo-400" />
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                    {file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'}
                  </span>
                  <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for neural decomposition
                </p>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TEXT TAB */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Paste suspicious text snippet
            </label>
            <button
              type="button"
              onClick={() => setTextContent(SAMPLE_AI_TEXT)}
              className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Insert Synthetic Sample
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={6}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste article excerpts, essays, social media posts, or generated responses here to evaluate perplexity, burstiness, and LLM artifacts..."
              className="w-full rounded-2xl bg-slate-900/90 border border-white/[0.1] p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/70 transition-all resize-none font-sans"
            />
            <div className="absolute bottom-3 right-3 text-[11px] text-slate-500 font-mono">
              {textContent.length} chars
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Zero-retention forensic audit mode</span>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isLoading || (activeTab === 'media' && !file) || (activeTab === 'text' && !textContent.trim())}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-rose-500 hover:from-indigo-600 hover:via-purple-700 hover:to-rose-600 text-white font-semibold text-sm tracking-wide shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing Media...</span>
            </>
          ) : (
            <>
              <FileSearch className="w-4 h-4" />
              <span>Analyze with Aookho</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
