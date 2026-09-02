import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { BookMetadata } from '../types';
import JSZip from 'jszip';

// Set up pdf.js worker using unpkg / cdnjs or inline worker to guarantee zero-config browser execution
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ParsedPdf {
  metadata: BookMetadata;
  pageCount: number;
  coverDataUrl: string | null;
  coverMimeType: string;
  sampleText: string;
  extractedPagesText: string[];
}

/**
 * Parses a PDF file to extract metadata, render first page as thumbnail cover, and sample text.
 */
export async function parsePdf(file: File | Blob): Promise<ParsedPdf> {
  const arrayBuffer = await file.arrayBuffer();

  // 1. Extract metadata via pdf-lib
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  const title = pdfDoc.getTitle() || '';
  const author = pdfDoc.getAuthor() || '';
  const subject = pdfDoc.getSubject() || '';
  const keywordsStr = pdfDoc.getKeywords() || '';
  const keywords = keywordsStr ? keywordsStr.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [];
  const producer = pdfDoc.getProducer() || '';
  const creationDate = pdfDoc.getCreationDate() ? pdfDoc.getCreationDate()?.toISOString() : '';

  const metadata: BookMetadata = {
    title: title.trim(),
    authors: author ? [author.trim()] : ['Unknown Author'],
    description: subject || undefined,
    publisher: producer || undefined,
    publishedDate: creationDate ? creationDate.slice(0, 10) : undefined,
    genres: keywords.length > 0 ? keywords : undefined,
    language: 'en',
  };

  // 2. Extract first page thumbnail & text via pdfjs-dist
  let coverDataUrl: string | null = null;
  let sampleText = '';
  const extractedPagesText: string[] = [];

  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
    const pdfJsDoc = await loadingTask.promise;

    // Render Page 1 as high-res cover thumbnail
    if (pdfJsDoc.numPages > 0) {
      const page1 = await pdfJsDoc.getPage(1);
      const viewport = page1.getViewport({ scale: 2.0 }); // 2x scale for sharp preview
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // @ts-ignore
        await page1.render({ canvasContext: ctx, viewport }).promise;
        coverDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      }
    }

    // Extract text from the first 5 pages for AI book identification
    const maxPagesToSample = Math.min(5, pdfJsDoc.numPages);
    for (let i = 1; i <= maxPagesToSample; i++) {
      const page = await pdfJsDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      extractedPagesText.push(pageText);
      sampleText += ' ' + pageText;
    }
  } catch (err) {
    console.warn('PDF text / thumbnail extraction non-fatal warning:', err);
  }

  return {
    metadata,
    pageCount,
    coverDataUrl,
    coverMimeType: 'image/jpeg',
    sampleText: sampleText.trim(),
    extractedPagesText,
  };
}

/**
 * Updates metadata and optimizes / injects cover into PDF.
 */
export async function optimizePdf(
  originalArrayBuffer: ArrayBuffer,
  metadata: BookMetadata,
  coverUint8Array: Uint8Array | null,
  coverMimeType: string = 'image/jpeg',
  coverAction: 'replace_page_1' | 'prepend_cover' | 'metadata_only' = 'replace_page_1'
): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(originalArrayBuffer, { ignoreEncryption: true });

  // 1. Update Document Information
  if (metadata.title) pdfDoc.setTitle(metadata.title);
  if (metadata.authors && metadata.authors.length > 0) pdfDoc.setAuthor(metadata.authors.join(', '));
  if (metadata.description) pdfDoc.setSubject(metadata.description);
  if (metadata.genres && metadata.genres.length > 0) pdfDoc.setKeywords(metadata.genres);
  if (metadata.publisher) pdfDoc.setProducer(metadata.publisher);
  pdfDoc.setCreator('E-Reader Cover & Metadata Studio');
  pdfDoc.setModificationDate(new Date());

  // 2. Embed cover if provided
  if (coverUint8Array && coverUint8Array.length > 0 && coverAction !== 'metadata_only') {
    let embeddedImage;
    if (coverMimeType === 'image/png') {
      embeddedImage = await pdfDoc.embedPng(coverUint8Array);
    } else {
      embeddedImage = await pdfDoc.embedJpg(coverUint8Array);
    }

    const { width: imgWidth, height: imgHeight } = embeddedImage;

    // Create a new cover page matching image proportions (or standard 3:4 / e-reader aspect ratio)
    const coverPage = pdfDoc.insertPage(0, [imgWidth, imgHeight]);
    coverPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: imgWidth,
      height: imgHeight,
    });

    // If replace_page_1 is selected and original document had >= 2 pages (now >= 3 with insert), remove old page 1 (which is now index 1)
    if (coverAction === 'replace_page_1' && pdfDoc.getPageCount() > 1) {
      pdfDoc.removePage(1);
    }
  }

  // 3. Save optimized PDF with object streams enabled for maximum compression
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Converts extracted PDF text content into a cleanly structured EPUB with custom cover.
 */
