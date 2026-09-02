import React, { useState, useEffect } from 'react';
import { BookMetadata, MetadataSuggestion } from '../types';
import {
  Sparkles,
  Check,
  X,
  BookOpen,
  User,
  Bookmark,
  Calendar,
  Building,
  Tag,
  AlignLeft,
  Search,
  CheckCheck,
  ArrowRight,
  FileCheck2,
  HelpCircle,
  FileText,
  ShieldCheck,
  Globe,
  Hash,
  Image as ImageIcon,
} from 'lucide-react';

interface MetadataSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMetadata: BookMetadata;
  suggestion: MetadataSuggestion | null;
  rawFilename: string;
  extractedSampleSnippet?: string;
  onApplySuggestions: (selectedFields: Partial<BookMetadata>, applyCoverUrl?: string) => void;
  onOpenCoverSearchWithQuery?: (query: string) => void;
}

export const MetadataSuggestionModal: React.FC<MetadataSuggestionModalProps> = ({
  isOpen,
  onClose,
  currentMetadata,
  suggestion,
  rawFilename,
  extractedSampleSnippet,
  onApplySuggestions,
  onOpenCoverSearchWithQuery,
}) => {
  if (!isOpen || !suggestion) return null;

  // Selected field toggles (default to true if suggested differs from current)
  const [selectedFields, setSelectedFields] = useState<{ [key: string]: boolean }>({
    title: Boolean(suggestion.title && suggestion.title !== currentMetadata.title),
    authors: Boolean(
      (suggestion.allAuthors?.length || suggestion.author) &&
        (suggestion.author !== currentMetadata.authors?.[0] ||
          suggestion.allAuthors?.join(', ') !== currentMetadata.authors?.join(', '))
    ),
    series: Boolean(suggestion.series && suggestion.series !== currentMetadata.series),
    seriesIndex: Boolean(
      suggestion.seriesIndex && suggestion.seriesIndex !== currentMetadata.seriesIndex
    ),
    publisher: Boolean(suggestion.publisher && suggestion.publisher !== currentMetadata.publisher),
    publishedDate: Boolean(
      suggestion.publishedDate && suggestion.publishedDate !== currentMetadata.publishedDate
    ),
    description: Boolean(
      suggestion.description && suggestion.description !== currentMetadata.description
    ),
    genres: Boolean(
      suggestion.genres?.length &&
        suggestion.genres.join(', ') !== currentMetadata.genres?.join(', ')
    ),
    language: Boolean(suggestion.language && suggestion.language !== currentMetadata.language),
  });

  const [applyCoverArt, setApplyCoverArt] = useState<boolean>(Boolean(suggestion.suggestedCoverUrl));

  const toggleField = (key: string) => {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = (val: boolean) => {
    const updated: { [key: string]: boolean } = {};
    Object.keys(selectedFields).forEach((k) => {
      updated[k] = val;
    });
    setSelectedFields(updated);
    if (suggestion.suggestedCoverUrl) {
      setApplyCoverArt(val);
    }
  };

  const handleApply = () => {
    const patch: Partial<BookMetadata> = {};

    if (selectedFields.title && suggestion.title) patch.title = suggestion.title;
    if (selectedFields.authors) {
      if (suggestion.allAuthors && suggestion.allAuthors.length > 0) {
        patch.authors = suggestion.allAuthors;
      } else if (suggestion.author) {
        patch.authors = [suggestion.author];
      }
    }
    if (selectedFields.series && suggestion.series !== undefined) patch.series = suggestion.series;
    if (selectedFields.seriesIndex && suggestion.seriesIndex !== undefined)
      patch.seriesIndex = suggestion.seriesIndex;
    if (selectedFields.publisher && suggestion.publisher) patch.publisher = suggestion.publisher;
    if (selectedFields.publishedDate && suggestion.publishedDate)
      patch.publishedDate = suggestion.publishedDate;
    if (selectedFields.description && suggestion.description)
      patch.description = suggestion.description;
    if (selectedFields.genres && suggestion.genres) patch.genres = suggestion.genres;
    if (selectedFields.language && suggestion.language) patch.language = suggestion.language;

    onApplySuggestions(patch, applyCoverArt && suggestion.suggestedCoverUrl ? suggestion.suggestedCoverUrl : undefined);
    onClose();
  };

  const countSelected = Object.values(selectedFields).filter(Boolean).length + (applyCoverArt && suggestion.suggestedCoverUrl ? 1 : 0);
  const suggestedAuthorDisplay =
    suggestion.allAuthors?.join(', ') || suggestion.author || 'Unknown Author';
  const currentAuthorDisplay = currentMetadata.authors?.join(', ') || 'Unknown Author';

  const confidenceScore = suggestion.confidenceScore || 85;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#18181f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-sans">
                  Deep Book Identification & Metadata Proposal
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {confidenceScore}% Match
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Verified against document colophons, body text excerpts, and online bibliographic catalogs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Identified Summary Card with Source Clues */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#191926] to-[#121218] border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  <Globe className="w-3 h-3 text-blue-400" />
                  {suggestion.source === 'web_catalog' ? 'Web Catalog Match' : 'Bibliographic Search'}
                </span>
                {suggestion.isbn && (
                  <span className="text-[10px] font-mono text-zinc-300 bg-black/40 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-zinc-400" />
                    ISBN: {suggestion.isbn}
                  </span>
                )}
              </div>
              <h4 className="text-lg font-bold text-white">
                {suggestion.title || currentMetadata.title}
              </h4>
              <p className="text-xs text-zinc-300">
                by <span className="font-semibold text-zinc-100">{suggestedAuthorDisplay}</span>
                {suggestion.series && (
                  <span className="ml-2 text-zinc-400">
                    · Series: <span className="text-zinc-200 font-medium">{suggestion.series}</span> {suggestion.seriesIndex ? `(Book ${suggestion.seriesIndex})` : ''}
                  </span>
                )}
              </p>
              {suggestion.confidenceNotes && (
                <p className="text-[11px] text-zinc-400 italic">
                  Evidence: {suggestion.confidenceNotes}
                </p>
              )}
            </div>

            {onOpenCoverSearchWithQuery && (
              <button
                type="button"
                onClick={() => {
                  const query = `${suggestion.title || currentMetadata.title} ${suggestedAuthorDisplay}`.trim();
                  onOpenCoverSearchWithQuery(query);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search High-Res Covers</span>
              </button>
            )}
          </div>

          {/* Quick Select / Deselect controls */}
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span className="font-medium text-zinc-300">Compare Current vs. Proposed Changes:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectAll(true)}
                className="text-blue-400 hover:underline font-medium"
              >
                Select All
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => selectAll(false)}
                className="text-zinc-400 hover:underline font-medium"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Side-by-Side Comparison Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold uppercase tracking-wider text-zinc-400 px-3 py-1.5 bg-[#101014] rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>Current File State</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Proposed Canonical Metadata</span>
            </div>
          </div>

          {/* Suggestions Comparison Rows */}
          <div className="space-y-2.5">
            {/* 1. Title */}
            {suggestion.title && (
              <FieldDiffRow
                icon={<BookOpen className="w-4 h-4 text-blue-400" />}
                label="Book Title"
                currentVal={currentMetadata.title}
                suggestedVal={suggestion.title}
                checked={selectedFields.title}
                onToggle={() => toggleField('title')}
              />
            )}

            {/* 2. Authors */}
            {(suggestion.allAuthors?.length || suggestion.author) && (
              <FieldDiffRow
                icon={<User className="w-4 h-4 text-purple-400" />}
                label="Author(s)"
                currentVal={currentAuthorDisplay}
                suggestedVal={suggestedAuthorDisplay}
                checked={selectedFields.authors}
                onToggle={() => toggleField('authors')}
              />
            )}

            {/* 3. Series */}
            {suggestion.series && (
              <FieldDiffRow
                icon={<Bookmark className="w-4 h-4 text-amber-400" />}
                label="Series Name"
                currentVal={currentMetadata.series || '(Not specified)'}
                suggestedVal={suggestion.series}
                checked={selectedFields.series}
                onToggle={() => toggleField('series')}
              />
            )}

            {/* 4. Series Volume / Index */}
            {suggestion.seriesIndex && (
              <FieldDiffRow
                icon={<Bookmark className="w-4 h-4 text-amber-400" />}
                label="Series Volume #"
                currentVal={currentMetadata.seriesIndex || '(Not specified)'}
                suggestedVal={suggestion.seriesIndex}
                checked={selectedFields.seriesIndex}
                onToggle={() => toggleField('seriesIndex')}
              />
            )}

            {/* 5. Publisher */}
            {suggestion.publisher && (
              <FieldDiffRow
                icon={<Building className="w-4 h-4 text-emerald-400" />}
                label="Publisher"
                currentVal={currentMetadata.publisher || '(Not specified)'}
                suggestedVal={suggestion.publisher}
                checked={selectedFields.publisher}
                onToggle={() => toggleField('publisher')}
              />
            )}

            {/* 6. Publication Date / Year */}
            {suggestion.publishedDate && (
              <FieldDiffRow
                icon={<Calendar className="w-4 h-4 text-cyan-400" />}
                label="Publication Date"
                currentVal={currentMetadata.publishedDate || '(Not specified)'}
                suggestedVal={suggestion.publishedDate}
                checked={selectedFields.publishedDate}
                onToggle={() => toggleField('publishedDate')}
              />
            )}

            {/* 7. Genres / Categories */}
            {suggestion.genres && suggestion.genres.length > 0 && (
              <FieldDiffRow
                icon={<Tag className="w-4 h-4 text-rose-400" />}
                label="Genres / Categories"
                currentVal={currentMetadata.genres?.join(', ') || '(Not specified)'}
                suggestedVal={suggestion.genres.join(', ')}
                checked={selectedFields.genres}
                onToggle={() => toggleField('genres')}
              />
            )}

            {/* 8. Description */}
            {suggestion.description && (
              <div
                onClick={() => toggleField('description')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedFields.description
                    ? 'bg-[#181a24] border-blue-500/40 ring-1 ring-blue-500/20'
                    : 'bg-[#141418] border-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-zinc-300">Book Synopsis / Description</span>
                    {currentMetadata.description !== suggestion.description && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                        Update
                      </span>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedFields.description}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[#1e1e24] border-white/20 cursor-pointer"
                  />
                </div>
                <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Current</span>
                    <p className="text-zinc-400 text-xs line-clamp-3 leading-relaxed">
                      {currentMetadata.description || '(No description provided)'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-400">Suggested (Verified)</span>
                    <p className="text-zinc-200 text-xs line-clamp-3 leading-relaxed font-medium">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 9. Suggested Official Cover Art if found */}
            {suggestion.suggestedCoverUrl && (
              <div
                onClick={() => setApplyCoverArt(!applyCoverArt)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  applyCoverArt
                    ? 'bg-[#181a24] border-blue-500/40 ring-1 ring-blue-500/20'
                    : 'bg-[#141418] border-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-zinc-300">Official Web Cover Art</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                      Found Online
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={applyCoverArt}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[#1e1e24] border-white/20 cursor-pointer"
                  />
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <img
                    src={suggestion.suggestedCoverUrl}
                    alt="Suggested cover"
                    className="w-12 h-16 object-cover rounded shadow-md border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-xs text-zinc-300 space-y-0.5">
                    <p className="font-medium text-white">Apply Verified High-Resolution Edition Cover</p>
                    <p className="text-zinc-400 text-[11px]">Replaces existing or missing cover art with the official publisher artwork.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Extracted file text snippet preview */}
          {extractedSampleSnippet && (
            <div className="p-3.5 rounded-xl bg-[#101014] border border-white/5 space-y-1.5">
              <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Text Extracted from Book Body ({rawFilename})</span>
              </div>
              <p className="text-xs text-zinc-500 font-mono line-clamp-2 leading-relaxed italic">
                "{extractedSampleSnippet.slice(0, 240)}..."
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#16161c] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={countSelected === 0}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply {countSelected} Selected Change{countSelected !== 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper row component for individual field differences
const FieldDiffRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  currentVal: string;
  suggestedVal: string;
  checked: boolean;
  onToggle: () => void;
}> = ({ icon, label, currentVal, suggestedVal, checked, onToggle }) => {
  const isDifferent = currentVal !== suggestedVal;

  return (
    <div
      onClick={onToggle}
      className={`p-3 rounded-xl border transition-all cursor-pointer ${
        checked
          ? 'bg-[#181a24] border-blue-500/40 ring-1 ring-blue-500/20'
          : 'bg-[#141418] border-white/5 opacity-70 hover:opacity-100'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="text-xs font-semibold text-zinc-300">{label}</span>
          {isDifferent && (
            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
              Update
            </span>
          )}
        </div>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {}}
          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[#1e1e24] border-white/20 cursor-pointer shrink-0"
        />
      </div>

      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5">
          <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0">Current:</span>
          <span className="truncate font-mono text-[11px]">{currentVal}</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-200 bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20 font-medium">
          <span className="text-[10px] uppercase font-bold text-blue-400 shrink-0">Proposed:</span>
          <span className="truncate font-mono text-[11px] text-zinc-100">{suggestedVal}</span>
        </div>
      </div>
    </div>
  );
};
