import { EpubTypographySettings } from '../types';

export const DEFAULT_TYPOGRAPHY_SETTINGS: EpubTypographySettings = {
  fontFamily: 'Bookerly',
  fontSize: 18,
  lineHeight: 1.6,
  marginSize: 20,
  paragraphIndent: 1.5,
  paragraphSpacing: 0,
  textAlign: 'justify',
  fontWeight: 400,
  hyphenation: true,
  dropCaps: false,
  headerStyle: 'classic_caps',
  theme: 'carta',
  contrastBoost: false,
};

export interface TypographyFontOption {
  id: string;
  name: string;
  category: 'Serif' | 'Sans' | 'Accessibility' | 'Monospace';
  fontFamilyCss: string;
  description: string;
  isEinkOptimized: boolean;
}

export const EINK_FONT_OPTIONS: TypographyFontOption[] = [
  {
    id: 'bookerly',
    name: 'Bookerly (Kindle Standard)',
    category: 'Serif',
    fontFamilyCss: "'Bookerly', 'Newsreader', 'Georgia', serif",
    description: 'Engineered specifically for e-ink reading. Balances optical density, high x-height, and smooth ligatures.',
    isEinkOptimized: true,
  },
  {
    id: 'literata',
    name: 'Literata (Google Play Books)',
    category: 'Serif',
    fontFamilyCss: "'Literata', 'Newsreader', 'Georgia', serif",
    description: 'Designed by TypeTogether for continuous digital reading. Features delicate italics and robust serifs.',
    isEinkOptimized: true,
  },
  {
    id: 'charis_sil',
    name: 'Charis SIL (Classic E-Ink)',
    category: 'Serif',
    fontFamilyCss: "'Charis SIL', 'Georgia', 'Times New Roman', serif",
    description: 'Renowned for exceptional clarity, extended Unicode glyphs, and maximum contrast on grayscale Carta displays.',
    isEinkOptimized: true,
  },
  {
    id: 'merriweather',
    name: 'Merriweather (Screen Serif)',
    category: 'Serif',
    fontFamilyCss: "'Merriweather', 'Georgia', serif",
    description: 'High contrast, slightly condensed letterforms tailored to smaller display viewports.',
    isEinkOptimized: true,
  },
  {
    id: 'bitter',
    name: 'Bitter (Slab Serif)',
    category: 'Serif',
    fontFamilyCss: "'Bitter', 'Georgia', serif",
    description: 'Contemporary slab serif with thick stems and minimal stroke contrast, preventing pixel flicker on low PPI screens.',
    isEinkOptimized: true,
  },
  {
    id: 'georgia',
    name: 'Georgia (Editorial Standard)',
    category: 'Serif',
    fontFamilyCss: "'Georgia', 'Cambria', serif",
    description: 'Generous character spacing and tall x-height for effortless long-form reading.',
    isEinkOptimized: false,
  },
  {
    id: 'atkinson',
    name: 'Atkinson Hyperlegible',
    category: 'Accessibility',
    fontFamilyCss: "'Atkinson Hyperlegible', 'Plus Jakarta Sans', sans-serif",
    description: 'Developed with the Braille Institute. Focuses on letterform distinction to dramatically reduce reading fatigue.',
    isEinkOptimized: true,
  },
  {
    id: 'opendyslexic',
    name: 'OpenDyslexic (Anti-Gravity)',
    category: 'Accessibility',
    fontFamilyCss: "'OpenDyslexic', 'Comic Sans MS', sans-serif",
    description: 'Weighted bottoms to orient letters and prevent mental flipping or rotation.',
    isEinkOptimized: true,
  },
  {
    id: 'plus_jakarta',
    name: 'Plus Jakarta Sans (Modern Clean)',
    category: 'Sans',
    fontFamilyCss: "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif",
    description: 'Geometric humanist sans-serif with high aperture and clean modern reading flow.',
    isEinkOptimized: false,
  },
  {
    id: 'jetbrains_mono',
    name: 'JetBrains Mono (Technical)',
    category: 'Monospace',
    fontFamilyCss: "'JetBrains Mono', 'Courier New', monospace",
    description: 'Monospaced with increased letter height and distinct punctuation for technical or poetry texts.',
    isEinkOptimized: false,
  },
];

