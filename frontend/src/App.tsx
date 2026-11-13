import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dropzone } from './components/Dropzone';
import { FileList } from './components/FileList';
import { MarkdownPreview } from './components/MarkdownPreview';
import { OfflineBanner } from './components/OfflineBanner';
import { HelpModal } from './components/HelpModal';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import type { ConvertedDocument } from './types';
import {
  getHealthInfo,
  convertSinglePdf,
  downloadZipArchive,
  downloadTextFile,
} from './services/api';
import { Sparkles, Check, Cpu, Zap, Shield, Smartphone } from 'lucide-react';

export function App() {
  const [documents, setDocuments] = useState<ConvertedDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isBatchConverting, setIsBatchConverting] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();
  const isOnline = useNetworkStatus();

  // Test backend connection on mount
  useEffect(() => {
    let isMounted = true;
    const checkConnection = async () => {
      try {
        await getHealthInfo();
        if (isMounted) setApiConnected(true);
      } catch {
        if (isMounted) setApiConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add files to queue
  const handleFilesSelected = (files: File[]) => {
    const newDocs: ConvertedDocument[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
    }));

    setDocuments((prev) => [...prev, ...newDocs]);
    if (!selectedId && newDocs.length > 0) {
      setSelectedId(newDocs[0].id);
    }
    showToast(`Added ${newDocs.length} ${newDocs.length === 1 ? 'file' : 'files'} to queue.`);
  };

  // Convert a single document
  const handleConvertSingle = useCallback(async (id: string) => {
    const docToConvert = documents.find((d) => d.id === id);
    if (!docToConvert) return;

    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'converting', error: undefined } : d))
    );
    setSelectedId(id);

    try {
      const result = await convertSinglePdf(docToConvert.file);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: 'completed',
                markdownContent: result.content,
                markdownFilename: result.markdown_filename,
                title: result.title,
                wordCount: result.word_count,
                charCount: result.char_count,
                lineCount: result.line_count,
                durationMs: result.duration_ms,
              }
            : d
        )
      );
      showToast(`Successfully converted '${docToConvert.name}'`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Conversion failed';
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: 'error',
                error: errMsg,
              }
            : d
        )
      );
      showToast(`Error converting '${docToConvert.name}': ${errMsg}`);
    }
  }, [documents]);

  // Convert all pending documents
  const handleConvertAll = async () => {
    const pendingDocs = documents.filter((d) => d.status === 'pending' || d.status === 'error');
    if (pendingDocs.length === 0) return;

    setIsBatchConverting(true);

    for (const doc of pendingDocs) {
      await handleConvertSingle(doc.id);
    }

    setIsBatchConverting(false);
    showToast('Batch conversion complete!');
  };

  // Try with Sample PDF
  const handleLoadSample = async () => {
    try {
      const res = await fetch('/api/sample');
      if (!res.ok) throw new Error('Could not fetch sample document');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'MarkItDown_Sample_Guide.pdf', {
        type: 'application/pdf',
      });

      const sampleDoc: ConvertedDocument = {
        id: `sample-${Date.now()}`,
        file: sampleFile,
        name: sampleFile.name,
        size: sampleFile.size,
        status: 'pending',
      };

      setDocuments((prev) => [sampleDoc, ...prev]);
      setSelectedId(sampleDoc.id);

      // Auto-trigger conversion for delight
      setTimeout(() => {
        handleConvertSingle(sampleDoc.id);
      }, 100);
    } catch (err) {
      console.error('Failed to load sample PDF', err);
      showToast('Could not load sample PDF.');
    }
  };

  // Remove document from queue
  const handleRemove = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (selectedId === id) {
      const remaining = documents.filter((d) => d.id !== id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Clear queue
  const handleClearAll = () => {
    setDocuments([]);
    setSelectedId(null);
    showToast('Queue cleared.');
  };

  // Download single markdown
  const handleDownloadSingle = (doc: ConvertedDocument) => {
    if (!doc.markdownContent) return;
    const filename = doc.markdownFilename || `${doc.name.replace(/\.[^/.]+$/, '')}.md`;
    downloadTextFile(doc.markdownContent, filename);
  };

  // Download all completed as ZIP
  const handleDownloadAllZip = async () => {
    const completedDocs = documents.filter((d) => d.status === 'completed' && d.markdownContent);
    if (completedDocs.length === 0) return;

    try {
      showToast('Preparing ZIP archive...');
      await downloadZipArchive(
        completedDocs.map((d) => ({
          markdown_filename: d.markdownFilename || `${d.name.replace(/\.[^/.]+$/, '')}.md`,
          content: d.markdownContent || '',
          word_count: d.wordCount,
          duration_ms: d.durationMs,
        }))
      );
      showToast('ZIP archive downloaded!');
    } catch (err) {
      console.error(err);
      showToast('Failed to download ZIP archive.');
    }
  };

  const selectedDocument = documents.find((d) => d.id === selectedId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstall={promptInstall}
        isOnline={isOnline}
        apiConnected={apiConnected}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <OfflineBanner isOnline={isOnline} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col space-y-6">
        {/* Hero Section */}
        <section className="text-center py-2 sm:py-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powered by Microsoft MarkItDown Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Convert PDFs to Clean{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Markdown
            </span>
          </h1>
          <p className="mt-2 text-xs sm:text-base text-slate-400 max-w-2xl mx-auto">
            Lightweight, installable Progressive Web Application. Fast batch processing, in-memory privacy, and instant formatted previews.
          </p>
        </section>

        {/* Dropzone Area */}
        <section>
          <Dropzone
            onFilesSelected={handleFilesSelected}
            onLoadSample={handleLoadSample}
            isConverting={isBatchConverting}
          />
        </section>

        {/* Workspace: File List + Markdown Preview */}
        {documents.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Queue (4 cols) */}
            <div className="lg:col-span-5 w-full">
              <FileList
                documents={documents}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
                onRemove={handleRemove}
                onConvertSingle={handleConvertSingle}
                onConvertAll={handleConvertAll}
                onDownloadSingle={handleDownloadSingle}
                onDownloadAllZip={handleDownloadAllZip}
                onClearAll={handleClearAll}
                isBatchConverting={isBatchConverting}
              />
            </div>

            {/* Right Preview (7 cols) */}
            <div className="lg:col-span-7 w-full h-[600px]">
              <MarkdownPreview
                document={selectedDocument}
                onDownload={handleDownloadSingle}
              />
            </div>
          </section>
        )}

        {/* Features Grid (Shown when queue is empty or below) */}
        {documents.length === 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">Microsoft MarkItDown</h4>
              <p className="text-xs text-slate-400 mt-1">
                Preserves document semantics, headings, tables, bullet points, and code formatting.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">Batch Processing</h4>
              <p className="text-xs text-slate-400 mt-1">
                Queue multiple documents at once and export all converted Markdown files in a ZIP archive.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">100% Private</h4>
              <p className="text-xs text-slate-400 mt-1">
                Zero document retention. All conversions run in-memory with strict input validation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">Installable PWA</h4>
              <p className="text-xs text-slate-400 mt-1">
                Install as a standalone app across Android, iOS, Windows, and macOS with service worker caching.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>MarkItDown PWA • Powered by Microsoft MarkItDown & FastAPI</p>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="hover:text-slate-300 transition"
            >
              Docs & Help
            </button>
            <span>•</span>
            <span className="text-emerald-400/80 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span>Offline Ready</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm shadow-xl animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

export default App;
