with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

single_target = """    let outputBlob: Blob;

    if (doc.fileType === 'epub') {
      const arrayBuffer = await doc.file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const containerXml = await zip.file('META-INF/container.xml')?.async('text');
      const opfPathMatch = containerXml?.match(/full-path\s*=\s*["']([^"']+)["']/i);
      const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';

      outputBlob = await rebuildEpub(
        zip,
        opfPath,
        doc.metadata,
        coverUint8Array,
        coverMimeType,
        doc.typographySettings
      );
    } else {
      // PDF handling
      const arrayBuffer = await doc.file.arrayBuffer();
      outputBlob = await optimizePdf(
        arrayBuffer,
        doc.metadata,
        coverUint8Array,
        coverMimeType,
        doc.pdfOptions?.coverAction || 'replace_page_1'
      );
    }"""

single_replacement = """    let outputBlob: Blob;

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
    }"""

bulk_target = """        let outputBlob: Blob;

        if (doc.fileType === 'epub') {
          const arrayBuffer = await doc.file.arrayBuffer();
          const docZip = await JSZip.loadAsync(arrayBuffer);
          const containerXml = await docZip.file('META-INF/container.xml')?.async('text');
          const opfPathMatch = containerXml?.match(/full-path\s*=\s*["']([^"']+)["']/i);
          const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';

          outputBlob = await rebuildEpub(
            docZip,
            opfPath,
            doc.metadata,
            coverUint8Array,
            coverMimeType,
            doc.typographySettings
          );
        } else {
          const arrayBuffer = await doc.file.arrayBuffer();
          outputBlob = await optimizePdf(
            arrayBuffer,
            doc.metadata,
            coverUint8Array,
            coverMimeType,
            doc.pdfOptions?.coverAction || 'replace_page_1'
          );
        }"""

bulk_replacement = """        let outputBlob: Blob;

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
        }"""

content = content.replace(single_target, single_replacement)
content = content.replace(bulk_target, bulk_replacement)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
