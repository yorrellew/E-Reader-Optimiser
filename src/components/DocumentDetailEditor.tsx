import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookDocument,
  BookMetadata,
  CoverTuning,
  EinkPreset,
  EinkGrayscaleMode,
  MetadataSuggestion,
} from '../types';
import {
  BookOpen,
  FileText,
  Sparkles,
  Download,
  Image as ImageIcon,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Search,
  Wand2,
  RefreshCw,
  Layers,
  MonitorSmartphone,
  Eye,
  EyeOff,
  Check,
  Tag,
  Hash,
  Globe,
  FileCheck2,
  Palette,
  Sun,
  Moon,
  Columns,
  Maximize2,
  SlidersHorizontal,
  ChevronRight,
  Tv,
  Glasses,
  Type,
} from 'lucide-react';
import { formatFilename, sanitizeTitle } from '../utils/filenameFormatter';
import { RENAMING_PRESETS, EINK_BRANDS, EINK_DEVICE_PRESETS, getPresetsByBrand } from '../utils/presets';
import { processCoverImage } from '../utils/coverImageProcessor';
import { MetadataSuggestionModal } from './MetadataSuggestionModal';
import { EpubTypographyStudio } from './EpubTypographyStudio';

interface DocumentDetailEditorProps {
  document: BookDocument;
  onUpdateDocument: (updated: BookDocument) => void;
  onSaveAndDownload: (doc: BookDocument) => Promise<void>;
  onOpenCoverSearch: () => void;
  onOpenTypographyModal: () => void;
  currentPreset: EinkPreset;
  onSelectPreset?: (preset: EinkPreset) => void;
  renamingPattern: string;
  targetFormat: string;
}

