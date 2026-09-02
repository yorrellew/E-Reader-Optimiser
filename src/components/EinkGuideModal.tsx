import React from 'react';
import { X, CheckCircle2, AlertOctagon, HelpCircle, MonitorSmartphone, Layers, BookCheck, ShieldAlert } from 'lucide-react';

interface EinkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EinkGuideModal: React.FC<EinkGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111114] rounded-2xl shadow-2xl border border-white/10 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-zinc-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#16161a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MonitorSmartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                E-Reader Cover Compatibility Guide
              </h3>
              <p className="text-xs text-zinc-400 font-serif">
                Why e-reader covers disappear and how this studio fixes them permanently
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-zinc-300 text-xs sm:text-sm font-serif leading-relaxed bg-[#0a0a0c]">
          {/* Section 1: The Problem */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-sans flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>The Problem with Side-loaded EPUBs & PDFs</span>
            </h4>
            <p>
              When copying books to <strong>Kindle</strong>, <strong>Kobo</strong>, <strong>Onyx Boox</strong>, or other compact e-readers, files often display generic gray placeholder boxes or truncated filenames like <code className="bg-[#16161a] border border-white/10 px-1.5 py-0.5 rounded text-zinc-200 font-mono text-xs">book_v1.0_retail.epub</code> on your shelf.
            </p>
            <p>
              Different e-reader operating systems scan for cover images in completely different ways:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-400">
              <li><strong className="text-zinc-200">Pocket E-Reader Firmware:</strong> Looks strictly for both EPUB 2 <code className="bg-[#16161a] border border-white/10 px-1 py-0.5 rounded font-mono text-[11px] text-zinc-300">&lt;meta name="cover"&gt;</code> and a valid <code className="bg-[#16161a] border border-white/10 px-1 py-0.5 rounded font-mono text-[11px] text-zinc-300">&lt;guide&gt;&lt;reference type="cover"&gt;</code> landmark.</li>
              <li><strong className="text-zinc-200">Kobo & Calibre:</strong> Prioritizes EPUB 3 <code className="bg-[#16161a] border border-white/10 px-1 py-0.5 rounded font-mono text-[11px] text-zinc-300">properties="cover-image"</code>.</li>
              <li><strong className="text-zinc-200">Kindle Paperwhite:</strong> Requires clean JPEG/PNG raster data and specific aspect ratios to display full lockscreen wallpaper.</li>
            </ul>
          </div>

          {/* Section: Compact Hardware Display Specifications */}
          <div className="space-y-3 bg-[#16161a] p-4 rounded-xl border border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-sans flex items-center gap-1.5">
              <MonitorSmartphone className="w-4 h-4 text-blue-400" />
              <span>Popular E-Reader Hardware Profiles</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-[#111114] border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Universal 6"-7"</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Standard</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  3:4 aspect ratio · 300 PPI Carta display · Kindle Paperwhite, Kobo Clara/Libra, Onyx Boox
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#111114] border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>4.3" Pocket</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-300">Compact</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  3:5 aspect ratio · 480×800 (220 PPI) · Compact pocket e-reader display format
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#111114] border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>3.7" Ultra-Pocket</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-300">Mini</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  3:5 aspect ratio · 480×800 (259 PPI) · High-density ultra-compact screen
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: How this tool solves it */}
          <div className="space-y-3 bg-[#16161a] p-4 rounded-xl border border-blue-500/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 font-sans flex items-center gap-1.5">
              <BookCheck className="w-4 h-4 text-blue-400" />
              <span>What This Studio Solves Automatically</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-sans">Dual EPUB 2 & 3 Manifest Tags:</strong> Injects both EPUB 2 <code className="font-mono text-[10px] text-zinc-400">meta name="cover"</code> and EPUB 3 <code className="font-mono text-[10px] text-zinc-400">properties="cover-image"</code>.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-sans">Zero-Margin Cover.xhtml:</strong> Generates responsive viewport wrapper to prevent blank margins or page-bleed on e-ink.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-sans">Strict Mimetype Zero-Compression:</strong> Ensures byte-exact uncompressed ZIP header required by e-reader indexers.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-sans">E-Ink Contrast Tuning:</strong> Quantizes and optimizes color palettes with 16-level grayscale or Atkinson dithering for maximum e-ink readability.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: PDF Optimization */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-sans flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-zinc-400" />
              <span>PDF Optimization For E-Readers</span>
            </h4>
            <p>
              PDF documents don't have EPUB manifests, but e-readers extract their thumbnail from <strong>Page 1</strong> and the internal <strong>Document Information Dictionary</strong>.
            </p>
            <p>
              This studio allows you to:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400 pl-1">
              <li>Prepend or replace Page 1 with a crisp 3:4 high-res book cover.</li>
              <li>Embed standard Title, Author, and Subject tags so e-readers categorize them properly.</li>
              <li>Optionally convert PDF text into a clean native EPUB book.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#16161a] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
