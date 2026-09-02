import React, { useState, useEffect } from 'react';
import { X, Sparkles, Wand2, Palette, Check, RefreshCw } from 'lucide-react';
import { TypographyCoverOptions } from '../types';
import { generateTypographyCover } from '../utils/coverImageProcessor';

interface TypographyCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle: string;
  initialAuthor: string;
  initialSeries?: string;
  initialSeriesIndex?: string;
  onApplyCover: (dataUrl: string) => void;
}

const COVER_THEMES: Array<{
  id: string;
  name: string;
  options: TypographyCoverOptions;
}> = [
  {
    id: 'eink_high_contrast',
    name: 'E-Ink Pure High Contrast',
    options: {
      title: '',
      author: '',
      style: 'eink_high_contrast',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      accentColor: '#000000',
      borderStyle: 'ornate_double',
      subtitle: 'Official E-Reader Edition',
    },
  },
  {
    id: 'eink_dark_slate',
    name: 'Dark Obsidian & Gold',
    options: {
      title: '',
      author: '',
      style: 'vintage_ornate',
      backgroundColor: '#16181d',
      textColor: '#f1f1f1',
      accentColor: '#e5b358',
      borderStyle: 'ornate_double',
      subtitle: 'Complete & Unabridged',
    },
  },
  {
    id: 'classic_oxford_navy',
    name: 'Oxford Navy & Cream',
    options: {
      title: '',
      author: '',
      style: 'classic_editorial',
      backgroundColor: '#0f1c2e',
      textColor: '#f6f4ea',
      accentColor: '#d4af37',
      borderStyle: 'minimal_frame',
      subtitle: 'Literary Classics Series',
    },
  },
  {
    id: 'vintage_bookplate',
    name: 'Vintage Bookplate & Crimson',
    options: {
      title: '',
      author: '',
      style: 'vintage_ornate',
      backgroundColor: '#2b1b17',
      textColor: '#f5efe6',
      accentColor: '#c57b57',
      borderStyle: 'vintage_corner',
      subtitle: 'Illustrated Edition',
    },
  },
  {
    id: 'modern_minimal_mono',
    name: 'Modern Bauhaus Monochrome',
    options: {
      title: '',
      author: '',
      style: 'modern_bold',
      backgroundColor: '#f8f8f8',
      textColor: '#121212',
      accentColor: '#121212',
      borderStyle: 'eink_solid_frame',
      subtitle: '',
    },
  },
];

