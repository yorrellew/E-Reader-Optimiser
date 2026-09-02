import React from 'react';
import { Download, Trash2, RefreshCw, FileArchive, Plus, CopyCheck, Settings2 } from 'lucide-react';
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
  onApplyUniversal,
  isProcessing,
}) => {
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

        <button
          type="button"
          onClick={onAddMoreFiles}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#16161a] hover:bg-[#202026] text-zinc-200 border border-white/10 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Files</span>
        </button>

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