export interface TypographyThemeOption {
  id: 'carta' | 'warm' | 'amber' | 'cool' | 'dark';
  name: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  description: string;
  colorTemperature: string;
}

export const TYPOGRAPHY_THEMES: TypographyThemeOption[] = [
  {
    id: 'carta',
    name: 'E-Ink Carta 1200 (Natural)',
    textColor: '#121214',
    backgroundColor: '#ecece8',
    borderColor: '#d1d1cd',
    description: '16-level grayscale natural reflective e-paper look with zero glare.',
    colorTemperature: 'Standard Reflective',
  },
  {
    id: 'warm',
    name: 'Warm Frontlight (3500K)',
    textColor: '#1a1815',
    backgroundColor: '#f5eee3',
    borderColor: '#e5d9c7',
    description: 'Gentle amber glow for evening and bedside reading.',
    colorTemperature: '3500K Warm',
  },
  {
    id: 'amber',
    name: 'Candlelight Frontlight (2700K)',
    textColor: '#1c150b',
    backgroundColor: '#fbf0dc',
    borderColor: '#eed8b8',
    description: 'Deep warm amber tone eliminating all blue light exposure.',
    colorTemperature: '2700K Candlelight',
  },
  {
    id: 'cool',
    name: 'Daylight Frontlight (6500K)',
    textColor: '#0f172a',
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    description: 'Crisp bright white backlight for outdoor daylight reading.',
    colorTemperature: '6500K Daylight',
  },
  {
    id: 'dark',
    name: 'E-Ink Night Mode (Inverted)',
    textColor: '#e4e4e7',
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    description: 'Inverted high-contrast black canvas for dark-mode compatible e-notes.',
    colorTemperature: 'Inverted Low-Light',
  },
];

/**
 * Calculates real-time readability and layout fit metrics based on typography settings
 * and viewport width/height.
 */
export function calculateReadabilityMetrics(
  settings: EpubTypographySettings,
  deviceResolution: { width: number; height: number },
  previewWidthPx: number,
  previewHeightPx: number,
  sampleText: string
) {
  // Effective text container width considering padding
  const effectiveWidth = Math.max(120, previewWidthPx - settings.marginSize * 2);
  const effectiveHeight = Math.max(150, previewHeightPx - settings.marginSize * 2);

  // Approximate character width in pixels for given font size (average ~0.52em per char)
  const charWidthPx = settings.fontSize * 0.52;
  const charsPerLine = Math.round(effectiveWidth / charWidthPx);

  // Approximate line height in pixels
  const lineSpacingPx = settings.fontSize * settings.lineHeight;
  const linesPerScreen = Math.floor(effectiveHeight / lineSpacingPx);

  // Approximate words per line (~5.5 chars per word + space)
  const wordsPerLine = charsPerLine / 5.5;
  const wordsPerScreen = Math.round(wordsPerLine * linesPerScreen);

  // CPL Category & Score
  let cplStatus: 'optimal' | 'narrow' | 'wide' = 'optimal';
  let cplMessage = 'Optimal (55-75 CPL) — Ideal reading rhythm and eye tracking.';

  if (charsPerLine < 48) {
    cplStatus = 'narrow';
    cplMessage = 'Narrow line width — Text may feel fragmented or require frequent line jumps.';
  } else if (charsPerLine > 82) {
    cplStatus = 'wide';
    cplMessage = 'Wide line width — Long lines increase eye strain when scanning to the next line.';
  }

  // Calculate readability score (0 - 100)
  let score = 95;
  if (charsPerLine >= 55 && charsPerLine <= 75) score += 5;
  else score -= Math.min(25, Math.abs(charsPerLine - 65) * 0.8);

  if (settings.lineHeight >= 1.4 && settings.lineHeight <= 1.8) score += 3;
  else score -= 8;

  if (settings.fontSize >= 15 && settings.fontSize <= 22) score += 2;
  else score -= 5;

  const boundedScore = Math.max(40, Math.min(100, Math.round(score)));

  // Word count & reading time calculation
  const totalWords = sampleText ? sampleText.split(/\s+/).filter(Boolean).length : 250;
  const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 220));

  return {
    charsPerLine,
    cplStatus,
    cplMessage,
    linesPerScreen,
    wordsPerScreen,
    readabilityScore: boundedScore,
    totalWords,
    readingTimeMinutes,
  };
}

