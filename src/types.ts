export type FileType = 'epub' | 'pdf';

export type DocumentStatus = 'idle' | 'analyzing' | 'ready' | 'modified' | 'saving' | 'saved' | 'error';

export interface BookMetadata {
  title: string;
  authors: string[];
  series?: string;
  seriesIndex?: string;
  publisher?: string;
  publishedDate?: string;
  description?: string;
  language?: string;
  isbn?: string;
  genres?: string[];
  identifiers?: { [key: string]: string };
}

export type EinkGrayscaleMode = 'none' | 'eink_16_gray' | 'floyd_steinberg' | 'atkinson_dither' | 'high_contrast';

export interface CoverTuning {
  contrast: number; // -50 to +50 (default: 15 for e-ink pop)
  brightness: number; // -50 to +50 (default: 0)
  gamma: number; // 0.5 to 2.0 (default: 1.1)
  grayscaleMode: EinkGrayscaleMode;
  aspectRatioPreset: string; // 'eink_standard_3_4' | 'kindle_pw' | 'kobo_clara' | 'original'
  customWidth?: number;
  customHeight?: number;
}

export interface EinkPreset {
  id: string;
  name: string;
  brand: string;
  resolution: { width: number; height: number };
  aspectRatio: string;
  description: string;
  recommendedCoverSize: string;
  isDefault?: boolean;
}

export type PdfCoverAction = 'replace_page_1' | 'prepend_cover' | 'metadata_only';

export interface EpubTypographySettings {
  fontFamily: string; // 'Bookerly' | 'Literata' | 'Charis SIL' | 'Georgia' | 'Merriweather' | 'Bitter' | 'Atkinson Hyperlegible' | 'OpenDyslexic' | 'System Serif' | 'System Sans'
  fontSize: number; // 12 to 32px (default: 18)
  lineHeight: number; // 1.2 to 2.4 (default: 1.6)
  marginSize: number; // 8 to 48px (default: 20)
  paragraphIndent: number; // 0 to 3.0em (default: 1.5)
  paragraphSpacing: number; // 0 to 2.0em (default: 0)
  textAlign: 'justify' | 'left';
  fontWeight: 400 | 500 | 600 | 700;
  hyphenation: boolean;
  dropCaps: boolean;
  headerStyle: 'classic_caps' | 'modern_bold' | 'ornate_divider';
  theme: 'carta' | 'warm' | 'amber' | 'cool' | 'dark';
  contrastBoost: boolean;
}

export interface EpubChapter {
  id: string;
  title: string;
  href: string;
  contentHtml: string;
  plainText: string;
  wordCount?: number;
}

export interface MetadataSuggestion {
  title?: string;
  author?: string;
  allAuthors?: string[];
  series?: string;
  seriesIndex?: string;
  publisher?: string;
  publishedDate?: string;
  description?: string;
  genres?: string[];
  language?: string;
  isbn?: string;
  searchQuery?: string;
  suggestedFilename?: string;
  suggestedCoverUrl?: string;
  confidenceScore?: number;
  confidenceNotes?: string;
  source?: string;
  evidenceDetails?: {
    isbnFound?: string;
    rawExcerptMatched?: string;
    webCatalogMatch?: string;
    sourceSummary?: string;
  };
}

export interface BookDocument {
  id: string;
  file: File;
  originalName: string;
  fileType: FileType;
  fileSize: number;
  metadata: BookMetadata;
  originalMetadata: BookMetadata;
  
  // Cover properties
  coverDataUrl: string | null;
  coverMimeType: string;
  originalCoverDataUrl: string | null;
  coverSource: 'extracted' | 'searched' | 'uploaded' | 'generated' | 'pdf_page' | 'none';
  coverTuning: CoverTuning;

  // Typography / Text Tweaks & Chapters for EPUB previewing
  typographySettings?: EpubTypographySettings;
  chapters?: EpubChapter[];

  // Processing & UI
  status: DocumentStatus;
  statusMessage?: string;
  extractedTextSample?: string;
  pageCount?: number;
  suggestedFilename?: string;
  customFilename?: string;
  
  // PDF specific options
  pdfOptions?: {
    coverAction: PdfCoverAction;
    optimizeStream: boolean;
  };
}

export interface SearchBookResult {
  source: string;
  id: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  language?: string;
  categories?: string[];
  pageCount?: number;
  isbn?: string;
  coverUrl?: string;
}

export interface TypographyCoverOptions {
  title: string;
  author: string;
  subtitle?: string;
  series?: string;
  seriesIndex?: string;
  style: 'classic_editorial' | 'eink_high_contrast' | 'modern_bold' | 'vintage_ornate' | 'minimal_slate';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderStyle: 'none' | 'ornate_double' | 'minimal_frame' | 'vintage_corner' | 'eink_solid_frame';
}
