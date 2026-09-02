with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

single_target = """    } else {
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

single_replace = """    } else {
      if (formatExt === 'txt') {
        const parsedPdf = await parsePdf(doc.file);
        outputBlob = new Blob([parsedPdf.extractedPagesText.join('\\n\\n')], { type: 'text/plain;charset=utf-8' });
      } else if (formatExt === 'html') {
        const parsedPdf = await parsePdf(doc.file);
        const htmlContent = "<html><body>" + parsedPdf.extractedPagesText.map((t: string) => `<p>${t}</p>`).join('<hr/>') + "</body></html>";
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
    }"""

bulk_target = """        } else {
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

bulk_replace = """        } else {
          if (formatExt === 'txt') {
            const parsedPdf = await parsePdf(doc.file);
            outputBlob = new Blob([parsedPdf.extractedPagesText.join('\\n\\n')], { type: 'text/plain;charset=utf-8' });
          } else if (formatExt === 'html') {
            const parsedPdf = await parsePdf(doc.file);
            const htmlContent = "<html><body>" + parsedPdf.extractedPagesText.map((t: string) => `<p>${t}</p>`).join('<hr/>') + "</body></html>";
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
        }"""

content = content.replace(single_target, single_replace)
content = content.replace(bulk_target, bulk_replace)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Logic replaced.")
