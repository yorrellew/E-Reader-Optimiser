import JSZip from 'jszip';
import { BookMetadata, EpubChapter, EpubTypographySettings } from '../types';
import { generateEpubCustomCss } from './typographyPresets';

export interface ParsedEpub {
  metadata: BookMetadata;
  coverDataUrl: string | null;
  coverMimeType: string;
  sampleText: string;
  chapters: EpubChapter[];
  zip: JSZip;
  opfPath: string;
  opfContent: string;
}

/**
 * Parses an EPUB file, extracting metadata, cover image, sample text, and structured chapters.
 */
export async function parseEpub(file: File | Blob): Promise<ParsedEpub> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Locate OPF file via META-INF/container.xml
  const containerXmlStr = await zip.file('META-INF/container.xml')?.async('text');
  if (!containerXmlStr) {
    throw new Error('Invalid EPUB: Missing META-INF/container.xml');
  }

  const opfPathMatch = containerXmlStr.match(/full-path\s*=\s*["']([^"']+)["']/i);
  const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';
  const opfFile = zip.file(opfPath) || zip.file(decodeURIComponent(opfPath));

  if (!opfFile) {
    throw new Error(`Invalid EPUB: Cannot find OPF file at "${opfPath}"`);
  }

  const opfContent = await opfFile.async('text');
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Parse Metadata
  const metadata = extractMetadataFromOpf(opfContent);

  // 3. Extract Cover Image
  let coverDataUrl: string | null = null;
  let coverMimeType = 'image/jpeg';

  const coverImagePath = findCoverPathFromOpf(opfContent, opfDir);
  if (coverImagePath) {
    const coverZipFile = zip.file(coverImagePath) || zip.file(decodeURIComponent(coverImagePath));
    if (coverZipFile) {
      const ext = coverImagePath.split('.').pop()?.toLowerCase();
      coverMimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const coverBuffer = await coverZipFile.async('arraybuffer');
      coverDataUrl = arrayBufferToDataUrl(coverBuffer, coverMimeType);
    }
  }

  // 4. Extract chapters & rich text sample for Auto-Identify
  let sampleText = '';
  const chapters: EpubChapter[] = [];
  const spineMatches = Array.from(opfContent.matchAll(/<itemref\s+[^>]*idref=["']([^"']+)["'][^>]*>/gi));
  const manifestItems = extractManifestItems(opfContent);

  let chapterIndex = 1;
  for (const spineMatch of spineMatches) {
    const idref = spineMatch[1];
    const item = manifestItems.find((m) => m.id === idref);
    if (item && (item.mediaType.includes('html') || item.mediaType.includes('xml'))) {
      const chapterPath = resolvePath(opfDir, item.href);
      const chapterFile = zip.file(chapterPath);
      if (chapterFile) {
        const rawHtml = await chapterFile.async('text');
        const stripped = stripHtml(rawHtml);
        
        // Skip purely blank or single-word files (e.g. cover wrappers)
        if (stripped.length > 20) {
          // Extract chapter title from h1, h2, title, or first sentence
          const titleMatch = rawHtml.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i) || rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          let chapterTitle = titleMatch ? stripHtml(titleMatch[1]) : `Chapter ${chapterIndex}`;
          if (!chapterTitle || chapterTitle.toLowerCase().includes('untitled')) {
            chapterTitle = `Chapter ${chapterIndex}`;
          }

          // Extract body inner content
          const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          const bodyHtml = bodyMatch ? bodyMatch[1] : rawHtml;

          chapters.push({
            id: idref,
            title: chapterTitle.slice(0, 60),
            href: item.href,
            contentHtml: cleanChapterHtml(bodyHtml),
            plainText: stripped,
            wordCount: stripped.split(/\s+/).filter(Boolean).length,
          });

          chapterIndex++;
          if (sampleText.length < 15000) {
            sampleText += (sampleText ? '\n\n' : '') + stripped;
          }
        }
      }
    }
  }

  return {
    metadata,
    coverDataUrl,
    coverMimeType,
    sampleText: sampleText.trim(),
    chapters,
    zip,
    opfPath,
    opfContent,
  };
}

/**
 * Updates metadata, cover, and typography inside an EPUB and returns a standards-compliant EPUB Blob.
 */