/**
 * Generates standards-compliant EPUB CSS matching the user's typography tweaks.
 */
export function generateEpubCustomCss(settings: EpubTypographySettings): string {
  const fontOpt = EINK_FONT_OPTIONS.find((f) => f.name.includes(settings.fontFamily)) || EINK_FONT_OPTIONS[0];

  return `/* ==========================================================================
   E-Reader Optimized Typography Stylesheet
   Generated by E-Reader Cover & Metadata Studio
   ========================================================================== */

@namespace epub "http://www.idpf.org/2007/ops";

html, body {
  font-family: ${fontOpt.fontFamilyCss};
  font-size: ${settings.fontSize}px !important;
  line-height: ${settings.lineHeight} !important;
  font-weight: ${settings.fontWeight} !important;
  text-align: ${settings.textAlign === 'justify' ? 'justify' : 'left'} !important;
  margin: 0 !important;
  padding: ${settings.marginSize}px !important;
  -webkit-hyphens: ${settings.hyphenation ? 'auto' : 'none'} !important;
  -moz-hyphens: ${settings.hyphenation ? 'auto' : 'none'} !important;
  -ms-hyphens: ${settings.hyphenation ? 'auto' : 'none'} !important;
  hyphens: ${settings.hyphenation ? 'auto' : 'none'} !important;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

p {
  text-indent: ${settings.paragraphIndent}em !important;
  margin-top: 0 !important;
  margin-bottom: ${settings.paragraphSpacing}em !important;
  line-height: inherit !important;
}

${
  settings.paragraphIndent > 0
    ? `
/* Remove indent from first paragraph after headers */
h1 + p, h2 + p, h3 + p, h4 + p, hr + p, .chapter-start {
  text-indent: 0 !important;
}
`
    : ''
}

h1, h2, h3, h4, h5, h6 {
  font-family: ${fontOpt.fontFamilyCss};
  font-weight: 700 !important;
  line-height: 1.25 !important;
  margin-top: 1.6em !important;
  margin-bottom: 0.8em !important;
  page-break-after: avoid;
  break-after: avoid;
  ${settings.headerStyle === 'classic_caps' ? 'text-transform: uppercase; letter-spacing: 0.08em; text-align: center;' : ''}
  ${settings.headerStyle === 'ornate_divider' ? 'text-align: center; border-bottom: 1px solid #777; padding-bottom: 0.3em;' : ''}
  ${settings.headerStyle === 'modern_bold' ? 'text-align: left;' : ''}
}

${
  settings.dropCaps
    ? `
p.first-para:first-letter, h1 + p:first-letter, .chapter-first-p:first-letter {
  float: left;
  font-size: 3.2em;
  line-height: 0.8;
  padding-top: 4px;
  padding-right: 8px;
  padding-bottom: 2px;
  font-family: serif;
  font-weight: bold;
}
`
    : ''
}

blockquote {
  margin: 1em 2em !important;
  font-style: italic;
  border-left: 2px solid #666;
  padding-left: 1em !important;
}

img {
  max-width: 100% !important;
  height: auto !important;
}
`;
}
