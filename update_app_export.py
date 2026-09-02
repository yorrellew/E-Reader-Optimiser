import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

single_export_target = r'''    let outputBlob: Blob;

    if (doc.fileType === 'epub') {
      const arrayBuffer = await doc.file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const containerXml = await zip.file('META-INF/container.xml')?.async('text');
      const opfPathMatch = containerXml?.match(/full-path\\s*=\\s*["']([^"']+)["']/i);
      const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';

      if (formatExt === 'txt') {
        outputBlob = await convertEpubToText(zip);
      } else if (formatExt === 'html') {
        outputBlob = await convertEpubToHtml(zip);
      } else {
        outputBlob = await rebuildEpub(
          zip,
          opfPath,
          doc.metadata,
          coverUint8Array,
          coverMimeType,
          doc.typographySettings
        );
      }
    } else {
      if (formatExt === 'txt') {
        outputBlob = new Blob([doc.extractedTextSample || ''], { type: 'text/plain;charset=utf-8' });
      } else {
        const arrayBuffer = await doc.file.arrayBuffer();
        outputBlob = await optimizePdf(
          arrayBuffer,
          doc.metadata,
          coverUint8Array,
          coverMimeType,
          doc.pdfOptions?.coverAction || 'replace_page_1'
        );
      }
    }'''

single_export_replacement = r'''    let outputBlob: Blob;

    if (doc.fileType === 'epub') {
      const arrayBuffer = await doc.file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const containerXml = await zip.file('META-INF/container.xml')?.async('text');
      const opfPathMatch = containerXml?.match(/full-path\s*=\s*["']([^"']+)["']/i);
      const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';

      if (formatExt === 'txt') {
        outputBlob = await convertEpubToText(zip);
      } else if (formatExt === 'html') {
        outputBlob = await convertEpubToHtml(zip);
      } else {
        outputBlob = await rebuildEpub(
          zip,
          opfPath,
          doc.metadata,
          coverUint8Array,
          coverMimeType,
          doc.typographySettings
        );
      }
    } else {
      if (formatExt === 'txt') {
        const parsedPdf = await parsePdf(doc.file);
        outputBlob = new Blob([parsedPdf.extractedPagesText.join('\n\n')], { type: 'text/plain;charset=utf-8' });
      } else if (formatExt === 'html') {
        const parsedPdf = await parsePdf(doc.file);
        const htmlContent = "<html><body>" + parsedPdf.extractedPagesText.map(t => `<p>${t}</p>`).join('<hr/>') + "</body></html>";
        outputBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      } else if (formatExt === 'pdf') {
        const arrayBuffer = await doc.file.arrayBuffer();
        outputBlob = await optimizePdf(
          arrayBuffer,
          doc.metadata,
          coverUint8Array,
          coverMimeType,
          doc.pdfOptions?.coverAction || 'replace_page_1'
        );
      } else {
        const parsedPdf = await parsePdf(doc.file);
        outputBlob = await convertPdfToEpub(
          doc.metadata,
          parsedPdf.extractedPagesText,
          coverUint8Array,
          coverMimeType
        );
      }
    }'''

bulk_export_target = r'''        let outputBlob: Blob;

        if (doc.fileType === 'epub') {
          const arrayBuffer = await doc.file.arrayBuffer();
          const docZip = await JSZip.loadAsync(arrayBuffer);
          const containerXml = await docZip.file('META-INF/container.xml')?.async('text');
          const opfPathMatch = containerXml?.match(/full-path\\s*=\\s*["']([^"']+)["']/i);
          const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';

          if (formatExt === 'txt') {
            outputBlob = await convertEpubToText(docZip);
          } else if (formatExt === 'html') {
            outputBlob = await convertEpubToHtml(docZip);
          } else {
            outputBlob = await rebuildEpub(
              docZip,
              opfPath,
              doc.metadata,
              coverUint8Array,
              coverMimeType,
              doc.typographySettings
            );
          }
        } else {
          if (formatExt === 'txt') {
            outputBlob = new Blob([doc.extractedTextSample || ''], { type: 'text/plain;charset=utf-8' });
          } else {
            const arrayBuffer = await doc.file.arrayBuffer();
            outputBlob = await optimizePdf(
              arrayBuffer,
              doc.metadata,
              coverUint8Array,
              coverMimeType,
              doc.pdfOptions?.coverAction || 'replace_page_1'
            );
          }
        }'''

bulk_export_replacement = r'''        let outputBlob: Blob;

        if (doc.fileType === 'epub') {
          const arrayBuffer = await doc.file.arrayBuffer();
          const docZip = await JSZip.loadAsync(arrayBuffer);
          const containerXml = await docZip.file('META-INF/container.xml')?.async('text');
          const opfPathMatch = containerXml?.match(/full-path\s*=\s*["']([^"']+)["']/i);
          const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';

          if (formatExt === 'txt') {
            outputBlob = await convertEpubToText(docZip);
          } else if (formatExt === 'html') {
            outputBlob = await convertEpubToHtml(docZip);
          } else {
            outputBlob = await rebuildEpub(
              docZip,
              opfPath,
              doc.metadata,
              coverUint8Array,
              coverMimeType,
              doc.typographySettings
            );
          }
        } else {
          if (formatExt === 'txt') {
            const parsedPdf = await parsePdf(doc.file);
            outputBlob = new Blob([parsedPdf.extractedPagesText.join('\n\n')], { type: 'text/plain;charset=utf-8' });
          } else if (formatExt === 'html') {
            const parsedPdf = await parsePdf(doc.file);
            const htmlContent = "<html><body>" + parsedPdf.extractedPagesText.map(t => `<p>${t}</p>`).join('<hr/>') + "</body></html>";
            outputBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          } else if (formatExt === 'pdf') {
            const arrayBuffer = await doc.file.arrayBuffer();
            outputBlob = await optimizePdf(
              arrayBuffer,
              doc.metadata,
              coverUint8Array,
              coverMimeType,
              doc.pdfOptions?.coverAction || 'replace_page_1'
            );
          } else {
            const parsedPdf = await parsePdf(doc.file);
            outputBlob = await convertPdfToEpub(
              doc.metadata,
              parsedPdf.extractedPagesText,
              coverUint8Array,
              coverMimeType
            );
          }
        }'''

# Note: We also need to remove the override of formatExt.
# Target: `const formatExt = targetFormat === 'epub' && doc.fileType === 'pdf' ? 'pdf' : targetFormat;`
# Replacement: `const formatExt = targetFormat;`

content = re.sub(r'const formatExt = targetFormat === \'epub\' && doc\.fileType === \'pdf\' \? \'pdf\' : targetFormat;', 'const formatExt = targetFormat;', content)
# For the bulk export
content = re.sub(r'const formatExt = targetFormat === \'epub\' && doc\.fileType === \'pdf\' \? \'pdf\' : targetFormat;', 'const formatExt = targetFormat;', content)

# I have to handle double escaping properly, let me just use normal string replaces instead of regex for the big blocks.