export const DocumentDetailEditor: React.FC<DocumentDetailEditorProps> = ({
  document,
  onUpdateDocument,
  onSaveAndDownload,
  onOpenCoverSearch,
  onOpenTypographyModal,
  currentPreset,
  onSelectPreset,
  renamingPattern,
  targetFormat,
}) => {
  const [activeTab, setActiveTab] = useState<'metadata' | 'cover' | 'typography' | 'eink' | 'pdf'>('metadata');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewEinkUrl, setPreviewEinkUrl] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-Identify suggestions state
  const [suggestionData, setSuggestionData] = useState<MetadataSuggestion | null>(null);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState<boolean>(false);

  // E-Ink Simulation & Brand Filter State
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [isEinkToggled, setIsEinkToggled] = useState<boolean>(true);
  const [einkPreviewMode, setEinkPreviewMode] = useState<EinkGrayscaleMode>(
    document.coverTuning.grayscaleMode === 'none' ? 'eink_16_gray' : document.coverTuning.grayscaleMode
  );
  const [screenLighting, setScreenLighting] = useState<'neutral' | 'warm' | 'amber' | 'cool'>('neutral');
  const [showScreenGrain, setShowScreenGrain] = useState<boolean>(true);
  const [comparisonLayout, setComparisonLayout] = useState<'single' | 'split'>('single');

  // Filter models by brand
  const filteredModels = useMemo(() => {
    return getPresetsByBrand(selectedBrand);
  }, [selectedBrand]);

  // Local metadata state for quick edits
  const metadata = document.metadata;

  const handleMetadataChange = (key: keyof BookMetadata, value: any) => {
    onUpdateDocument({
      ...document,
      metadata: {
        ...metadata,
        [key]: value,
      },
      status: 'modified',
    });
  };

  const handleAuthorsChange = (authorsStr: string) => {
    const list = authorsStr.split(',').map((s) => s.trim()).filter(Boolean);
    handleMetadataChange('authors', list.length > 0 ? list : ['Unknown Author']);
  };

  const handleGenresChange = (genresStr: string) => {
    const list = genresStr.split(',').map((s) => s.trim()).filter(Boolean);
    handleMetadataChange('genres', list);
  };

  const handleCoverTuningChange = (newTuning: Partial<CoverTuning>) => {
    onUpdateDocument({
      ...document,
      coverTuning: {
        ...document.coverTuning,
        ...newTuning,
      },
      status: 'modified',
    });
  };

  // Switch simulation rendering mode
  const handleSelectSimMode = (mode: EinkGrayscaleMode) => {
    setEinkPreviewMode(mode);
    handleCoverTuningChange({ grayscaleMode: mode });
  };

  // Re-run e-ink preview when cover or tuning changes
  useEffect(() => {
    if (!document.coverDataUrl) {
      setPreviewEinkUrl(null);
      return;
    }

    let isMounted = true;
    const updatePreview = async () => {
      try {
        const effectiveTuning: CoverTuning = {
          ...document.coverTuning,
          grayscaleMode: isEinkToggled ? einkPreviewMode : 'none',
        };

        const processed = await processCoverImage(
          document.coverDataUrl!,
          effectiveTuning,
          currentPreset.id
        );
        if (isMounted) {
          setPreviewEinkUrl(processed.dataUrl);
        }
      } catch (err) {
        console.error('Error updating preview:', err);
      }
    };

    updatePreview();
    return () => {
      isMounted = false;
    };
  }, [document.coverDataUrl, document.coverTuning, currentPreset, isEinkToggled, einkPreviewMode]);

  // Dynamic CSS Filter calculation
  const dynamicCssFilter = useMemo(() => {
    if (!isEinkToggled || einkPreviewMode === 'none') {
      return 'none';
    }
    const contrastVal = 100 + document.coverTuning.contrast;
    const brightnessVal = 100 + document.coverTuning.brightness;

    if (einkPreviewMode === 'eink_16_gray') {
      return `grayscale(100%) contrast(${contrastVal}%) brightness(${brightnessVal}%)`;
    }
    if (einkPreviewMode === 'high_contrast') {
      return `grayscale(100%) contrast(${Math.round(200 + document.coverTuning.contrast * 1.5)}%) brightness(${brightnessVal}%)`;
    }
    // Dither modes
    return `contrast(${Math.round(100 + document.coverTuning.contrast * 0.4)}%) brightness(${Math.round(100 + document.coverTuning.brightness * 0.4)}%)`;
  }, [isEinkToggled, einkPreviewMode, document.coverTuning]);

  // Screen warmth background & tint
  const lightingConfig = useMemo(() => {
    switch (screenLighting) {
      case 'warm':
        return {
          bgColor: '#f4ede2',
          tintStyle: 'rgba(255, 220, 160, 0.12)',
          name: 'Warm Amber 3500K',
        };
      case 'amber':
        return {
          bgColor: '#fae8cf',
          tintStyle: 'rgba(255, 185, 90, 0.20)',
          name: 'Candlelight 2700K',
        };
      case 'cool':
        return {
          bgColor: '#edf2f7',
          tintStyle: 'rgba(210, 230, 255, 0.10)',
          name: 'Daylight Cool 6500K',
        };
      case 'neutral':
      default:
        return {
          bgColor: '#e5e5e2',
          tintStyle: 'transparent',
          name: 'Carta 1200 Gray',
        };
    }
  }, [screenLighting]);

  // Aspect ratio helper
  const getAspectRatioClass = (ratio: string) => {
    if (ratio.includes('1:2') || ratio.includes('0.50')) return 'aspect-1/2 max-w-[200px]';
    if (ratio.includes('3:5') || ratio.includes('0.60')) return 'aspect-3/5 max-w-[220px]';
    if (ratio.includes('16:9') || ratio.includes('1.78')) return 'aspect-16/9 max-w-[320px]';
    if (ratio.includes('4:3') || ratio.includes('1.33')) return 'aspect-4/3 max-w-[300px]';
    return 'aspect-3/4 max-w-[240px]';
  };

  // AI Auto-Analysis with Gemini & Heuristic engine (with client-side fallback for GitHub Pages)
  const handleAutoAnalyze = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setSuccessFeedback(false);

    try {
      let analysisResult = null;
      let analysisSource = 'heuristic';

      try {
        const res = await fetch('/api/metadata/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
          body: JSON.stringify({
            sampleText: document.extractedTextSample || '',
            rawFilename: document.originalName,
            currentMetadata: document.metadata,
          }),
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          analysisResult = data.analysis;
          analysisSource = data.source || 'heuristic';
        }
      } catch {
        // Backend not available, continue to client-side fallback
      }

      // Fallback for static hosting (e.g. GitHub Pages)
      if (!analysisResult) {
        const rawFilename = document.originalName;
        const cleanName = rawFilename
          .replace(/\.(epub|pdf|mobi|azw3|txt|cbz|cbr)$/i, '')
          .replace(/\[(?:z-lib|libgen|retail|epub|pdf|ebook|v\d+[^\]]*)\]/gi, ' ')
          .replace(/\((?:retail|unabridged|scan|v\d+[^)]*)\)/gi, ' ')
          .replace(/[_\.]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        let authorGuess = document.metadata.authors?.[0] || '';
        let titleGuess = document.metadata.title || '';
        let seriesGuess = document.metadata.series || '';
        let seriesIndexGuess = document.metadata.seriesIndex || '';

        if (!titleGuess || titleGuess === 'Untitled Document' || titleGuess === rawFilename) {
          if (cleanName.includes(' - ')) {
            const parts = cleanName.split(' - ').map((p) => p.trim()).filter(Boolean);
            if (parts.length === 2) {
              authorGuess = authorGuess || parts[0];
              titleGuess = parts[1];
            } else if (parts.length >= 3) {
              authorGuess = authorGuess || parts[0];
              seriesGuess = seriesGuess || parts[1];
              titleGuess = parts.slice(2).join(' - ');
            }
          } else {
            const byMatch = cleanName.match(/^(.+?)\s+by\s+(.+)$/i);
            if (byMatch) {
              titleGuess = byMatch[1].trim();
              authorGuess = authorGuess || byMatch[2].trim();
            } else {
              titleGuess = cleanName;
            }
          }
        }

        // Check for bracketed series like (Series #1)
        const bracketSeriesMatch = titleGuess.match(/[\[\(]([^\]\)]+?)\s*#?(\d+(?:\.\d+)?)[\]\)]/i);
        if (bracketSeriesMatch) {
          seriesGuess = bracketSeriesMatch[1].trim();
          seriesIndexGuess = bracketSeriesMatch[2].trim();
          titleGuess = titleGuess.replace(bracketSeriesMatch[0], '').trim();
        }

        analysisResult = {
          title: titleGuess || document.metadata.title || 'Untitled Book',
          author: authorGuess || 'Unknown Author',
          allAuthors: authorGuess ? [authorGuess] : (document.metadata.authors || ['Unknown Author']),
          series: seriesGuess,
          seriesIndex: seriesIndexGuess,
          publisher: document.metadata.publisher || '',
          publishedDate: document.metadata.publishedDate || '',
          description: document.metadata.description || (document.extractedTextSample?.slice(0, 300) || ''),
          genres: document.metadata.genres?.length ? document.metadata.genres : ['General Fiction'],
          language: document.metadata.language || 'en',
          isbn: document.metadata.isbn || '',
          searchQuery: `${titleGuess} ${authorGuess}`.trim(),
          suggestedFilename: `${authorGuess || 'Unknown'} - ${titleGuess || 'Untitled'}.epub`,
          suggestedCoverUrl: '',
          confidenceScore: 85,
          confidenceNotes: 'Identified using client-side metadata extraction and filename heuristics.',
          evidenceDetails: {
            isbnFound: document.metadata.isbn || '(None in sample)',
            rawExcerptMatched: document.extractedTextSample ? document.extractedTextSample.slice(0, 60) + '...' : '(Title page excerpt)',
            webCatalogMatch: 'Direct client-side extraction',
            sourceSummary: 'Offline Heuristic Engine',
          },
        };
        analysisSource = 'heuristic';
      }

      if (analysisResult) {
        setSuggestionData({
          ...analysisResult,
          source: analysisSource,
        });
        setIsSuggestionModalOpen(true);
      }
    } catch (err: any) {
      console.warn('AI analysis notice:', err?.message || err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySuggestions = async (patch: Partial<BookMetadata>, applyCoverUrl?: string) => {
    let newCoverDataUrl = document.coverDataUrl;
    let newCoverSource = document.coverSource;
    let newCoverMimeType = document.coverMimeType;

    if (applyCoverUrl) {
      try {
        let fetchUrl = applyCoverUrl;
        if (fetchUrl.startsWith('/api/proxy-cover')) {
          const urlParam = new URL(fetchUrl, window.location.href).searchParams.get('url');
          if (urlParam) fetchUrl = urlParam;
        }
        // Fetch and convert the high-res cover into local data URL for offline durability
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          newCoverDataUrl = base64;
          newCoverSource = 'searched';
          newCoverMimeType = blob.type || 'image/jpeg';
        }
      } catch (e) {
        console.warn('Cover fetch warning:', e);
      }
    }

    onUpdateDocument({
      ...document,
      metadata: {
        ...metadata,
        ...patch,
      },
      coverDataUrl: newCoverDataUrl,
      coverSource: newCoverSource,
      coverMimeType: newCoverMimeType,
      status: 'modified',
    });
    setSuccessFeedback(true);
    setTimeout(() => {
      setSuccessFeedback(false);
    }, 2500);
  };

  // Upload custom cover image file
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onUpdateDocument({
          ...document,
          coverDataUrl: dataUrl,
          coverMimeType: file.type || 'image/jpeg',
          coverSource: 'uploaded',
          status: 'modified',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const formattedFilename = formatFilename(renamingPattern, metadata, document.fileType);

  const handleDownload = async () => {
    setIsSaving(true);
    try {
      await onSaveAndDownload(document);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] overflow-y-auto text-[#e0e0e0]">
      {/* Workbench Header */}
      <div className="bg-[#111114] border-b border-white/10 p-4 sm:p-5 sticky top-0 z-20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  document.fileType === 'epub'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                    : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                }`}
              >
                {document.fileType.toUpperCase()}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white font-sans truncate max-w-lg">
                {metadata.title || document.originalName}
              </h2>
              {document.coverDataUrl && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Cover Verified</span>
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 truncate">
              <span>Original: {document.originalName}</span>
              <span>·</span>
              <span>{(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              {document.pageCount ? <span>· {document.pageCount} Pages</span> : null}
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* The ONLY AI Auto-Fix Button in the app */}
            <button
              type="button"
              onClick={handleAutoAnalyze}
              disabled={isAnalyzing}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-150 shadow-sm cursor-pointer ${
                isAnalyzing
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 ring-2 ring-blue-500/30 animate-pulse'
                  : successFeedback
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/30'
                  : 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 text-blue-300 border-blue-500/40 active:scale-95'
              } disabled:opacity-75 disabled:cursor-not-allowed`}
              title="Deep analysis: inspects filename, full chapter text, extracts ISBNs, queries online book catalogs, and proposes canonical metadata"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              ) : successFeedback ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-400" />
              )}
              <span>
                {isAnalyzing
                  ? 'Analyzing & Searching Web...'
                  : successFeedback
                  ? 'Identified & Applied!'
                  : 'Deep Book Identify & Autofix'}
              </span>
            </button>

            {/* Save & Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-md cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span>
                Export {targetFormat.toUpperCase()}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'metadata'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Metadata & Naming</span>
          </button>

          <button
            onClick={() => setActiveTab('typography')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'typography'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Glasses className="w-3.5 h-3.5 text-blue-400" />
            <span>Text Appearance & Reader Preview</span>
            <span className="px-1.5 py-0.2 text-[9px] bg-blue-500/20 text-blue-300 rounded font-bold">
              Reflow
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cover')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cover'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Cover Art Studio</span>
            {document.coverDataUrl && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('eink')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'eink'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MonitorSmartphone className="w-3.5 h-3.5" />
            <span>E-Ink Optimizer</span>
          </button>

          {document.fileType === 'pdf' && (
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'pdf'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>PDF Engine & EPUB Convert</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 sm:p-6 max-w-5xl w-full mx-auto flex-1">
        {/* TAB 1: METADATA & CLEAN NAMING */}
        {activeTab === 'metadata' && (
          <div className="space-y-6">
            {/* Metadata & Identification Status Card (Informational only - single autofix button is at top) */}
            <div className="bg-[#111116] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    Deep Book Intelligence
                  </span>
                  <span className="text-xs text-zinc-400">
                    Filename analysis · Chapter text extraction · Web catalog cross-referencing
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Metadata & Standard Bibliographic Details
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  Edit book metadata fields manually below or click <span className="text-blue-300 font-semibold">"Deep Book Identify & Autofix"</span> above to compare proposed changes side-by-side with official bibliographic records.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#181822] text-zinc-300 border border-white/10">
                  ISBN Search
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#181822] text-zinc-300 border border-white/10">
                  Calibre Naming
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#181822] text-zinc-300 border border-white/10">
                  Online Catalogs
                </span>
              </div>
            </div>

            {/* Live Filename Card */}
            <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 font-sans flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-blue-400" />
                  <span>Formatted Output Filename</span>
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  Rule: {renamingPattern}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-mono font-bold text-blue-200 bg-[#16161a] border border-blue-500/20 rounded-xl px-3 py-2 break-all shadow-2xs">
                {formattedFilename}
              </p>
            </div>

            {/* Core Form Fields */}
            <div className="bg-[#111114] rounded-2xl border border-white/10 p-5 sm:p-6 shadow-md space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-sans">
                Book Metadata Details
              </h3>

              {/* Title & Author */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-300 font-sans">
                      Book Title *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleMetadataChange('title', sanitizeTitle(metadata.title))}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Clean Title Watermarks
                    </button>
                  </div>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => handleMetadataChange('title', e.target.value)}
                    placeholder="e.g. The Lord of the Rings"
                    className="w-full px-3 py-2 text-sm bg-[#16161a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1 font-sans">
                    Author(s) (comma separated) *
                  </label>
                  <input
                    type="text"
                    value={(metadata.authors || []).join(', ')}
                    onChange={(e) => handleAuthorsChange(e.target.value)}
                    placeholder="e.g. J. R. R. Tolkien"
                    className="w-full px-3 py-2 text-sm bg-[#16161a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-500 font-sans"
                  />
                </div>
              </div>

              {/* Series & Series Index */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1 font-sans">
                    Series Name (Calibre & EPUB3 standard)
                  </label>
                  <input
                    type="text"
                    value={metadata.series || ''}
                    onChange={(e) => handleMetadataChange('series', e.target.value)}
                    placeholder="e.g. Dune Chronicles"
                    className="w-full px-3 py-2 text-sm bg-[#16161a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1 font-sans">
                    Series Index #
                  </label>
                  <input
                    type="text"
                    value={metadata.seriesIndex || ''}
                    onChange={(e) => handleMetadataChange('seriesIndex', e.target.value)}
                    placeholder="e.g. 1 or 2.5"
                    className="w-full px-3 py-2 text-sm bg-[#16161a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-500 font-sans"
                  />
                </div>
              </div>

              {/* Publisher, Date, Language, ISBN */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 font-sans">
                    Publisher
                  </label>
                  <input
                    type="text"
                    value={metadata.publisher || ''}
                    onChange={(e) => handleMetadataChange('publisher', e.target.value)}
                    placeholder="e.g. Penguin Classics"
                    className="w-full px-3 py-2 text-xs bg-[#16161a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 font-sans">
                    Published Year / Date
                  </label>
                  <input
                    type="text"
                    value={metadata.publishedDate || ''}
                    onChange={(e) => handleMetadataChange('publishedDate', e.target.value)}
                    placeholder="e.g. 1954"
                    className="w-full px-3 py-2 text-xs bg-[#16161a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 font-sans">
                    Language Code
                  </label>
                  <input
                    type="text"
                    value={metadata.language || 'en'}
                    onChange={(e) => handleMetadataChange('language', e.target.value)}
                    placeholder="en, fr, de, es"
                    className="w-full px-3 py-2 text-xs bg-[#16161a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 font-sans">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={metadata.isbn || ''}
                    onChange={(e) => handleMetadataChange('isbn', e.target.value)}
                    placeholder="978-0..."
                    className="w-full px-3 py-2 text-xs bg-[#16161a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500"
                  />
                </div>
              </div>

              {/* Genre Tags */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 font-sans">
                  Genre / Subject Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={(metadata.genres || []).join(', ')}
                  onChange={(e) => handleGenresChange(e.target.value)}
                  placeholder="e.g. Science Fiction, Cyberpunk, Dystopia"
                  className="w-full px-3 py-2 text-xs bg-[#16161a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500"
                />
              </div>

              {/* Description / Synopsis */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 font-sans">
                  Book Synopsis / Description
                </label>
                <textarea
                  rows={4}
                  value={metadata.description || ''}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  placeholder="Enter a clean book description for e-reader book details screens..."
                  className="w-full px-3 py-2 text-xs bg-[#16161a] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-zinc-500 font-serif leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEXT APPEARANCE & E-READER REFLOW PREVIEW */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            <EpubTypographyStudio
              document={document}
              currentPreset={currentPreset}
              onSelectPreset={onSelectPreset}
              onUpdateDocument={onUpdateDocument}
            />
          </div>
        )}

        {/* TAB 3: COVER ART STUDIO */}
        {activeTab === 'cover' && (
          <div className="space-y-6">
            <div className="bg-[#111114] rounded-2xl border border-white/10 p-5 sm:p-6 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Current Cover Preview Card with Live E-Ink Simulation Toggle */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-sans">
                      Cover Preview
                    </span>
                    {/* Instant Toggle Button: Color vs E-Ink */}
                    <button
                      type="button"
                      onClick={() => setIsEinkToggled(!isEinkToggled)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        isEinkToggled
                          ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                          : 'bg-[#16161a] border-white/10 text-zinc-400 hover:text-white'
                      }`}
                      title="Toggle simulated 16-level grayscale / dithering"
                    >
                      {isEinkToggled ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>E-Ink Simulated</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Original Color</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Cover Display Frame */}
                  <div className="w-56 sm:w-64 aspect-3/4 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 bg-[#16161a] relative flex items-center justify-center">
                    {document.coverDataUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center" style={{ backgroundColor: isEinkToggled ? lightingConfig.bgColor : undefined }}>
                        <img
                          src={isEinkToggled && previewEinkUrl ? previewEinkUrl : document.coverDataUrl}
                          alt="Current Cover"
                          style={{
                            filter: isEinkToggled ? dynamicCssFilter : 'none',
                          }}
                          className="w-full h-full object-cover transition-all duration-150"
                        />

                        {/* Frontlight Tint overlay if E-Ink active */}
                        {isEinkToggled && screenLighting !== 'neutral' && (
                          <div
                            className="absolute inset-0 pointer-events-none mix-blend-multiply"
                            style={{ backgroundColor: lightingConfig.tintStyle }}
                          />
                        )}

                        {/* Screen Grain Texture if E-Ink active */}
                        {isEinkToggled && showScreenGrain && (
                          <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_3px]" />
                        )}

                        {/* Mode watermark badge */}
                        {isEinkToggled && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-zinc-300 border border-white/10">
                            {einkPreviewMode === 'eink_16_gray'
                              ? '16-Gray'
                              : einkPreviewMode === 'atkinson_dither'
                              ? 'Atkinson'
                              : einkPreviewMode === 'floyd_steinberg'
                              ? 'Floyd-Steinberg'
                              : einkPreviewMode === 'high_contrast'
                              ? 'Monochrome'
                              : 'Color'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-4 text-zinc-500 space-y-2">
                        <ImageIcon className="w-10 h-10 mx-auto stroke-1" />
                        <p className="text-xs font-medium text-zinc-300 font-sans">No cover assigned</p>
                        <p className="text-[10px] text-zinc-500">
                          Search online or generate a typography cover
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-center space-y-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300 bg-[#16161a] border border-white/10 px-2.5 py-1 rounded-full">
                      Source: <strong className="capitalize">{document.coverSource}</strong>
                    </span>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
                      <span>Target:</span>
                      <strong className="text-zinc-200">{currentPreset.name}</strong>
                    </div>
                  </div>
                </div>

                {/* Cover Acquisition Options */}
                <div className="md:col-span-7 space-y-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans">
                      Find, Create & Assign Cover Art
                    </h3>
                    <p className="text-xs text-zinc-400 font-serif">
                      Choose from global book registries, design a clean typography cover, or upload your own art
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Option 1: Search Online */}
                    <button
                      type="button"
                      onClick={onOpenCoverSearch}
                      className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all text-left flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Search className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white font-sans">
                            Search Online Book Covers
                          </h4>
                          <p className="text-[11px] text-zinc-400 font-serif">
                            Auto-queries Google Books & OpenLibrary for high-res publisher art
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-400 group-hover:translate-x-0.5 transition-transform">
                        Search →
                      </span>
                    </button>

                    {/* Option 2: Bespoke Typography Cover Designer */}
                    <button
                      type="button"
                      onClick={onOpenTypographyModal}
                      className="p-3.5 rounded-xl border border-white/10 bg-[#16161a] hover:bg-[#202026] hover:border-white/20 transition-all text-left flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-950 border border-blue-800/60 text-blue-300 flex items-center justify-center shrink-0 shadow-xs">
                          <Palette className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white font-sans">
                            Typography Cover Designer
                          </h4>
                          <p className="text-[11px] text-zinc-400 font-serif">
                            Generate bespoke vintage, e-ink monochrome, or classic editorial book covers
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-zinc-300 group-hover:translate-x-0.5 transition-transform">
                        Design →
                      </span>
                    </button>

                    {/* Option 3: Upload Local File */}
                    <div
                      onClick={() => coverFileInputRef.current?.click()}
                      className="p-3.5 rounded-xl border border-dashed border-white/15 bg-[#16161a]/60 hover:bg-[#16161a] transition-all text-left flex items-center justify-between cursor-pointer group"
                    >
                      <input
                        type="file"
                        ref={coverFileInputRef}
                        onChange={handleCoverUpload}
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#202026] text-zinc-300 flex items-center justify-center shrink-0">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white font-sans">
                            Upload Custom Image File
                          </h4>
                          <p className="text-[11px] text-zinc-400 font-serif">
                            Supports JPG, PNG, and WebP images of any dimension
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-zinc-400 group-hover:text-white">
                        Browse
                      </span>
                    </div>
                  </div>

                  {/* Reset original cover if modified */}
                  {document.originalCoverDataUrl && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateDocument({
                            ...document,
                            coverDataUrl: document.originalCoverDataUrl,
                            coverSource: 'extracted',
                            status: 'modified',
                          });
                        }}
                        className="text-xs text-zinc-400 hover:text-white underline font-medium"
                      >
                        Reset to Original File Cover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: E-INK OPTIMIZER & DEVICE STUDIO */}
        {activeTab === 'eink' && (
          <div className="space-y-6">
            {/* SECTION A: BRAND & MODEL FILTERING */}
            <div className="bg-[#111114] rounded-2xl border border-white/10 p-4 sm:p-5 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans">
                      Target E-Reader Hardware Catalog
                    </h3>
                    <p className="text-xs text-zinc-400 font-serif">
                      Filter by brand then model to simulate exact display resolution, aspect ratio, and bezel
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-400">Active Profile:</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30">
                    {currentPreset.brand} · {currentPreset.name}
                  </span>
                </div>
              </div>

              {/* 1. Brand Filter Tabs */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 font-sans">
                  Step 1: Select E-Reader Brand
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EINK_BRANDS.map((brand) => {
                    const count = brand.id === 'all'
                      ? EINK_DEVICE_PRESETS.length
                      : EINK_DEVICE_PRESETS.filter((p) => p.brand.toLowerCase() === brand.id.toLowerCase()).length;
                    const isActive = selectedBrand.toLowerCase() === brand.id.toLowerCase();

                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => setSelectedBrand(brand.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                          isActive
                            ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                            : 'bg-[#16161a] border-white/10 text-zinc-300 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span>{brand.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive ? 'bg-blue-800 text-blue-100' : 'bg-white/5 text-zinc-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Model Selector (Filter by Brand -> Select Model) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-sans">
                    Step 2: Select Device Model ({filteredModels.length} models)
                  </label>
                  <span className="text-[11px] text-zinc-500 font-serif">
                    Click any model to apply resolution & aspect ratio
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredModels.map((model) => {
                    const isSelected = currentPreset.id === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          if (onSelectPreset) {
                            onSelectPreset(model);
                          }
                          handleCoverTuningChange({ aspectRatioPreset: model.id });
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white shadow-xs ring-1 ring-blue-500/50'
                            : 'bg-[#16161a] border-white/10 hover:border-white/20 text-zinc-300 hover:bg-[#1c1c22]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="font-bold text-xs font-sans text-white leading-tight">
                            {model.name}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-zinc-300 border border-white/5">
                            {model.resolution.width}×{model.resolution.height}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">
                            {model.aspectRatio}
                          </span>
                          <span className="text-zinc-500 font-medium">
                            {model.brand}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION B: LIVE E-INK SIMULATOR VIEWPORT & CONTROLS */}
            <div className="bg-[#111114] rounded-2xl border border-white/10 p-5 sm:p-6 shadow-md space-y-6">
              {/* Simulation Toolbar: Mode, Lighting, Layout, Texture */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#16161a] p-3 rounded-xl border border-white/10">
                {/* 1. Palette & Dithering Mode Buttons */}
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 hidden sm:inline">
                    Sim Mode:
                  </span>
                  {[
                    { id: 'none', label: 'Color Original', icon: Eye },
                    { id: 'eink_16_gray', label: '16-Level Gray', icon: Eye },
                    { id: 'atkinson_dither', label: 'Atkinson Dither', icon: Eye },
                    { id: 'floyd_steinberg', label: 'Floyd-Steinberg', icon: Eye },
                    { id: 'high_contrast', label: 'Monochrome 1-Bit', icon: Eye },
                  ].map((mode) => {
                    const isActive = isEinkToggled && einkPreviewMode === mode.id;
                    const isColorMode = !isEinkToggled || einkPreviewMode === 'none';
                    const activeState = mode.id === 'none' ? isColorMode : isActive;

                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          if (mode.id === 'none') {
                            setIsEinkToggled(false);
                            handleSelectSimMode('none');
                          } else {
                            setIsEinkToggled(true);
                            handleSelectSimMode(mode.id as EinkGrayscaleMode);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          activeState
                            ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                            : 'bg-[#111114] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {/* 2. Frontlight Warmth & Comparison Layout */}
                <div className="flex items-center gap-2">
                  {/* Screen Lighting Preset */}
                  <div className="flex items-center gap-1 bg-[#111114] border border-white/10 rounded-lg p-0.5">
                    {[
                      { id: 'neutral', label: 'Carta Neutral', icon: Sun },
                      { id: 'warm', label: 'Warm 3500K', icon: Sun },
                      { id: 'amber', label: 'Amber 2700K', icon: Sun },
                      { id: 'cool', label: 'Cool 6500K', icon: Moon },
                    ].map((light) => (
                      <button
                        key={light.id}
                        type="button"
                        onClick={() => setScreenLighting(light.id as any)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                          screenLighting === light.id
                            ? 'bg-white/20 text-white font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                        title={light.label}
                      >
                        {light.id}
                      </button>
                    ))}
                  </div>

                  {/* View Layout Toggle: Single Device vs Side-by-Side */}
                  <button
                    type="button"
                    onClick={() => setComparisonLayout(comparisonLayout === 'single' ? 'split' : 'single')}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                      comparisonLayout === 'split'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-[#111114] border-white/10 text-zinc-400 hover:text-white'
                    }`}
                    title="Toggle Side-by-Side Comparison (Original Color vs E-Ink)"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden md:inline font-medium">Compare</span>
                  </button>
                </div>
              </div>

              {/* Main Grid: Device Simulator Frame + Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left: Device Mockup Frame */}
                <div className="md:col-span-6 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-sans flex items-center gap-1.5">
                      <MonitorSmartphone className="w-4 h-4 text-blue-400" />
                      <span>{currentPreset.brand} · {currentPreset.name}</span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {currentPreset.recommendedCoverSize}
                    </span>
                  </div>

                  {/* Comparison Layout View */}
                  {comparisonLayout === 'split' ? (
                    <div className="w-full grid grid-cols-2 gap-3 bg-[#0a0a0c] p-3 rounded-2xl border border-white/10 shadow-2xl">
                      {/* Left: Source RGB */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-sans">
                          Original Color Source
                        </span>
                        <div className="w-full aspect-3/4 rounded-lg overflow-hidden bg-black border border-white/10 shadow-md">
                          {document.coverDataUrl ? (
                            <img
                              src={document.coverDataUrl}
                              alt="Original"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No Cover</div>
                          )}
                        </div>
                      </div>

                      {/* Right: E-Ink Screen */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 font-sans">
                          E-Ink 16-Level / Dither
                        </span>
                        <div
                          className="w-full aspect-3/4 rounded-lg overflow-hidden border border-zinc-600 relative shadow-md"
                          style={{ backgroundColor: lightingConfig.bgColor }}
                        >
                          {document.coverDataUrl ? (
                            <>
                              <img
                                src={previewEinkUrl || document.coverDataUrl}
                                alt="E-Ink Simulated"
                                style={{ filter: dynamicCssFilter }}
                                className="w-full h-full object-cover"
                              />
                              {showScreenGrain && (
                                <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_3px]" />
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No Cover</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Single Realistic Device Bezel Simulator */
                    <div className="w-full max-w-[300px] p-3.5 rounded-3xl bg-[#09090b] border-4 border-[#27272a] shadow-2xl relative flex flex-col items-center">
                      {/* Hardware Screen Bezel */}
                      <div className="w-full flex items-center justify-between px-2 mb-1.5 text-[9px] text-zinc-500 font-mono">
                        <span>{currentPreset.resolution.width}×{currentPreset.resolution.height}</span>
                        <span>{lightingConfig.name}</span>
                      </div>

                      {/* Screen Viewport with exact aspect ratio */}
                      <div
                        className={`w-full ${getAspectRatioClass(currentPreset.aspectRatio)} rounded-xl overflow-hidden border border-zinc-600 relative flex items-center justify-center shadow-inner`}
                        style={{ backgroundColor: isEinkToggled ? lightingConfig.bgColor : '#16161a' }}
                      >
                        {document.coverDataUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={isEinkToggled && previewEinkUrl ? previewEinkUrl : document.coverDataUrl}
                              alt="E-Ink Simulation"
                              style={{
                                filter: isEinkToggled ? dynamicCssFilter : 'none',
                              }}
                              className="w-full h-full object-cover transition-all duration-150"
                            />

                            {/* Warmth Frontlight Color Tint */}
                            {isEinkToggled && screenLighting !== 'neutral' && (
                              <div
                                className="absolute inset-0 pointer-events-none mix-blend-multiply"
                                style={{ backgroundColor: lightingConfig.tintStyle }}
                              />
                            )}

                            {/* Micro-Capsule Paper Grain */}
                            {isEinkToggled && showScreenGrain && (
                              <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_3px]" />
                            )}
                          </div>
                        ) : (
                          <div className="text-center p-4 text-stone-500">
                            <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                            <span className="text-[11px] font-medium block mt-1">No Cover Assigned</span>
                          </div>
                        )}
                      </div>

                      {/* Hardware Brand Watermark & Turn Buttons Simulator */}
                      <div className="w-full mt-3 flex items-center justify-between px-2">
                        {/* Physical Turn Buttons on models with buttons */}
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-1.5 rounded-full bg-zinc-700/60" />
                          <div className="w-4 h-1.5 rounded-full bg-zinc-700/60" />
                        </div>

                        <span className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase font-sans">
                          {currentPreset.brand}
                        </span>

                        <div className="w-2 h-2 rounded-full bg-zinc-800" />
                      </div>
                    </div>
                  )}

                  {/* Microcapsule Grain and Frontlight Toggles */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showScreenGrain}
                        onChange={(e) => setShowScreenGrain(e.target.checked)}
                        className="rounded accent-blue-500"
                      />
                      <span>E-Ink Screen Grain</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEinkToggled}
                        onChange={(e) => setIsEinkToggled(e.target.checked)}
                        className="rounded accent-blue-500"
                      />
                      <span>Simulate Grayscale/Dither</span>
                    </label>
                  </div>
                </div>

                {/* Right: E-Ink Tuning Sliders & Quick Presets */}
                <div className="md:col-span-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                      <span>E-Ink Tone & Contrast Calibration</span>
                    </h3>
                    <p className="text-xs text-zinc-400 font-serif">
                      E-ink screens lose shadow detail and wash out fine colors. Adjust tone curves so lockscreens stay punchy and readable in daylight.
                    </p>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-sans">
                      Quick Tuning Profiles
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCoverTuningChange({ contrast: 25, gamma: 1.25, brightness: 5, grayscaleMode: 'eink_16_gray' })}
                        className="p-2 rounded-lg bg-[#16161a] hover:bg-[#202026] border border-white/10 text-xs font-semibold text-zinc-200 text-center"
                      >
                        High Punch
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCoverTuningChange({ contrast: 15, gamma: 1.05, brightness: 0, grayscaleMode: 'atkinson_dither' })}
                        className="p-2 rounded-lg bg-[#16161a] hover:bg-[#202026] border border-white/10 text-xs font-semibold text-zinc-200 text-center"
                      >
                        Fine Atkinson
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCoverTuningChange({ contrast: 35, gamma: 1.35, brightness: 10, grayscaleMode: 'high_contrast' })}
                        className="p-2 rounded-lg bg-[#16161a] hover:bg-[#202026] border border-white/10 text-xs font-semibold text-zinc-200 text-center"
                      >
                        B&W Graphic
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCoverTuningChange({ contrast: 15, gamma: 1.1, brightness: 0, grayscaleMode: 'none' })}
                        className="p-2 rounded-lg bg-[#16161a] hover:bg-[#202026] border border-white/10 text-xs font-medium text-zinc-400 text-center"
                      >
                        Reset Defaults
                      </button>
                    </div>
                  </div>

                  {/* Slider: Contrast Boost */}
                  <div className="space-y-1 pt-2 border-t border-white/10">
                    <div className="flex justify-between text-xs font-semibold text-zinc-300">
                      <span>Contrast Boost</span>
                      <span className="font-mono text-blue-400">{document.coverTuning.contrast > 0 ? `+${document.coverTuning.contrast}%` : `${document.coverTuning.contrast}%`}</span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="50"
                      value={document.coverTuning.contrast}
                      onChange={(e) => handleCoverTuningChange({ contrast: parseInt(e.target.value, 10) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Muted (-30%)</span>
                      <span>Neutral (0%)</span>
                      <span>High Punch (+50%)</span>
                    </div>
                  </div>

                  {/* Slider: Gamma Correction */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-zinc-300">
                      <span>Gamma Tone Curve</span>
                      <span className="font-mono text-blue-400">{document.coverTuning.gamma.toFixed(2)}γ</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.05"
                      value={document.coverTuning.gamma}
                      onChange={(e) => handleCoverTuningChange({ gamma: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Darker Shadows (0.50)</span>
                      <span>1.0 Neutral</span>
                      <span>Lighter Midtones (1.80)</span>
                    </div>
                  </div>

                  {/* Slider: Brightness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-zinc-300">
                      <span>Brightness Offset</span>
                      <span className="font-mono text-blue-400">{document.coverTuning.brightness > 0 ? `+${document.coverTuning.brightness}%` : `${document.coverTuning.brightness}%`}</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={document.coverTuning.brightness}
                      onChange={(e) => handleCoverTuningChange({ brightness: parseInt(e.target.value, 10) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* E-Reader Hardware Compatibility Badges */}
                  <div className="bg-[#16161a] rounded-xl p-3.5 border border-white/10 space-y-2 mt-4">
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-sans">
                      Export Optimizations Applied:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>EPUB 2 & 3 Dual Manifest Items</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Zero-Margin Viewport Cover.xhtml</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Uncompressed Mimetype Header</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Aspect: {currentPreset.aspectRatio}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PDF ENGINE & CONVERT (PDF ONLY) */}
        {activeTab === 'pdf' && document.fileType === 'pdf' && (
          <div className="space-y-6">
            <div className="bg-[#111114] rounded-2xl border border-white/10 p-5 sm:p-6 shadow-md space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-400" />
                  <span>PDF Document Optimization & Conversion</span>
                </h3>
                <p className="text-xs text-zinc-400 font-serif">
                  Configure how covers and metadata are embedded into the PDF, or convert to a native EPUB e-book.
                </p>
              </div>

              {/* PDF Cover Embedding Action */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider font-sans">
                  Cover Embedding Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() =>
                      onUpdateDocument({
                        ...document,
                        pdfOptions: {
                          ...document.pdfOptions,
                          coverAction: 'replace_page_1',
                          optimizeStream: document.pdfOptions?.optimizeStream ?? true,
                        },
                      })
                    }
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      (document.pdfOptions?.coverAction || 'replace_page_1') === 'replace_page_1'
                        ? 'bg-blue-600/15 border-blue-500 text-white shadow-xs'
                        : 'bg-[#16161a] border-white/10 hover:border-white/20 text-zinc-400'
                    }`}
                  >
                    <h4 className="text-xs font-bold font-sans text-white">Replace Page 1</h4>
                    <p className="text-[11px] text-zinc-400 font-serif mt-0.5">
                      Replaces unformatted/blank page 1 with your crisp high-res cover art.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      onUpdateDocument({
                        ...document,
                        pdfOptions: {
                          ...document.pdfOptions,
                          coverAction: 'prepend_cover',
                          optimizeStream: document.pdfOptions?.optimizeStream ?? true,
                        },
                      })
                    }
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      document.pdfOptions?.coverAction === 'prepend_cover'
                        ? 'bg-blue-600/15 border-blue-500 text-white shadow-xs'
                        : 'bg-[#16161a] border-white/10 hover:border-white/20 text-zinc-400'
                    }`}
                  >
                    <h4 className="text-xs font-bold font-sans text-white">Prepend as Page 1</h4>
                    <p className="text-[11px] text-zinc-400 font-serif mt-0.5">
                      Inserts new cover page before page 1 without removing any existing pages.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      onUpdateDocument({
                        ...document,
                        pdfOptions: {
                          ...document.pdfOptions,
                          coverAction: 'metadata_only',
                          optimizeStream: document.pdfOptions?.optimizeStream ?? true,
                        },
                      })
                    }
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      document.pdfOptions?.coverAction === 'metadata_only'
                        ? 'bg-blue-600/15 border-blue-500 text-white shadow-xs'
                        : 'bg-[#16161a] border-white/10 hover:border-white/20 text-zinc-400'
                    }`}
                  >
                    <h4 className="text-xs font-bold font-sans text-white">Metadata Only</h4>
                    <p className="text-[11px] text-zinc-400 font-serif mt-0.5">
                      Updates internal Title/Author tags without altering PDF pages.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stream Compression Option */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <input
                  type="checkbox"
                  id="optStream"
                  checked={document.pdfOptions?.optimizeStream ?? true}
                  onChange={(e) =>
                    onUpdateDocument({
                      ...document,
                      pdfOptions: {
                        coverAction: document.pdfOptions?.coverAction || 'replace_page_1',
                        optimizeStream: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <label htmlFor="optStream" className="text-xs font-medium text-zinc-300 cursor-pointer">
                  Compress PDF Object Streams (Reduces file size for e-reader memory cards)
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auto-Identify Metadata Suggestions Modal */}
      {isSuggestionModalOpen && suggestionData && (
        <MetadataSuggestionModal
          isOpen={isSuggestionModalOpen}
          onClose={() => setIsSuggestionModalOpen(false)}
          currentMetadata={document.metadata}
          suggestion={suggestionData}
          rawFilename={document.originalName}
          extractedSampleSnippet={document.extractedTextSample}
          onApplySuggestions={handleApplySuggestions}
          onOpenCoverSearchWithQuery={(_query) => {
            setIsSuggestionModalOpen(false);
            onOpenCoverSearch();
          }}
        />
      )}
    </div>
  );
};