export const TypographyCoverModal: React.FC<TypographyCoverModalProps> = ({
  isOpen,
  onClose,
  initialTitle,
  initialAuthor,
  initialSeries,
  initialSeriesIndex,
  onApplyCover,
}) => {
  const [options, setOptions] = useState<TypographyCoverOptions>({
    title: initialTitle || 'Book Title',
    author: initialAuthor || 'Author Name',
    series: initialSeries || '',
    seriesIndex: initialSeriesIndex || '',
    subtitle: 'Definitive E-Reader Edition',
    style: 'vintage_ornate',
    backgroundColor: '#16181d',
    textColor: '#f1f1f1',
    accentColor: '#e5b358',
    borderStyle: 'ornate_double',
  });

  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOptions((prev) => ({
        ...prev,
        title: initialTitle || 'Book Title',
        author: initialAuthor || 'Author Name',
        series: initialSeries || '',
        seriesIndex: initialSeriesIndex || '',
      }));
    }
  }, [isOpen, initialTitle, initialAuthor, initialSeries, initialSeriesIndex]);

  // Re-render preview whenever options change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const generate = async () => {
      setIsGenerating(true);
      try {
        const dataUrl = await generateTypographyCover(options);
        if (isMounted) setPreviewDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate cover:', err);
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };

    generate();
    return () => {
      isMounted = false;
    };
  }, [isOpen, options]);

  const applyTheme = (theme: typeof COVER_THEMES[0]) => {
    setOptions((prev) => ({
      ...prev,
      ...theme.options,
      title: prev.title,
      author: prev.author,
      series: prev.series,
      seriesIndex: prev.seriesIndex,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#111114] rounded-2xl shadow-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-zinc-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#16161a]">
          <div>
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Bespoke Typography Cover Studio</span>
            </h3>
            <p className="text-xs text-zinc-400 font-serif">
              Generates high-resolution 1200x1600 vector typography covers optimized for e-ink screens
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Split Preview & Controls */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 p-4 sm:p-6 bg-[#0a0a0c]">
          {/* Left / Preview Area */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="w-56 sm:w-64 aspect-3/4 rounded-xl shadow-2xl overflow-hidden border-2 border-white/10 bg-[#16161a] relative">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-3">
              Standard 3:4 · 1200 × 1600 px · 300 PPI
            </p>
          </div>

          {/* Right / Customization Controls */}
          <div className="md:col-span-7 space-y-4">
            {/* Quick Themes */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Curated Aesthetics
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COVER_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => applyTheme(theme)}
                    className="p-2 text-left rounded-xl border border-white/10 bg-[#16161a] hover:border-blue-500/50 hover:bg-[#202026] hover:shadow-2xs transition-all text-xs"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: theme.options.backgroundColor }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-white/20 -ml-1.5"
                        style={{ backgroundColor: theme.options.accentColor }}
                      />
                    </div>
                    <span className="font-semibold text-zinc-200 block truncate font-sans">
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Fields */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 font-sans">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={options.title}
                    onChange={(e) => setOptions({ ...options, title: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[#16161a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 font-sans">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={options.author}
                    onChange={(e) => setOptions({ ...options, author: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[#16161a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 font-sans">
                    Series Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={options.series || ''}
                    onChange={(e) => setOptions({ ...options, series: e.target.value })}
                    placeholder="e.g. Earthsea Cycle"
                    className="w-full px-3 py-1.5 text-xs bg-[#16161a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 font-sans">
                    Volume #
                  </label>
                  <input
                    type="text"
                    value={options.seriesIndex || ''}
                    onChange={(e) => setOptions({ ...options, seriesIndex: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-1.5 text-xs bg-[#16161a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 font-sans">
                  Subtitle / Sub-header Tagline
                </label>
                <input
                  type="text"
                  value={options.subtitle || ''}
                  onChange={(e) => setOptions({ ...options, subtitle: e.target.value })}
                  placeholder="e.g. Definitive E-Reader Edition"
                  className="w-full px-3 py-1.5 text-xs bg-[#16161a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500"
                />
              </div>

              {/* Color & Border Customizer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Background
                  </label>
                  <div className="flex items-center gap-1.5 bg-[#16161a] border border-white/10 rounded-lg p-1">
                    <input
                      type="color"
                      value={options.backgroundColor}
                      onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-zinc-300">{options.backgroundColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Text Color
                  </label>
                  <div className="flex items-center gap-1.5 bg-[#16161a] border border-white/10 rounded-lg p-1">
                    <input
                      type="color"
                      value={options.textColor}
                      onChange={(e) => setOptions({ ...options, textColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-zinc-300">{options.textColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-1.5 bg-[#16161a] border border-white/10 rounded-lg p-1">
                    <input
                      type="color"
                      value={options.accentColor}
                      onChange={(e) => setOptions({ ...options, accentColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-zinc-300">{options.accentColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Frame Style
                  </label>
                  <select
                    value={options.borderStyle}
                    onChange={(e) => setOptions({ ...options, borderStyle: e.target.value as any })}
                    className="w-full px-2 py-1.5 text-xs bg-[#16161a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-200 font-sans"
                  >
                    <option value="ornate_double" className="bg-[#16161a] text-zinc-200">Ornate Double</option>
                    <option value="minimal_frame" className="bg-[#16161a] text-zinc-200">Minimal Line</option>
                    <option value="vintage_corner" className="bg-[#16161a] text-zinc-200">Vintage Corner</option>
                    <option value="eink_solid_frame" className="bg-[#16161a] text-zinc-200">Solid E-Ink Border</option>
                    <option value="none" className="bg-[#16161a] text-zinc-200">No Border</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#16161a] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewDataUrl || isGenerating}
            onClick={() => {
              if (previewDataUrl) {
                onApplyCover(previewDataUrl);
                onClose();
              }
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Apply Typography Cover</span>
          </button>
        </div>
      </div>
    </div>
  );
};
