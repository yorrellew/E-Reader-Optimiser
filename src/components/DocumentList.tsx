import React, { useState } from 'react';
import { BookDocument } from '../types';
import { BookOpen, FileText, CheckCircle2, AlertTriangle, Sparkles, Trash2, Search, CheckSquare, Square } from 'lucide-react';
import { formatFilename } from '../utils/filenameFormatter';

interface DocumentListProps {
  documents: BookDocument[];
  selectedDocId: string | null;
  onSelectDoc: (id: string) => void;
  onRemoveDoc: (id: string) => void;
  selectedBatchIds: string[];
  onToggleBatchSelect: (id: string) => void;
  onSelectAllBatch: (select: boolean) => void;
  renamingPattern: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocId,
  onSelectDoc,
  onRemoveDoc,
  selectedBatchIds,
  onToggleBatchSelect,
  onSelectAllBatch,
  renamingPattern,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      doc.metadata.title.toLowerCase().includes(q) ||
      (doc.metadata.authors || []).some((a) => a.toLowerCase().includes(q)) ||
      doc.originalName.toLowerCase().includes(q)
    );
  });

  const allSelected = documents.length > 0 && selectedBatchIds.length === documents.length;

  return (
    <div className="flex flex-col h-full bg-[#111114] border-r border-white/10">
      {/* List Header with Search & Batch Select */}
      <div className="p-3.5 border-b border-white/10 space-y-2.5 bg-[#0d0d10]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Documents ({documents.length})
            </span>
          </div>

          {documents.length > 1 && (
            <button
              onClick={() => onSelectAllBatch(!allSelected)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              {allSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Select All</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Search input if multiple docs */}
        {documents.length > 3 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter titles or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#16161a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-500"
            />
          </div>
        )}
      </div>

      {/* Document Items Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
        {filteredDocs.map((doc) => {
          const isCurrent = doc.id === selectedDocId;
          const isBatchSelected = selectedBatchIds.includes(doc.id);
          const computedFilename = formatFilename(renamingPattern, doc.metadata, doc.fileType);

          return (
            <div
              key={doc.id}
              onClick={() => onSelectDoc(doc.id)}
              className={`group relative rounded-xl p-2.5 transition-all flex items-start gap-3 cursor-pointer ${
                isCurrent
                  ? 'bg-blue-600/15 border border-blue-500/40 shadow-xs'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              {/* Batch Checkbox */}
              {documents.length > 1 && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBatchSelect(doc.id);
                  }}
                  className="pt-1 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                >
                  {isBatchSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </div>
              )}

              {/* Cover Thumbnail */}
              <div className="w-12 h-16 rounded-md overflow-hidden bg-[#16161a] border border-white/10 shrink-0 relative shadow-2xs flex items-center justify-center">
                {doc.coverDataUrl ? (
                  <img
                    src={doc.coverDataUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-500 p-1 text-center">
                    {doc.fileType === 'epub' ? (
                      <BookOpen className="w-5 h-5 text-zinc-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-zinc-500" />
                    )}
                    <span className="text-[9px] font-sans mt-0.5">No Art</span>
                  </div>
                )}

                {/* File Type Badge */}
                <span
                  className={`absolute top-0.5 left-0.5 px-1 py-0.2 rounded text-[8px] font-bold uppercase ${
                    doc.fileType === 'epub'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                      : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                  }`}
                >
                  {doc.fileType}
                </span>
              </div>

              {/* Document Meta Info */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate font-sans">
                    {doc.metadata.title || doc.originalName}
                  </h4>
                </div>

                <p className="text-[11px] text-zinc-400 truncate font-serif">
                  {(doc.metadata.authors && doc.metadata.authors.length > 0)
                    ? doc.metadata.authors.join(', ')
                    : 'Unknown Author'}
                </p>

                {doc.metadata.series && (
                  <p className="text-[10px] text-blue-400 font-semibold truncate font-sans">
                    {doc.metadata.series} {doc.metadata.seriesIndex ? `#${doc.metadata.seriesIndex}` : ''}
                  </p>
                )}

                {/* Target Name preview */}
                <p className="text-[10px] text-zinc-500 truncate font-mono mt-1" title={computedFilename}>
                  → {computedFilename}
                </p>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {doc.coverDataUrl ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Cover Ready</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                      <span>Missing Cover</span>
                    </span>
                  )}
                  {doc.status === 'analyzing' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                      <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                      <span>Analyzing</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Remove button on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveDoc(doc.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 rounded transition-all"
                title="Remove from list"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
