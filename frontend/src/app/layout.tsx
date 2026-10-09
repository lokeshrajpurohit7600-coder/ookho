import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { HistoryProvider } from '@/context/HistoryContext';
import { HistoryDrawer } from '@/components/HistoryDrawer';

export const metadata: Metadata = {
  title: 'Aookho — AI & Deepfake Forensics Platform',
  description: 'Artistic, precise media forensics. Uncover latent diffusion signatures, GAN textures, facial warping, and synthetic artifacts.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <HistoryProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <HistoryDrawer />
          <footer className="border-t border-white/[0.06] bg-[#0c101c]/90 py-6 text-center text-xs text-slate-400">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">Aookho</span>
                <span className="text-slate-600">•</span>
                <span>Synthetic Media Forensics & Visual Truth</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="inline-flex items-center gap-1.5 text-indigo-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Spatial Vision
                </span>
                <span className="text-slate-700">•</span>
                <span className="inline-flex items-center gap-1.5 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  DCT Analysis
                </span>
                <span className="text-slate-700">•</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Scan History
                </span>
              </div>
            </div>
          </footer>
        </HistoryProvider>
      </body>
    </html>
  );
}
