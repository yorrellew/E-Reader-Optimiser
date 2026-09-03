import React, { useState, useRef, useEffect } from 'react';
import { Download, Trash2, RefreshCw, FileArchive, Plus, CopyCheck, Settings2, ChevronDown, FolderUp, Files, Sparkles, Upload } from 'lucide-react';
import { RENAMING_PRESETS } from '../utils/presets';

interface BatchToolbarProps {
  documentCount: number;
  selectedBatchCount: number;
  renamingPattern: string;
  onSelectRenamingPattern: (pattern: string) => void;
  targetFormat: string;
  onTargetFormatChange: (format: string) => void;
  compressionLevel: number;
  onCompressionLevelChange: (level: number) => void;
  onBulkDownload: () => void;
  onClearAll: () => void;
  onAddMoreFiles: () => void;
  onAddFolder?: () => void;
  onLoadSampleBatch?: () => void;
  onFilesSelected?: (files: File[]) => void;
  onApplyUniversal: () => void;
  isProcessing: boolean;
}

export const BatchToolbar: React.FC<BatchToolbarProps> = ({
  documentCount,
  selectedBatchCount,
  renamingPattern,
  onSelectRenamingPattern,
  targetFormat,
  onTargetFormatChange,
  compressionLevel,
  onCompressionLevelChange,
  onBulkDownload,
  onClearAll,
  onAddMoreFiles,
  onAddFolder,
  onLoadSampleBatch,
  onFilesSelected,
  onApplyUniversal,
  isProcessing,
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (documentCount === 0) return null;

  const formats = [
    { value: 'epub', label: 'EPUB' },
    { value: 'kepub', label: 'KEPUB (Kobo)' },
    { value: 'mobi', label: 'MOBI' },
    { value: 'prc', label: 'PRC' },
    { value: 'azw3', label: 'AZW3 (Kindle)' },
    { value: 'kfx', label: 'KFX' },
    { value: 'pdf', label: 'PDF' },
    { value: 'html', label: 'HTML' },
    { value: 'txt', label: 'Plain Text' }
  ];

  return (
    <div className="bg-[#111114] text-zinc-100 px-4 py-2.5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 border border-white/10">
      {/* Left: Settings */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={renamingPattern}
          onChange={(e) => onSelectRenamingPattern(e.target.value)}
          title="Naming Rule"
          className="bg-[#16161a] text-zinc-200 text-xs font-medium rounded-lg px-2.5 py-1.5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          {RENAMING_PRESETS.map((preset) => (
            <option key={preset.pattern} value={preset.pattern} className="bg-[#16161a] text-zinc-200">
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={targetFormat}
          onChange={(e) => onTargetFormatChange(e.target.value)}
          title="Export Format"
          className="bg-[#16161a] text-zinc-200 text-xs font-medium rounded-lg px-2.5 py-1.5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          {formats.map((fmt) => (
            <option key={fmt.value} value={fmt.value} className="bg-[#16161a] text-zinc-200">
              {fmt.label}
            </option>
          ))}
        </select>
        
        <button
          type="button"
          onClick={onApplyUniversal}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          title="Apply current active document settings to all documents"
        >
          <CopyCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Apply to All</span>
        </button>

        {/* Add Files Dropdown & Bulk Options */}
        <div className="relative" ref={optionsRef}>
          <div className="inline-flex items-center rounded-lg border border-white/10 bg-[#16161a] shadow-xs hover:border-white/20 transition-all">
            <button
              type="button"
              onClick={onAddMoreFiles}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg text-xs font-bold text-zinc-200 hover:bg-[#202026] hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Bulk upload multiple files (.epub, .pdf)"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Add Files</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono hidden md:inline">Bulk</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOptionsOpen((prev) => !prev)}
              disabled={isProcessing}
              className="px-2 py-1.5 border-l border-white/10 rounded-r-lg text-zinc-400 hover:bg-[#202026] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Add Files Options (Bulk Upload, Folder, Samples)"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOptionsOpen ? 'rotate-180 text-blue-400' : ''}`} />
            </button>
          </div>

          {isOptionsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#16161a] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 space-y-1.5 backdrop-blur-md">
              <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-300 tracking-wide">Add Files Options</span>
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Bulk Upload Enabled
                </span>
              </div>

              {/* Option 1: Multiple Files Bulk Selection */}
              <button
                type="button"
                onClick={() => {
                  setIsOptionsOpen(false);
                  onAddMoreFiles();
                }}
                className="w-full p-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-start gap-3 text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                  <Files className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-zinc-100 group-hover:text-blue-300 transition-colors">
                      Bulk Upload Multiple Files
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold shrink-0">
                      Multi-Select
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-serif mt-0.5 leading-snug">
                    Select multiple EPUBs or PDFs at once. Use <kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px] font-mono text-zinc-300">Ctrl</kbd> or <kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px] font-mono text-zinc-300">Shift</kbd> to select many files.
                  </p>
                </div>
              </button>

              {/* Option 2: Folder Upload */}
              {onAddFolder && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsOpen(false);
                    onAddFolder();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-start gap-3 text-left cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                    <FolderUp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                        Upload Entire Folder
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold shrink-0">
                        Folder Batch
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-serif mt-0.5 leading-snug">
                      Import all e-books and PDFs contained within a local directory and subfolders.
                    </p>
                  </div>
                </button>
              )}

              {/* Option 3: Sample Batch */}
              {onLoadSampleBatch && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsOpen(false);
                    onLoadSampleBatch();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-start gap-3 text-left cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                        Load Demo Book Batch
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold shrink-0">
                        EPUB + PDF
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-serif mt-0.5 leading-snug">
                      Instantly populate the queue with sample files to test batch actions.
                    </p>
                  </div>
                </button>
              )}

              {/* Quick Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOptionsOpen(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    onFilesSelected?.(Array.from(e.dataTransfer.files));
                  }
                }}
                onClick={() => {
                  setIsOptionsOpen(false);
                  onAddMoreFiles();
                }}
                className="mt-1 p-2.5 border border-dashed border-white/10 hover:border-blue-500/40 rounded-xl text-center bg-white/[0.02] hover:bg-blue-500/[0.04] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-300">
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Or drag & drop multiple files here</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onBulkDownload}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {isProcessing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileArchive className="w-3.5 h-3.5" />
          )}
          <span>
            {selectedBatchCount > 0 && selectedBatchCount < documentCount
              ? `Export (${selectedBatchCount})`
              : `Export All (${documentCount})`}
          </span>
        </button>

        <button
          type="button"
          onClick={onClearAll}
          disabled={isProcessing}
          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          title="Clear all documents"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