export async function rebuildEpub(
  zip: JSZip,
  opfPath: string,
  newMetadata: BookMetadata,
  newCoverUint8Array: Uint8Array | null,
  newCoverMimeType: string = 'image/jpeg',
  typographySettings?: EpubTypographySettings
): Promise<Blob> {
  const opfFile = zip.file(opfPath);
  if (!opfFile) throw new Error('OPF file missing');
  let opfText = await opfFile.async('text');
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // Update OPF metadata tags
  opfText = updateOpfMetadata(opfText, newMetadata);

  // If custom typography settings are provided, inject a custom stylesheet
  if (typographySettings) {
    const cssContent = generateEpubCustomCss(typographySettings);
    const cssFileName = 'styles/ereader-typography.css';
    const fullCssPath = opfDir ? `${opfDir}${cssFileName}` : cssFileName;
    zip.file(fullCssPath, cssContent);

    // Ensure stylesheet item in manifest
    if (!opfText.includes('ereader-typography.css')) {
      const cssManifestItem = `<item id="ereader-custom-typography" href="${cssFileName}" media-type="text/css"/>`;
      if (/<manifest[^>]*>/i.test(opfText)) {
        opfText = opfText.replace(/<manifest([^>]*)>/i, `<manifest$1>\n    ${cssManifestItem}`);
      }
    }

    // Link stylesheet in all XHTML chapters
    const manifestItems = extractManifestItems(opfText);
    for (const item of manifestItems) {
      if (item.mediaType.includes('html') || item.mediaType.includes('xml')) {
        const chapterPath = resolvePath(opfDir, item.href);
        const chapterFile = zip.file(chapterPath);
        if (chapterFile) {
          let html = await chapterFile.async('text');
          if (!html.includes('ereader-typography.css')) {
            const linkTag = `<link rel="stylesheet" type="text/css" href="${relativeCssPath(item.href, cssFileName)}"/>`;
            if (/<head[^>]*>/i.test(html)) {
              html = html.replace(/<head([^>]*)>/i, `<head$1>\n  ${linkTag}`);
              zip.file(chapterPath, html);
            }
          }
        }
      }
    }
  }

  // If a new cover image is provided, inject it
  if (newCoverUint8Array && newCoverUint8Array.length > 0) {
    const coverExt = newCoverMimeType === 'image/png' ? 'png' : 'jpg';
    const coverFileName = `images/cover.${coverExt}`;
    const fullCoverPath = opfDir ? `${opfDir}${coverFileName}` : coverFileName;
    const coverHref = coverFileName;

    // Write image to zip
    zip.file(fullCoverPath, newCoverUint8Array);

    // Create / update cover.xhtml (XHTML page displaying the cover)
    const coverXhtmlFileName = 'cover.xhtml';
    const fullCoverXhtmlPath = opfDir ? `${opfDir}${coverXhtmlFileName}` : coverXhtmlFileName;
    const coverXhtmlContent = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${newMetadata.language || 'en'}">
<head>
  <title>Cover</title>
  <style type="text/css">
    @page { margin: 0; padding: 0; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      text-align: center;
      background-color: #000000;
    }
    div.cover-wrapper {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    img.cover-img {
      max-width: 100%;
      max-height: 100%;
      height: auto;
      width: auto;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="cover-wrapper">
    <img class="cover-img" src="${coverHref}" alt="Cover Image" />
  </div>
</body>
</html>`;
    zip.file(fullCoverXhtmlPath, coverXhtmlContent);

    // Inject manifest & spine & guide references into OPF
    opfText = ensureCoverInOpf(opfText, coverHref, newCoverMimeType, coverXhtmlFileName);
  }

  // Save updated OPF
  zip.file(opfPath, opfText);

  // Package the EPUB strictly:
  // 1. mimetype file must be first, STORE (no compression)
  // 2. All other files DEFLATE
  const newZip = new JSZip();
  newZip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // Copy all files from original zip except mimetype
  const filePromises: Promise<void>[] = [];
  zip.forEach((relativePath, file) => {
    if (relativePath !== 'mimetype') {
      filePromises.push(
        file.async('uint8array').then((content) => {
          newZip.file(relativePath, content, { compression: 'DEFLATE' });
        })
      );
    }
  });

  await Promise.all(filePromises);

  const epubBlob = await newZip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
  });

  return epubBlob;
}

// ---------------- Helper XML & Path Functions ----------------

function cleanChapterHtml(rawHtml: string): string {
  return rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/onload="[^"]*"/gi, '')
    .replace(/onclick="[^"]*"/gi, '')
    .trim();
}

function relativeCssPath(fromChapterHref: string, cssHref: string): string {
  const fromParts = fromChapterHref.split('/');
  fromParts.pop(); // remove filename
  if (fromParts.length === 0) return cssHref;
  const upCount = fromParts.length;
  return '../'.repeat(upCount) + cssHref;
}

function extractMetadataFromOpf(opfXml: string): BookMetadata {
  const getTagValue = (tagName: string): string => {
    const match = opfXml.match(new RegExp(`<dc:${tagName}[^>]*>([\\s\\S]*?)<\\/dc:${tagName}>`, 'i'));
    return match ? decodeXmlEntities(match[1].trim()) : '';
  };

  const getMultiTagValues = (tagName: string): string[] => {
    const matches = Array.from(opfXml.matchAll(new RegExp(`<dc:${tagName}[^>]*>([\\s\\S]*?)<\\/dc:${tagName}>`, 'gi')));
    return matches.map((m) => decodeXmlEntities(m[1].trim())).filter(Boolean);
  };

  const title = getTagValue('title');
  let authors = getMultiTagValues('creator');
  if (authors.length === 0) {
    const rawAuthor = getTagValue('creator');
    if (rawAuthor) authors = [rawAuthor];
  }

  const description = getTagValue('description');
  const publisher = getTagValue('publisher');
  const publishedDate = getTagValue('date');
  const language = getTagValue('language') || 'en';
  const subjects = getMultiTagValues('subject');

  // Find ISBN
  let isbn = '';
  const idMatches = Array.from(opfXml.matchAll(/<dc:identifier[^>]*>([\s\S]*?)<\/dc:identifier>/gi));
  for (const m of idMatches) {
    const val = m[1].trim();
    if (/isbn/i.test(m[0]) || /^(978|979)\d{10}$/.test(val.replace(/[- ]/g, ''))) {
      isbn = val;
      break;
    }
  }

  // Calibre / EPUB3 Series
  let series = '';
  let seriesIndex = '';

  const calibreSeriesMatch = opfXml.match(/<meta\s+[^>]*name=["']calibre:series["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (calibreSeriesMatch) series = decodeXmlEntities(calibreSeriesMatch[1].trim());

  const calibreIndexMatch = opfXml.match(/<meta\s+[^>]*name=["']calibre:series_index["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (calibreIndexMatch) seriesIndex = calibreIndexMatch[1].trim();

  // EPUB 3 collection
  if (!series) {
    const epub3CollectionMatch = opfXml.match(/<meta\s+property=["']belongs-to-collection["'][^>]*>([^<]+)<\/meta>/i);
    if (epub3CollectionMatch) series = decodeXmlEntities(epub3CollectionMatch[1].trim());
    const epub3IndexMatch = opfXml.match(/<meta\s+refines=["']#[^"']+["']\s+property=["']group-position["'][^>]*>([^<]+)<\/meta>/i);
    if (epub3IndexMatch) seriesIndex = epub3IndexMatch[1].trim();
  }

  return {
    title,
    authors: authors.length > 0 ? authors : ['Unknown Author'],
    series: series || undefined,
    seriesIndex: seriesIndex || undefined,
    publisher: publisher || undefined,
    publishedDate: publishedDate || undefined,
    description: description || undefined,
    language: language || 'en',
    isbn: isbn || undefined,
    genres: subjects.length > 0 ? subjects : undefined,
  };
}

function updateOpfMetadata(opfXml: string, meta: BookMetadata): string {
  let xml = opfXml;

  // Replace / Insert Title
  if (/<dc:title[^>]*>[\s\S]*?<\/dc:title>/i.test(xml)) {
    xml = xml.replace(/<dc:title[^>]*>[\s\S]*?<\/dc:title>/i, `<dc:title>${escapeXml(meta.title)}</dc:title>`);
  } else {
    xml = insertIntoMetadata(xml, `<dc:title>${escapeXml(meta.title)}</dc:title>`);
  }

  // Replace Creators / Authors
  xml = xml.replace(/<dc:creator[^>]*>[\s\S]*?<\/dc:creator>/gi, '');
  const authorXml = (meta.authors && meta.authors.length > 0 ? meta.authors : ['Unknown Author'])
    .map((a) => `<dc:creator opf:role="aut">${escapeXml(a)}</dc:creator>`)
    .join('\n    ');
  xml = insertIntoMetadata(xml, authorXml);

  // Description
  if (meta.description) {
    xml = xml.replace(/<dc:description[^>]*>[\s\S]*?<\/dc:description>/gi, '');
    xml = insertIntoMetadata(xml, `<dc:description>${escapeXml(meta.description)}</dc:description>`);
  }

  // Publisher
  if (meta.publisher) {
    xml = xml.replace(/<dc:publisher[^>]*>[\s\S]*?<\/dc:publisher>/gi, '');
    xml = insertIntoMetadata(xml, `<dc:publisher>${escapeXml(meta.publisher)}</dc:publisher>`);
  }

  // Published Date
  if (meta.publishedDate) {
    xml = xml.replace(/<dc:date[^>]*>[\s\S]*?<\/dc:date>/gi, '');
    xml = insertIntoMetadata(xml, `<dc:date>${escapeXml(meta.publishedDate)}</dc:date>`);
  }

  // Language
  if (meta.language) {
    xml = xml.replace(/<dc:language[^>]*>[\s\S]*?<\/dc:language>/gi, '');
    xml = insertIntoMetadata(xml, `<dc:language>${escapeXml(meta.language)}</dc:language>`);
  }

  // Series (Calibre & EPUB3 format)
  xml = xml.replace(/<meta\s+[^>]*name=["']calibre:series["'][^>]*\/>/gi, '');
  xml = xml.replace(/<meta\s+[^>]*name=["']calibre:series_index["'][^>]*\/>/gi, '');
  xml = xml.replace(/<meta\s+property=["']belongs-to-collection["'][^>]*>[\s\S]*?<\/meta>/gi, '');
  xml = xml.replace(/<meta\s+refines=["']#collection-1["'][^>]*>[\s\S]*?<\/meta>/gi, '');

  if (meta.series) {
    const seriesMeta = `
    <meta name="calibre:series" content="${escapeXml(meta.series)}"/>
    <meta name="calibre:series_index" content="${escapeXml(meta.seriesIndex || '1')}"/>
    <meta property="belongs-to-collection" id="collection-1">${escapeXml(meta.series)}</meta>
    <meta refines="#collection-1" property="collection-type">series</meta>
    <meta refines="#collection-1" property="group-position">${escapeXml(meta.seriesIndex || '1')}</meta>`;
    xml = insertIntoMetadata(xml, seriesMeta);
  }

  return xml;
}

function ensureCoverInOpf(
  opfXml: string,
  coverImageHref: string,
  coverMimeType: string,
  coverXhtmlHref: string
): string {
  let xml = opfXml;

  // 1. Ensure <meta name="cover" content="cover-image"/> in <metadata> (Critical for pocket e-readers and EPUB2)
  xml = xml.replace(/<meta\s+[^>]*name=["']cover["'][^>]*\/>/gi, '');
  xml = insertIntoMetadata(xml, `<meta name="cover" content="cover-image"/>`);

  // 2. Ensure cover-image item in <manifest> with properties="cover-image" (Critical for EPUB3 & Kobo)
  xml = xml.replace(/<item\s+[^>]*id=["']cover-image["'][^>]*\/>/gi, '');
  const coverImageItem = `<item id="cover-image" href="${coverImageHref}" media-type="${coverMimeType}" properties="cover-image"/>`;
  
  // 3. Ensure cover-page item in <manifest>
  xml = xml.replace(/<item\s+[^>]*id=["']cover-page["'][^>]*\/>/gi, '');
  const coverPageItem = `<item id="cover-page" href="${coverXhtmlHref}" media-type="application/xhtml+xml"/>`;

  if (/<manifest[^>]*>/i.test(xml)) {
    xml = xml.replace(/<manifest([^>]*)>/i, `<manifest$1>\n    ${coverImageItem}\n    ${coverPageItem}`);
  }

  // 4. Ensure <itemref idref="cover-page"/> in <spine>
  xml = xml.replace(/<itemref\s+[^>]*idref=["']cover-page["'][^>]*\/>/gi, '');
  if (/<spine[^>]*>/i.test(xml)) {
    xml = xml.replace(/<spine([^>]*)>/i, `<spine$1>\n    <itemref idref="cover-page" linear="yes"/>`);
  }

  // 5. Ensure <reference type="cover" title="Cover" href="cover.xhtml"/> in <guide> (Critical for older readers & pocket devices)
  const coverGuideRef = `<reference type="cover" title="Cover" href="${coverXhtmlHref}"/>`;
  if (/<guide[^>]*>/i.test(xml)) {
    xml = xml.replace(/<reference\s+[^>]*type=["']cover["'][^>]*\/>/gi, '');
    xml = xml.replace(/<guide([^>]*)>/i, `<guide$1>\n    ${coverGuideRef}`);
  } else {
    // Add guide before </package>
    xml = xml.replace(/<\/package>/i, `  <guide>\n    ${coverGuideRef}\n  </guide>\n</package>`);
  }

  return xml;
}

function insertIntoMetadata(opfXml: string, contentToInsert: string): string {
  if (/<metadata[^>]*>/i.test(opfXml)) {
    return opfXml.replace(/<metadata([^>]*)>/i, `<metadata$1>\n    ${contentToInsert}`);
  }
  return opfXml;
}

function findCoverPathFromOpf(opfXml: string, opfDir: string): string | null {
  // Method 1: Check <meta name="cover" content="id"/>
  const metaCoverMatch = opfXml.match(/<meta\s+[^>]*name=["']cover["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (metaCoverMatch) {
    const coverId = metaCoverMatch[1];
    const itemMatch = opfXml.match(new RegExp(`<item\\s+[^>]*id=["']${coverId}["'][^>]*href=["']([^"']+)["'][^>]*>`, 'i'));
    if (itemMatch) {
      return resolvePath(opfDir, itemMatch[1]);
    }
  }

  // Method 2: Check item with properties="cover-image"
  const propMatch = opfXml.match(/<item\s+[^>]*properties=["'][^"']*cover-image[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (propMatch) {
    return resolvePath(opfDir, propMatch[1]);
  }

  // Method 3: Check item id="cover" or id="cover-image"
  const idMatch = opfXml.match(/<item\s+[^>]*id=["'](cover|cover-image|cover-img|coverimage)["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (idMatch) {
    return resolvePath(opfDir, idMatch[2]);
  }

  // Method 4: Check guide <reference type="cover" href="..."/>
  const guideMatch = opfXml.match(/<reference\s+[^>]*type=["']cover["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (guideMatch && /\.(jpe?g|png|webp|gif)/i.test(guideMatch[1])) {
    return resolvePath(opfDir, guideMatch[1]);
  }

  return null;
}

function extractManifestItems(opfXml: string): Array<{ id: string; href: string; mediaType: string }> {
  const items: Array<{ id: string; href: string; mediaType: string }> = [];
  const matches = Array.from(opfXml.matchAll(/<item\s+([^>]+)\/?>/gi));
  for (const m of matches) {
    const attrs = m[1];
    const id = attrs.match(/id=["']([^"']+)["']/i)?.[1] || '';
    const href = attrs.match(/href=["']([^"']+)["']/i)?.[1] || '';
    const mediaType = attrs.match(/media-type=["']([^"']+)["']/i)?.[1] || '';
    if (id && href) {
      items.push({ id, href, mediaType });
    }
  }
  return items;
}

function resolvePath(baseDir: string, relativePath: string): string {
  if (!baseDir) return relativePath;
  const combined = baseDir + relativePath;
  const parts = combined.split('/');
  const stack: string[] = [];
  for (const p of parts) {
    if (p === '.' || p === '') continue;
    if (p === '..') stack.pop();
    else stack.push(p);
  }
  return stack.join('/');
}

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType: string): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function convertEpubToText(zip: JSZip): Promise<Blob> {
  const spineDocs = await extractSpine(zip);
  let fullText = "";
  for (const doc of spineDocs) {
    const bodyText = doc.body.textContent || "";
    fullText += bodyText.trim() + "\n\n";
  }
  return new Blob([fullText], { type: 'text/plain;charset=utf-8' });
}

export async function convertEpubToHtml(zip: JSZip): Promise<Blob> {
  const spineDocs = await extractSpine(zip);
  let fullHtml = "<html><head><meta charset='utf-8'></head><body>";
  for (const doc of spineDocs) {
    fullHtml += doc.body.innerHTML + "<hr/>";
  }
  fullHtml += "</body></html>";
  return new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
}

async function extractSpine(zip: JSZip): Promise<Document[]> {
  const containerXmlStr = await zip.file('META-INF/container.xml')?.async('text');
  if (!containerXmlStr) return [];
  const opfPathMatch = containerXmlStr.match(/full-path\s*=\s*["']([^"']+)["']/i);
  const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';
  
  const opfText = await zip.file(opfPath)?.async('text');
  if (!opfText) return [];
  
  const parser = new DOMParser();
  const opfDoc = parser.parseFromString(opfText, 'application/xml');
  
  const manifestItems = Array.from(opfDoc.querySelectorAll('manifest > item'));
  const spineItemRefs = Array.from(opfDoc.querySelectorAll('spine > itemref'));
  
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/')) : '';
  
  const docs: Document[] = [];
  for (const itemRef of spineItemRefs) {
    const idref = itemRef.getAttribute('idref');
    const manifestItem = manifestItems.find(i => i.getAttribute('id') === idref);
    if (!manifestItem) continue;
    
    const href = manifestItem.getAttribute('href');
    if (!href) continue;
    
    const fullPath = opfDir ? `${opfDir}/${href}` : href;
    const file = zip.file(fullPath);
    if (!file) continue;
    
    const htmlText = await file.async('text');
    const doc = parser.parseFromString(htmlText, 'text/html');
    docs.push(doc);
  }
  return docs;
}
