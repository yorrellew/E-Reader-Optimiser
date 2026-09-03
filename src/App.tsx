/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { BookDocument, EinkPreset, BookMetadata } from './types';
import { EINK_DEVICE_PRESETS, DEFAULT_COVER_TUNING } from './utils/presets';
import { parseEpub, rebuildEpub, convertEpubToText, convertEpubToHtml } from './utils/epubEngine';
import { parsePdf, optimizePdf, convertPdfToEpub } from './utils/pdfEngine';
import { processCoverImage } from './utils/coverImageProcessor';
import { formatFilename } from './utils/filenameFormatter';
import { createSampleEpub, createSamplePdf } from './utils/sampleGenerator';

import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { DocumentList } from './components/DocumentList';
import { DocumentDetailEditor } from './components/DocumentDetailEditor';
import { BatchToolbar } from './components/BatchToolbar';
import { CoverSearchModal } from './components/CoverSearchModal';
import { TypographyCoverModal } from './components/TypographyCoverModal';
import { EinkGuideModal } from './components/EinkGuideModal';
import { BookOpen, Sparkles, CheckCircle2, ShieldCheck, Layers, FileArchive, RefreshCw } from 'lucide-react';

export default function App() {
  const [documents, setDocuments] = useState<BookDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [currentPreset, setCurrentPreset] = useState<EinkPreset>(EINK_DEVICE_PRESETS[0]); // Universal E-Reader Default
  const [renamingPattern, setRenamingPattern] = useState<string>('{author} - {title}');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [targetFormat, setTargetFormat] = useState<string>('epub');
  const [compressionLevel, setCompressionLevel] = useState<number>(6);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; filename: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [isCoverSearchOpen, setIsCoverSearchOpen] = useState(false);
  const [isTypographyModalOpen, setIsTypographyModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const selectedDocument = documents.find((doc) => doc.id === selectedDocId) || null;

  // Process uploaded files (EPUB and PDF) - supporting single or bulk selection
  const handleFilesSelected = async (files: File[] | FileList) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setIsProcessing(true);
    const newDocs: BookDocument[] = [];
    const failedFiles: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      const id = `${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`;

      setUploadProgress({
        current: i + 1,
        total: fileList.length,
        filename: file.name,
      });

      try {
        if (ext === 'epub') {
          const parsed = await parseEpub(file);
          newDocs.push({
            id,
            file,
            originalName: file.name,
            fileType: 'epub',
            fileSize: file.size,
            metadata: parsed.metadata,
            originalMetadata: { ...parsed.metadata },
            coverDataUrl: parsed.coverDataUrl,
            originalCoverDataUrl: parsed.coverDataUrl,
            coverMimeType: parsed.coverMimeType || 'image/jpeg',
            coverSource: parsed.coverDataUrl ? 'extracted' : 'none',
            coverTuning: { ...DEFAULT_COVER_TUNING },
            chapters: parsed.chapters,
            status: 'ready',
            extractedTextSample: parsed.sampleText,
          });
        } else if (ext === 'pdf') {
          const parsed = await parsePdf(file);
          newDocs.push({
            id,
            file,
            originalName: file.name,
            fileType: 'pdf',
            fileSize: file.size,
            metadata: parsed.metadata,
            originalMetadata: { ...parsed.metadata },
            coverDataUrl: parsed.coverDataUrl,
            originalCoverDataUrl: parsed.coverDataUrl,
            coverMimeType: parsed.coverMimeType || 'image/jpeg',
            coverSource: parsed.coverDataUrl ? 'pdf_page' : 'none',
            coverTuning: { ...DEFAULT_COVER_TUNING },
            status: 'ready',
            pageCount: parsed.pageCount,
            extractedTextSample: parsed.sampleText,
            pdfOptions: {
              coverAction: 'replace_page_1',
              optimizeStream: true,
            },
          });
        }
      } catch (err) {
        console.error(`Error parsing file ${file.name}:`, err);
        failedFiles.push(file.name);
      }
    }

    if (failedFiles.length > 0) {
      alert(`Could not parse ${failedFiles.length} file(s):\n${failedFiles.join('\n')}\nPlease ensure they are valid EPUB or PDF files.`);
    }

    if (newDocs.length > 0) {
      setDocuments((prev) => [...prev, ...newDocs]);
      if (!selectedDocId) {
        setSelectedDocId(newDocs[0].id);
      }
      setSelectedBatchIds((prev) => [...prev, ...newDocs.map((d) => d.id)]);
    }

    setUploadProgress(null);
    setIsProcessing(false);
  };

  // Sample Loaders
  const handleLoadSampleEpub = async () => {
    setIsProcessing(true);
    try {
      const sample = await createSampleEpub();
      await handleFilesSelected([sample]);
    } catch (err) {
      console.error('Error loading sample EPUB:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSamplePdf = async () => {
    setIsProcessing(true);
    try {
      const sample = await createSamplePdf();
      await handleFilesSelected([sample]);
    } catch (err) {
      console.error('Error loading sample PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleBatch = async () => {
    setIsProcessing(true);
    try {
      const [sampleEpub, samplePdf] = await Promise.all([
        createSampleEpub(),
        createSamplePdf(),
      ]);
      await handleFilesSelected([sampleEpub, samplePdf]);
    } catch (err) {
      console.error('Error loading sample batch:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Document management
  const handleUpdateDocument = (updated: BookDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedBatchIds((prev) => prev.filter((bId) => bId !== id));
    if (selectedDocId === id) {
      const remaining = documents.filter((d) => d.id !== id);
      setSelectedDocId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleToggleBatchSelect = (id: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllBatch = (select: boolean) => {
    if (select) {
      setSelectedBatchIds(documents.map((d) => d.id));
    } else {
      setSelectedBatchIds([]);
    }
  };

  // Save and Download single document
  const handleSaveAndDownload = async (doc: BookDocument): Promise<void> => {
    const formatExt = targetFormat;
    const filename = formatFilename(renamingPattern, doc.metadata, formatExt);

    // 1. Process cover image with e-ink tuning
    let coverUint8Array: Uint8Array | null = null;
    let coverMimeType = doc.coverMimeType || 'image/jpeg';

    if (doc.coverDataUrl) {
      const processed = await processCoverImage(
        doc.coverDataUrl,
        doc.coverTuning,
        currentPreset.id
      );
      coverUint8Array = processed.uint8Array;
      coverMimeType = processed.mimeType;
    }

    let outputBlob: Blob;

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
    }

    // Trigger browser download
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Trigger success confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.85 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#1c1917'],
    });
  };

  // Bulk Export all as ZIP
  const handleBulkDownload = async () => {
    if (documents.length === 0) return;
    setIsProcessing(true);

    try {
      const zip = new JSZip();
      const docsToExport =
        selectedBatchIds.length > 0
          ? documents.filter((d) => selectedBatchIds.includes(d.id))
          : documents;

      for (const doc of docsToExport) {
        // Output extension overrides to target format (if user wants kepub/azw3 wrapper trick)
        const formatExt = targetFormat;
        const filename = formatFilename(renamingPattern, doc.metadata, formatExt);

        let coverUint8Array: Uint8Array | null = null;
        let coverMimeType = doc.coverMimeType || 'image/jpeg';

        if (doc.coverDataUrl) {
          const processed = await processCoverImage(
            doc.coverDataUrl,
            doc.coverTuning,
            currentPreset.id
          );
          coverUint8Array = processed.uint8Array;
          coverMimeType = processed.mimeType;
        }

        let outputBlob: Blob;

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
        }

        zip.file(filename, outputBlob);
      }

      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: compressionLevel > 0 ? 'DEFLATE' : 'STORE',
        compressionOptions: {
          level: compressionLevel > 0 ? compressionLevel : undefined
        }
      });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ereader_Optimized_Books_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('Bulk download error:', err);
      alert('An error occurred during bulk packaging.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply universal features
  const handleApplyUniversal = () => {
    if (!selectedDocId || documents.length <= 1) {
      alert("Please select an active document to copy its metadata and settings to all other documents.");
      return;
    }
    
    if (confirm("Apply the currently selected document's Author, Series, Publisher, and Cover Settings to ALL documents?")) {
      const sourceDoc = documents.find(d => d.id === selectedDocId);
      if (!sourceDoc) return;
      
      setDocuments(docs => docs.map(doc => {
        if (doc.id === selectedDocId) return doc;
        return {
          ...doc,
          metadata: {
            ...doc.metadata,
            authors: sourceDoc.metadata.authors,
            series: sourceDoc.metadata.series,
            publisher: sourceDoc.metadata.publisher
          },
          coverTuning: { ...sourceDoc.coverTuning },
          typographySettings: { ...sourceDoc.typographySettings },
          status: 'modified'
        };
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Hidden input for multi-file bulk uploads */}
      <input
        type="file"
        multiple
        accept=".epub,.pdf,application/epub+zip,application/pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(Array.from(e.target.files));
          }
          // Reset value to allow selecting the same files again
          e.target.value = '';
        }}
      />
      {/* Hidden input for folder uploads */}
      <input
        type="file"
        multiple
        {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        className="hidden"
        ref={folderInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(Array.from(e.target.files));
          }
          e.target.value = '';
        }}
      />
      {/* Top Header */}
      <Header
        currentPreset={currentPreset}
        onSelectPreset={setCurrentPreset}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onLoadSample={handleLoadSampleEpub}
        documentCount={documents.length}
      />

      {/* Main App Layout */}
      <main className="flex-1 flex flex-col">
        {documents.length === 0 ? (
          // Empty state: Hero & Dropzone
          <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center gap-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/30 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Converts and Fixes PDFs, Missing Covers and Formatting Issues for E-Readers</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-sans">
                E-Reader Document Editor & Cover Fixer
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 font-serif max-w-2xl mx-auto leading-relaxed">
                Clean messy filenames, inject missing cover art, format author and series tags, and optimize contrast specifically for e-ink screens.
              </p>
            </div>

            {/* Dropzone */}
            <Dropzone
              onFilesSelected={handleFilesSelected}
              onLoadSampleEpub={handleLoadSampleEpub}
              onLoadSamplePdf={handleLoadSamplePdf}
              isProcessing={isProcessing}
            />

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-[#111114] border border-white/10 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white font-sans">Universal EPUB 2/3 Fixes</h4>
                <p className="text-xs text-zinc-400 font-serif leading-normal">
                  Injects dual manifest tags, zero-margin cover pages, and uncompressed mimetype headers for 100% cover display.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111114] border border-white/10 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white font-sans">Global Cover Search</h4>
                <p className="text-xs text-zinc-400 font-serif leading-normal">
                  Searches Google Books & OpenLibrary for high-res art, or generates custom vector typography covers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111114] border border-white/10 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white font-sans">PDF & E-Ink Optimizer</h4>
                <p className="text-xs text-zinc-400 font-serif leading-normal">
                  Prepend crisp covers to PDFs, apply 16-level grayscale or Atkinson dithering for paper-white clarity.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Active Workbench with Queue Sidebar & Editor
          <div className="flex-1 flex flex-col">
            {/* Batch Control Toolbar */}
            <div className="p-3 border-b border-white/10 bg-[#111114]">
              <div className="max-w-7xl mx-auto">
                <BatchToolbar
                  documentCount={documents.length}
                  selectedBatchCount={selectedBatchIds.length}
                  renamingPattern={renamingPattern}
                  onSelectRenamingPattern={setRenamingPattern}
                  targetFormat={targetFormat}
                  onTargetFormatChange={setTargetFormat}
                  compressionLevel={compressionLevel}
                  onCompressionLevelChange={setCompressionLevel}
                  onAddMoreFiles={() => fileInputRef.current?.click()}
                  onAddFolder={() => folderInputRef.current?.click()}
                  onLoadSampleBatch={handleLoadSampleBatch}
                  onFilesSelected={handleFilesSelected}
                  onApplyUniversal={handleApplyUniversal}
                  onBulkDownload={handleBulkDownload}
                  onClearAll={() => {
                    if (confirm('Clear all uploaded documents?')) {
                      setDocuments([]);
                      setSelectedDocId(null);
                      setSelectedBatchIds([]);
                    }
                  }}
                  isProcessing={isProcessing}
                />
              </div>
            </div>

            {/* Split Screen: Left List, Right Editor */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Left Column: Document Queue */}
              <div className="lg:col-span-4 xl:col-span-3 h-[400px] lg:h-auto overflow-y-auto">
                <DocumentList
                  documents={documents}
                  selectedDocId={selectedDocId}
                  onSelectDoc={setSelectedDocId}
                  onRemoveDoc={handleRemoveDocument}
                  selectedBatchIds={selectedBatchIds}
                  onToggleBatchSelect={handleToggleBatchSelect}
                  onSelectAllBatch={handleSelectAllBatch}
                  renamingPattern={renamingPattern}
                />

                {/* Quick Add More Dropzone at Bottom of List */}
                <div className="p-3 bg-[#111114] border-t border-white/10">
                  <label className="block w-full py-2.5 px-3 rounded-xl border border-dashed border-white/10 hover:border-blue-500 bg-[#16161a] hover:bg-[#1c1c22] text-center text-xs font-semibold text-zinc-300 cursor-pointer transition-colors">
                    <input
                      type="file"
                      multiple
                      accept=".epub,.pdf,application/epub+zip,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFilesSelected(Array.from(e.target.files));
                          e.target.value = '';
                        }
                      }}
                      className="hidden"
                    />
                    <span>+ Bulk Upload More Books (EPUB / PDF)</span>
                  </label>
                </div>
              </div>

              {/* Right Column: Active Document Editor */}
              <div className="lg:col-span-8 xl:col-span-9 h-full overflow-hidden flex flex-col">
                {selectedDocument ? (
                  <DocumentDetailEditor
                    document={selectedDocument}
                    onUpdateDocument={handleUpdateDocument}
                    onSaveAndDownload={handleSaveAndDownload}
                    onOpenCoverSearch={() => setIsCoverSearchOpen(true)}
                    onOpenTypographyModal={() => setIsTypographyModalOpen(true)}
                    currentPreset={currentPreset}
                    onSelectPreset={setCurrentPreset}
                    renamingPattern={renamingPattern}
                    targetFormat={targetFormat}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8 text-zinc-500">
                    Select a document from the queue on the left
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Modals */}
      {selectedDocument && (
        <>
          <CoverSearchModal
            isOpen={isCoverSearchOpen}
            onClose={() => setIsCoverSearchOpen(false)}
            defaultQuery={`${selectedDocument.metadata.title} ${selectedDocument.metadata.authors?.[0] || ''}`.trim()}
            onSelectCoverAndMetadata={(coverUrl, meta) => {
              handleUpdateDocument({
                ...selectedDocument,
                coverDataUrl: coverUrl,
                coverSource: 'searched',
                metadata: meta
                  ? {
                      ...selectedDocument.metadata,
                      ...meta,
                    }
                  : selectedDocument.metadata,
                status: 'modified',
              });
            }}
          />

          <TypographyCoverModal
            isOpen={isTypographyModalOpen}
            onClose={() => setIsTypographyModalOpen(false)}
            initialTitle={selectedDocument.metadata.title}
            initialAuthor={selectedDocument.metadata.authors?.[0] || ''}
            initialSeries={selectedDocument.metadata.series}
            initialSeriesIndex={selectedDocument.metadata.seriesIndex}
            onApplyCover={(dataUrl) => {
              handleUpdateDocument({
                ...selectedDocument,
                coverDataUrl: dataUrl,
                coverSource: 'generated',
                status: 'modified',
              });
            }}
          />
        </>
      )}

      <EinkGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Bulk Upload Progress Toast */}
      {uploadProgress && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#16161a] border border-blue-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-md">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
              <span>Bulk Importing Books</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                {uploadProgress.current} / {uploadProgress.total}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 max-w-xs truncate font-serif mt-0.5">
              {uploadProgress.filename}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
