import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BookDocument,
  EinkPreset,
  EpubChapter,
  EpubTypographySettings,
} from '../types';
import {
  DEFAULT_TYPOGRAPHY_SETTINGS,
  EINK_FONT_OPTIONS,
  TYPOGRAPHY_THEMES,
  calculateReadabilityMetrics,
} from '../utils/typographyPresets';
import { EINK_DEVICE_PRESETS, EINK_BRANDS, getPresetsByBrand } from '../utils/presets';
import {
  Type,
  AlignJustify,
  AlignLeft,
  Sliders,
  Sparkles,
  Check,
  RotateCcw,
  BookOpen,
  MonitorSmartphone,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Info,
  CheckCircle2,
  AlertCircle,
  Eye,
  Glasses,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

interface EpubTypographyStudioProps {
  document: BookDocument;
  currentPreset: EinkPreset;
  onSelectPreset?: (preset: EinkPreset) => void;
  onUpdateDocument: (updated: BookDocument) => void;
  onClose?: () => void;
  isStandaloneModal?: boolean;
}

export const EpubTypographyStudio: React.FC<EpubTypographyStudioProps> = ({
  document,
  currentPreset,
  onSelectPreset,
  onUpdateDocument,
  onClose,
  isStandaloneModal = false,
}) => {
  // Settings state (initialized from document or default)
  const [settings, setSettings] = useState<EpubTypographySettings>(
    document.typographySettings || { ...DEFAULT_TYPOGRAPHY_SETTINGS }
  );

  const [selectedBrand, setSelectedBrand] = useState<string>(currentPreset.brand || 'all');
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [currentPageOffset, setCurrentPageOffset] = useState<number>(0);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const [saveSuccessFeedback, setSaveSuccessFeedback] = useState<boolean>(false);

  // Available chapters or fallback
  const chapters: EpubChapter[] = useMemo(() => {
    if (document.chapters && document.chapters.length > 0) {
      return document.chapters;
    }
    // Fallback sample chapter if not extracted
    return [
      {
        id: 'chap_1',
        title: 'Chapter I',
        href: 'chap1.xhtml',
        contentHtml: `
          <h1>Chapter I</h1>
          <p class="chapter-first-p">The Time Traveller was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burnt brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses.</p>
          <p>Our chairs, being his patents, embraced and caressed us rather than submitted to be sat upon, and there was that luxurious after-dinner atmosphere when thought roams gracefully free of the trammels of precision.</p>
          <p>"You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, that you were taught in school is founded on a misconception."</p>
          <p>"Is not that rather a large thing to expect us to begin upon?" said Filby, an argumentative person with red hair.</p>
          <p>"I do not mean to ask you to accept anything without reasonable ground for it. You will soon admit as much as I need from you. You know of course that a mathematical line, a line of thickness nil, has no real existence. They were taught you that? Neither has a mathematical plane. These things are mere abstractions."</p>
          <p>"That is all right," said the Psychologist.</p>
          <p>"Nor, having only length, breadth, and thickness, can a cube have a real existence."</p>
        `,
        plainText:
          'The Time Traveller was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated...',
        wordCount: 380,
      },
      {
        id: 'chap_2',
        title: 'Chapter II',
        href: 'chap2.xhtml',
        contentHtml: `
          <h1>Chapter II</h1>
          <p class="chapter-first-p">It is simply this: that Space, as our mathematicians have it, is spoken of as having three dimensions, which one may call Length, Breadth, and Thickness, and is always definable by reference to three planes, each at right angles to the others.</p>
          <p>But some philosophical people have been asking why three dimensions particularly—why not another direction at right angles to the other three?—and have even tried to construct a Four-Dimensional geometry.</p>
          <p>Professor Simon Newcomb was expounding this to the New York Mathematical Society only a month or so ago. You know how on a flat surface, which has only two dimensions, we can represent a figure of a three-dimensional solid, and similarly they think that by models of three dimensions they could represent one of four.</p>
        `,
        plainText:
          'It is simply this: that Space, as our mathematicians have it, is spoken of as having three dimensions...',
        wordCount: 290,
      },
    ];
  }, [document.chapters]);

  const activeChapter = chapters[currentChapterIndex] || chapters[0];

  // Active theme configuration
  const currentTheme = useMemo(() => {
    return (
      TYPOGRAPHY_THEMES.find((t) => t.id === settings.theme) || TYPOGRAPHY_THEMES[0]
    );
  }, [settings.theme]);

  // Active font configuration
  const currentFont = useMemo(() => {
    return (
      EINK_FONT_OPTIONS.find((f) => f.name.includes(settings.fontFamily)) ||
      EINK_FONT_OPTIONS[0]
    );
  }, [settings.fontFamily]);

  // Readability & screen fitting calculations
  const previewRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 380, height: 560 });

  useEffect(() => {
    if (previewRef.current) {
      setContainerSize({
        width: previewRef.current.clientWidth || 380,
        height: previewRef.current.clientHeight || 560,
      });
    }
  }, [previewRef.current?.clientWidth, previewRef.current?.clientHeight, isFullscreenPreview]);

  const metrics = useMemo(() => {
    return calculateReadabilityMetrics(
      settings,
      currentPreset.resolution,
      containerSize.width,
      containerSize.height,
      activeChapter?.plainText || ''
    );
  }, [settings, currentPreset.resolution, containerSize.width, containerSize.height, activeChapter]);

  // Update setting helper
  const updateSetting = <K extends keyof EpubTypographySettings>(
    key: K,
    value: EpubTypographySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Save settings to document
  const handleApplyToEpub = () => {
    onUpdateDocument({
      ...document,
      typographySettings: settings,
      status: 'modified',
    });
    setSaveSuccessFeedback(true);
    setTimeout(() => setSaveSuccessFeedback(false), 2500);
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    setSettings({ ...DEFAULT_TYPOGRAPHY_SETTINGS });
  };

  // Switch device brand/preset
  const availableModels = selectedBrand === 'all'
    ? EINK_DEVICE_PRESETS
    : EINK_DEVICE_PRESETS.filter((p) => p.brand.toLowerCase() === selectedBrand.toLowerCase());

  return (
    <div className={`flex flex-col bg-[#0e0e11] text-zinc-100 ${isStandaloneModal ? 'h-full' : 'h-full overflow-hidden'}`}>
      {/* Studio Top Bar */}
      <div className="p-3.5 sm:px-5 border-b border-white/10 bg-[#131317] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Glasses className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              EPUB Text Appearance & Readability Tweaker
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                Live E-Ink Reflow
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Tune font sizes, line heights, margins, and contrast to guarantee readable, eye-safe formatting on your device.
            </p>
          </div>
        </div>

        {/* Device & Chapter Quick Selectors */}
        <div className="flex items-center gap-2">
          {/* Chapter Selector */}
          {chapters.length > 1 && (
            <div className="flex items-center gap-1 bg-[#191920] border border-white/10 rounded-lg px-2 py-1 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={currentChapterIndex}
                onChange={(e) => setCurrentChapterIndex(Number(e.target.value))}
                className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer max-w-[130px] truncate"
              >
                {chapters.map((chap, idx) => (
                  <option key={chap.id} value={idx} className="bg-[#18181f] text-zinc-200">
                    {chap.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target Device Selector */}
          {onSelectPreset && (
            <div className="flex items-center gap-1 bg-[#191920] border border-white/10 rounded-lg px-2 py-1 text-xs">
              <MonitorSmartphone className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={currentPreset.id}
                onChange={(e) => {
                  const found = EINK_DEVICE_PRESETS.find((p) => p.id === e.target.value);
                  if (found) {
                    onSelectPreset(found);
                    setSelectedBrand(found.brand);
                  }
                }}
                className="bg-transparent text-blue-300 font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {EINK_DEVICE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#18181f] text-zinc-200">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Apply Button */}
          <button
            type="button"
            onClick={handleApplyToEpub}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            {saveSuccessFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Saved to EPUB!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply to EPUB</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Body: Left Controls, Right Interactive Reader Preview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Side: Appearance & Typography Controls */}
        <div className="lg:col-span-5 xl:col-span-4 p-4 sm:p-5 overflow-y-auto space-y-5 border-r border-white/10 bg-[#111115]">
          {/* 1. Font Family */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-blue-400" />
                Typeface / Font Family
              </span>
              <span className="text-[10px] text-zinc-400 font-normal">
                {currentFont.category}
              </span>
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {EINK_FONT_OPTIONS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => updateSetting('fontFamily', font.name)}
                  className={`px-3 py-2 rounded-xl text-left border transition-all flex items-center justify-between text-xs ${
                    settings.fontFamily.includes(font.name) || font.name.includes(settings.fontFamily)
                      ? 'bg-blue-600/20 border-blue-500/50 text-white ring-1 ring-blue-500/30'
                      : 'bg-[#16161c] border-white/5 text-zinc-300 hover:bg-[#1c1c24]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold flex items-center gap-1.5">
                      <span style={{ fontFamily: font.fontFamilyCss }}>{font.name}</span>
                      {font.isEinkOptimized && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-400 rounded font-sans font-bold">
                          E-Ink Tuned
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-1">{font.description}</p>
                  </div>
                  {(settings.fontFamily.includes(font.name) || font.name.includes(settings.fontFamily)) && (
                    <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Font Size & Steppers */}
          <div className="space-y-2 p-3 rounded-xl bg-[#16161c] border border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-400" />
                Font Size
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateSetting('fontSize', Math.max(12, settings.fontSize - 1))}
                  className="w-6 h-6 rounded bg-[#202028] hover:bg-[#282834] text-zinc-300 flex items-center justify-center font-bold text-xs"
                >
                  -
                </button>
                <span className="font-mono font-bold text-blue-400 text-xs w-9 text-center">
                  {settings.fontSize}px
                </span>
                <button
                  type="button"
                  onClick={() => updateSetting('fontSize', Math.min(32, settings.fontSize + 1))}
                  className="w-6 h-6 rounded bg-[#202028] hover:bg-[#282834] text-zinc-300 flex items-center justify-center font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min="12"
              max="32"
              step="1"
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>12px (Dense)</span>
              <span>18px (Standard)</span>
              <span>32px (Large Print)</span>
            </div>
          </div>

          {/* 3. Line Spacing (Line-Height) */}
          <div className="space-y-2 p-3 rounded-xl bg-[#16161c] border border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">Line Height / Spacing</span>
              <span className="font-mono font-bold text-blue-400">{settings.lineHeight.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="2.4"
              step="0.05"
              value={settings.lineHeight}
              onChange={(e) => updateSetting('lineHeight', Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: 'Compact', val: 1.35 },
                { label: 'Normal', val: 1.6 },
                { label: 'Relaxed', val: 1.85 },
                { label: 'Roomy', val: 2.1 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => updateSetting('lineHeight', p.val)}
                  className={`py-1 rounded text-[10px] font-medium border transition-colors ${
                    Math.abs(settings.lineHeight - p.val) < 0.05
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[#202028] text-zinc-400 border-white/5 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Margins & Page Padding */}
          <div className="space-y-2 p-3 rounded-xl bg-[#16161c] border border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">Screen Margins (Gutter)</span>
              <span className="font-mono font-bold text-blue-400">{settings.marginSize}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="48"
              step="2"
              value={settings.marginSize}
              onChange={(e) => updateSetting('marginSize', Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>8px (Narrow)</span>
              <span>20px (Standard)</span>
              <span>48px (Wide)</span>
            </div>
          </div>

          {/* 5. Paragraph Indent & Spacing */}
          <div className="space-y-3 p-3 rounded-xl bg-[#16161c] border border-white/5">
            <span className="text-xs font-semibold text-zinc-300 block">Paragraph Styling</span>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  updateSetting('paragraphIndent', 1.5);
                  updateSetting('paragraphSpacing', 0);
                }}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  settings.paragraphIndent > 0 && settings.paragraphSpacing === 0
                    ? 'bg-blue-600/20 border-blue-500/50 text-white'
                    : 'bg-[#202028] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-[11px]">Classic Book</div>
                <div className="text-[10px] text-zinc-400">Indented, no gap</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateSetting('paragraphIndent', 0);
                  updateSetting('paragraphSpacing', 0.8);
                }}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  settings.paragraphIndent === 0 && settings.paragraphSpacing > 0
                    ? 'bg-blue-600/20 border-blue-500/50 text-white'
                    : 'bg-[#202028] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-[11px]">Modern Block</div>
                <div className="text-[10px] text-zinc-400">Flat indent + space</div>
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>First-line Indent:</span>
                <span className="font-mono text-zinc-200">{settings.paragraphIndent}em</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.25"
                value={settings.paragraphIndent}
                onChange={(e) => updateSetting('paragraphIndent', Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-1 bg-zinc-800 rounded-lg"
              />
            </div>
          </div>

          {/* 6. Alignment & Hyphenation */}
          <div className="space-y-2 p-3 rounded-xl bg-[#16161c] border border-white/5">
            <span className="text-xs font-semibold text-zinc-300 block">Text Alignment & Hyphenation</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => updateSetting('textAlign', 'justify')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-semibold transition-colors ${
                  settings.textAlign === 'justify'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-[#202028] text-zinc-400 border-white/5 hover:text-white'
                }`}
              >
                <AlignJustify className="w-3.5 h-3.5" />
                <span>Justified (Book)</span>
              </button>

              <button
                type="button"
                onClick={() => updateSetting('textAlign', 'left')}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-semibold transition-colors ${
                  settings.textAlign === 'left'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-[#202028] text-zinc-400 border-white/5 hover:text-white'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Left Aligned</span>
              </button>
            </div>

            <label className="flex items-center gap-2 pt-1 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.hyphenation}
                onChange={(e) => updateSetting('hyphenation', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[#202028] border-white/20"
              />
              <span>Enable Soft Hyphenation (Prevents loose river spacing in justified text)</span>
            </label>
          </div>

          {/* 7. E-Ink Contrast & Boldness Boost */}
          <div className="space-y-2 p-3 rounded-xl bg-[#16161c] border border-white/5">
            <span className="text-xs font-semibold text-zinc-300 block">E-Ink Font Weight & Boldness Boost</span>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {[
                { label: 'Regular', weight: 400 },
                { label: 'Medium', weight: 500 },
                { label: 'Semi-Bold', weight: 600 },
                { label: 'Bold', weight: 700 },
              ].map((w) => (
                <button
                  key={w.weight}
                  type="button"
                  onClick={() => updateSetting('fontWeight', w.weight as any)}
                  className={`py-1.5 rounded-lg border text-center text-xs transition-colors ${
                    settings.fontWeight === w.weight
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : 'bg-[#202028] text-zinc-400 border-white/5 hover:text-white'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500">
              Medium / Semi-bold is highly recommended for Carta displays to avoid faint hairline strokes.
            </p>
          </div>

          {/* 8. Display Simulation Themes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-200 block">
              E-Reader Screen Simulation Lighting
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TYPOGRAPHY_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => updateSetting('theme', theme.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                    settings.theme === theme.id
                      ? 'border-blue-500 ring-1 ring-blue-500/30 shadow-xs'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                  style={{ backgroundColor: theme.backgroundColor }}
                >
                  <div
                    className="font-bold text-xs"
                    style={{ color: theme.textColor }}
                  >
                    {theme.name}
                  </div>
                  <div
                    className="text-[10px] opacity-80"
                    style={{ color: theme.textColor }}
                  >
                    {theme.colorTemperature}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="w-full py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-[#191922] hover:bg-[#20202c] border border-white/5 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to E-Reader Standard</span>
            </button>
          </div>
        </div>

        {/* Right Side: Interactive Live E-Reader Screen Preview */}
        <div className="lg:col-span-7 xl:col-span-8 p-4 sm:p-6 bg-[#09090b] flex flex-col justify-between overflow-y-auto">
          {/* Readability & Fit Diagnostics Gauge Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            {/* 1. Characters Per Line (CPL) */}
            <div className="p-3 rounded-xl bg-[#141418] border border-white/10 space-y-1 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-between">
                <span>Line Width</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    metrics.cplStatus === 'optimal'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : metrics.cplStatus === 'narrow'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {metrics.charsPerLine} CPL
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 font-medium line-clamp-1">
                {metrics.cplStatus === 'optimal'
                  ? 'Optimal Reading Rhythm'
                  : metrics.cplStatus === 'narrow'
                  ? 'Narrow line width'
                  : 'Wide line width'}
              </p>
            </div>

            {/* 2. Estimated Lines Per Screen */}
            <div className="p-3 rounded-xl bg-[#141418] border border-white/10 space-y-1 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-zinc-400">
                <span>Lines Per Page</span>
              </div>
              <div className="text-sm font-bold text-white flex items-baseline gap-1">
                <span>~{metrics.linesPerScreen}</span>
                <span className="text-[10px] text-zinc-500 font-normal">lines</span>
              </div>
            </div>

            {/* 3. Words Per Screen */}
            <div className="p-3 rounded-xl bg-[#141418] border border-white/10 space-y-1 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-zinc-400">
                <span>Words Per Screen</span>
              </div>
              <div className="text-sm font-bold text-white flex items-baseline gap-1">
                <span>~{metrics.wordsPerScreen}</span>
                <span className="text-[10px] text-zinc-500 font-normal">words</span>
              </div>
            </div>

            {/* 4. Readability Score */}
            <div className="p-3 rounded-xl bg-[#141418] border border-white/10 space-y-1 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-between">
                <span>Readability</span>
                <span className="text-emerald-400 font-bold">{metrics.readabilityScore}/100</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${metrics.readabilityScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Realistic E-Reader Device Frame & Canvas */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-[480px]">
            <div
              ref={previewRef}
              className="relative w-full max-w-[540px] rounded-3xl p-5 sm:p-7 shadow-2xl transition-all border border-[#2d2d34]"
              style={{
                backgroundColor: '#161619',
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
              }}
            >
              {/* E-Reader Top Bezel info */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-sans pb-3 px-1 border-b border-white/5">
                <span className="font-semibold tracking-wider text-zinc-400 truncate max-w-[200px]">
                  {document.metadata.title || 'The Time Machine'}
                </span>
                <span className="font-mono text-[10px]">
                  {currentPreset.name.split('(')[0]} · {currentPreset.aspectRatio}
                </span>
              </div>

              {/* Realistic Paper Canvas with Typography */}
              <div
                className="mt-3 rounded-xl overflow-hidden p-4 sm:p-6 min-h-[380px] sm:min-h-[440px] select-text transition-all duration-200 border"
                style={{
                  backgroundColor: currentTheme.backgroundColor,
                  color: currentTheme.textColor,
                  borderColor: currentTheme.borderColor,
                  fontFamily: currentFont.fontFamilyCss,
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: settings.lineHeight,
                  fontWeight: settings.fontWeight,
                  textAlign: settings.textAlign === 'justify' ? 'justify' : 'left',
                  hyphens: settings.hyphenation ? 'auto' : 'none',
                  padding: `${settings.marginSize}px`,
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.03)',
                }}
              >
                {/* Simulated chapter text rendered with live settings */}
                <div
                  className="prose-epub"
                  style={{
                    fontFamily: currentFont.fontFamilyCss,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: activeChapter.contentHtml,
                  }}
                />
              </div>

              {/* E-Reader Bottom Bezel Pagination */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-sans pt-3 px-1 border-t border-white/5 mt-3">
                <button
                  type="button"
                  disabled={currentChapterIndex === 0}
                  onClick={() => setCurrentChapterIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev Chapter</span>
                </button>

                <span className="font-mono text-[10px] text-zinc-400">
                  Chapter {currentChapterIndex + 1} of {chapters.length} · ~{activeChapter.wordCount || 300} words
                </span>

                <button
                  type="button"
                  disabled={currentChapterIndex >= chapters.length - 1}
                  onClick={() => setCurrentChapterIndex((prev) => Math.min(chapters.length - 1, prev + 1))}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <span>Next Chapter</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Tips Footer */}
          <div className="p-3 rounded-xl bg-[#111115] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-400 mt-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                These styles are embedded directly into the EPUB’s custom stylesheet (<code>styles/ereader-typography.css</code>) when exported.
              </span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-300 hover:text-white font-medium hover:underline shrink-0"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