export async function convertPdfToEpub(
  metadata: BookMetadata,
  extractedPages: string[],
  coverUint8Array: Uint8Array | null,
  coverMimeType: string = 'image/jpeg'
): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (Uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. Embed Cover Image
  const coverFileName = coverMimeType === 'image/png' ? 'cover.png' : 'cover.jpg';
  if (coverUint8Array && coverUint8Array.length > 0) {
    zip.file(`OEBPS/images/${coverFileName}`, coverUint8Array);
  }

  // 4. Create cover.xhtml
  const coverXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${metadata.language || 'en'}">
<head>
  <title>Cover</title>
  <style type="text/css">
    @page { margin: 0; padding: 0; }
    body { margin: 0; padding: 0; text-align: center; background-color: #000; }
    img { max-width: 100%; max-height: 100%; height: auto; width: auto; object-fit: contain; }
  </style>
</head>
<body>
  <div>
    <img src="images/${coverFileName}" alt="Cover" />
  </div>
</body>
</html>`;
  zip.file('OEBPS/cover.xhtml', coverXhtml);

  // 5. Create Chapter content pages
  const chapterFiles: string[] = [];
  const paragraphsPerChapter = 6;
  const allParagraphs: string[] = [];

  for (const pageText of extractedPages) {
    const lines = pageText.split('\n').filter((l) => l.trim().length > 0);
    allParagraphs.push(...lines);
  }

  // Group into chapters
  const totalChapters = Math.max(1, Math.ceil(allParagraphs.length / paragraphsPerChapter));
  for (let c = 0; c < totalChapters; c++) {
    const chapNum = c + 1;
    const chapFileName = `chapter_${chapNum}.xhtml`;
    chapterFiles.push(chapFileName);

    const chunk = allParagraphs.slice(c * paragraphsPerChapter, (c + 1) * paragraphsPerChapter);
    const bodyHtml = chunk.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');

    const chapContent = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${metadata.language || 'en'}">
<head>
  <title>Chapter ${chapNum}</title>
  <style type="text/css">
    body { font-family: serif; line-height: 1.6; margin: 5%; color: #111; }
    h2 { text-align: center; margin-bottom: 2rem; }
    p { text-indent: 1.5em; margin-top: 0; margin-bottom: 0.8em; }
  </style>
</head>
<body>
  <h2>Section ${chapNum}</h2>
  ${bodyHtml || '<p>(No text extracted for this section)</p>'}
</body>
</html>`;

    zip.file(`OEBPS/${chapFileName}`, chapContent);
  }

  // 6. content.opf
  const title = metadata.title || 'Untitled Book';
  const author = metadata.authors?.[0] || 'Unknown Author';

  const manifestItems = chapterFiles
    .map((f, i) => `<item id="chap_${i + 1}" href="${f}" media-type="application/xhtml+xml"/>`)
    .join('\n    ');

  const spineItems = chapterFiles
    .map((_, i) => `<itemref idref="chap_${i + 1}"/>`)
    .join('\n    ');

  const opfContent = `<?xml version="1.0" encoding="utf-8"?>
<package version="3.0" unique-identifier="pub-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title id="title">${escapeHtml(title)}</dc:title>
    <dc:creator id="creator">${escapeHtml(author)}</dc:creator>
    <dc:language>${metadata.language || 'en'}</dc:language>
    <dc:identifier id="pub-id">urn:uuid:${Math.random().toString(36).substring(2)}</dc:identifier>
    <meta name="cover" content="cover-image"/>
    ${metadata.description ? `<dc:description>${escapeHtml(metadata.description)}</dc:description>` : ''}
  </metadata>
  <manifest>
    <item id="cover-image" href="images/${coverFileName}" media-type="${coverMimeType}" properties="cover-image"/>
    <item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>
    ${manifestItems}
  </manifest>
  <spine>
    <itemref idref="cover-page" linear="yes"/>
    ${spineItems}
  </spine>
  <guide>
    <reference type="cover" title="Cover" href="cover.xhtml"/>
  </guide>
</package>`;

  zip.file('OEBPS/content.opf', opfContent);

  const epubBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
  });

  return epubBlob;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
