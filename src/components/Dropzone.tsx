import React, { useState, useRef } from 'react';
import { Upload, FileText, BookMarked, Sparkles, AlertCircle, FileCheck } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSampleEpub: () => void;
  onLoadSamplePdf: () => void;
  isProcessing?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  onLoadSampleEpub,
  onLoadSamplePdf,
  isProcessing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'epub' || ext === 'pdf') {
          validFiles.push(file);
        }
      }
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files);
      onFilesSelected(validFiles);
      // Reset input value so same files can be re-selected if desired
      e.target.value = '';
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 ${
        isDragOver
          ? 'border-blue-500 bg-blue-500/10 scale-[0.995]'
          : 'border-white/10 hover:border-blue-500/40 bg-[#111114]/60 hover:bg-[#111114]'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept=".epub,.pdf,application/epub+zip,application/pdf"
        className="hidden"
      />

      <div className="w-16 h-16 rounded-2xl bg-[#16161a] border border-white/10 flex items-center justify-center text-blue-400 shadow-xs">
        <Upload className="w-8 h-8 text-blue-400 animate-pulse" />
      </div>

      <div className="max-w-md space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-white font-sans">
          Drop EPUBs or PDFs here to edit & optimize
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 font-serif leading-relaxed">
          Supports single documents or bulk batches. Auto-formats titles, repairs e-reader cover declarations, finds high-res art, and applies e-ink contrast tuning.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#16161a] text-zinc-300 border border-white/10">
          <BookMarked className="w-3.5 h-3.5 text-blue-400" />
          <span>EPUB 2.0 / 3.0</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#16161a] text-zinc-300 border border-white/10">
          <FileText className="w-3.5 h-3.5 text-rose-400" />
          <span>PDF Documents</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <FileCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>E-Reader Cover Fix Engine</span>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div
        className="mt-4 pt-4 border-t border-white/10 w-full max-w-lg flex flex-col sm:flex-row items-center justify-center gap-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-zinc-400 font-medium">Want to test right away?</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSampleEpub}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16161a] hover:bg-[#202026] text-zinc-200 border border-white/10 shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sample EPUB</span>
          </button>
          <button
            type="button"
            onClick={onLoadSamplePdf}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16161a] hover:bg-[#202026] text-zinc-200 border border-white/10 shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Sample PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
