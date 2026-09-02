import { BookMetadata } from '../types';

/**
 * Formats a filename based on template and metadata, sanitizing for e-reader FAT32 / SD cards.
 */
export function formatFilename(
  pattern: string,
  metadata: BookMetadata,
  extension: string
): string {
  let authorStr = (metadata.authors && metadata.authors.length > 0)
    ? metadata.authors.join(', ')
    : 'Unknown Author';
  
  let titleStr = metadata.title ? metadata.title.trim() : 'Untitled Document';
  let seriesStr = metadata.series ? metadata.series.trim() : '';
  let seriesIndexStr = metadata.seriesIndex ? metadata.seriesIndex.trim() : '';
  let publisherStr = metadata.publisher ? metadata.publisher.trim() : '';
  let yearStr = metadata.publishedDate ? metadata.publishedDate.slice(0, 4) : '';

  // Pad series index if single digit for natural sorting e.g. "01" if number <= 9
  let paddedIndex = seriesIndexStr;
  if (/^\d+$/.test(seriesIndexStr)) {
    const num = parseInt(seriesIndexStr, 10);
    if (num < 10) {
      paddedIndex = `0${num}`;
    }
  }

  let result = pattern
    .replace(/\{title\}/gi, titleStr)
    .replace(/\{author\}/gi, authorStr)
    .replace(/\{series\}/gi, seriesStr)
    .replace(/\{seriesIndex\}/gi, paddedIndex || seriesIndexStr)
    .replace(/\{publisher\}/gi, publisherStr)
    .replace(/\{year\}/gi, yearStr);

  // Clean up orphan brackets, empty separators when series or seriesIndex is blank
  result = result
    .replace(/#\s*-\s*/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\{\s*\}/g, '')
    .replace(/\s*-\s*-\s*/g, ' - ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Remove leading / trailing hyphens or periods
  result = result.replace(/^[-_\s.]+|[-_\s.]+$/g, '');

  if (!result) {
    result = titleStr || 'Document';
  }

  // Sanitize illegal filesystem characters for FAT32 / Linux / Mac / E-Readers
  // Prohibited: < > : " / \ | ? * and ASCII control characters (0-31)
  result = result
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Cap length to 180 chars to avoid MAX_PATH issues on SD cards
  if (result.length > 180) {
    result = result.slice(0, 180).trim();
  }

  return `${result}.${extension}`;
}

export function sanitizeTitle(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[\(\[\{]?(epub|pdf|mobi|retail|v\d+(\.\d+)*|unabridged|scan|fixed)[\)\]\}]?/gi, '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
