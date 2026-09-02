import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateTypographyCover } from './coverImageProcessor';

/**
 * Creates a sample EPUB file with messy/raw filenames and missing cover tags to demonstrate auto-fixing.
 */
export async function createSampleEpub(): Promise<File> {
  const zip = new JSZip();

  // 1. Uncompressed mimetype
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // Generate a sample cover
  const coverDataUrl = await generateTypographyCover({
    title: 'The Time Machine',
    author: 'H. G. Wells',
    subtitle: 'An Invention That Defied Eternity',
    series: 'Scientific Romances',
    seriesIndex: '1',
    style: 'vintage_ornate',
    backgroundColor: '#1b263b',
    textColor: '#e0e1dd',
    accentColor: '#e0a96d',
    borderStyle: 'ornate_double',
  });

  const base64Data = coverDataUrl.split(',')[1];
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  zip.file('images/cover.jpg', bytes);

  // 3. content.opf with typical messy metadata
  zip.file(
    'content.opf',
    `<?xml version="1.0" encoding="utf-8"?>
<package version="2.0" unique-identifier="BookId" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>The Time Machine [v1.2_retail_scan]</dc:title>
    <dc:creator>Wells, Herbert George</dc:creator>
    <dc:description>The Time Traveller, a Victorian scientist, constructs a machine capable of moving through the fourth dimension, journeying to the year 802,701 AD where he discovers humanity split into the gentle Eloi and subterranean Morlocks.</dc:description>
    <dc:language>en</dc:language>
    <dc:publisher>Heinemann (Original)</dc:publisher>
    <dc:date>1895</dc:date>
    <dc:subject>Science Fiction</dc:subject>
    <dc:subject>Time Travel</dc:subject>
    <dc:identifier id="BookId">urn:uuid:98a21199-5284-46c5-84e1-255d61483321</dc:identifier>
  </metadata>
  <manifest>
    <item id="chap1" href="chap1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chap1"/>
  </spine>
</package>`
  );

  // 4. Sample chapter
  zip.file(
    'chap1.xhtml',
    `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Chapter I</title>
  <style>
    body { font-family: serif; line-height: 1.6; margin: 5%; }
    h1 { text-align: center; margin-bottom: 2rem; }
    p { text-indent: 1.5em; margin: 0 0 0.8em; }
  </style>
</head>
<body>
  <h1>Chapter I</h1>
  <p>The Time Traveller was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated.</p>
  <p>"You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, that you were taught in school is founded on a misconception."</p>
  <p>"Is not that rather a large thing to expect us to begin upon?" said Filby, an argumentative person with red hair.</p>
  <p>"I do not mean to ask you to accept anything without reasonable ground for it. You will soon admit as much as I need from you. You know of course that a mathematical line, a line of thickness nil, has no real existence."</p>
</body>
</html>`
  );

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
  });

  return new File([blob], 'The.Time.Machine.H.G.Wells[v1.0_retail].epub', {
    type: 'application/epub+zip',
  });
}

/**
 * Creates a sample PDF file for testing PDF metadata extraction and cover optimization.
 */
export async function createSamplePdf(): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText('THE ART OF WAR', {
    x: 50,
    y: 700,
    size: 32,
    font: font,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText('Sun Tzu (Translated by Lionel Giles)', {
    x: 50,
    y: 650,
    size: 16,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText('I. LAYING PLANS', {
    x: 50,
    y: 580,
    size: 18,
    font: font,
    color: rgb(0.15, 0.15, 0.15),
  });

  const textLines = [
    '1. Sun Tzu said: The art of war is of vital importance to the State.',
    '2. It is a matter of life and death, a road either to safety or to ruin.',
    'Hence it is a subject of inquiry which can on no account be neglected.',
    '3. The art of war, then, is governed by five constant factors, to be taken into',
    'account in one\'s deliberations, when seeking to determine the conditions.',
  ];

  let y = 540;
  for (const line of textLines) {
    page.drawText(line, {
      x: 50,
      y: y,
      size: 12,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 25;
  }

  pdfDoc.setTitle('The Art of War [Unedited PDF Document]');
  pdfDoc.setAuthor('Sun Tzu');
  pdfDoc.setSubject('Ancient Military Strategy and Philosophy');

  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes], 'Art_of_War_Sun_Tzu_Scan_Document.pdf', {
    type: 'application/pdf',
  });
}
