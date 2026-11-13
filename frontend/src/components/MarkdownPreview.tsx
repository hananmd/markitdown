import { useState, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Copy,
  Check,
  Download,
  FileCode,
  Eye,
  Columns,
  Clock,
  Type,
  FileText,
} from 'lucide-react';
import type { ConvertedDocument } from '../types';

interface MarkdownPreviewProps {
  document: ConvertedDocument | null;
  onDownload: (doc: ConvertedDocument) => void;
}

type ViewMode = 'preview' | 'raw' | 'split';

export const MarkdownPreview = ({
  document,
  onDownload,
}: MarkdownPreviewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [copied, setCopied] = useState(false);

  // Render markdown with DOMPurify sanitization
  const renderedHtml = useMemo(() => {
    if (!document?.markdownContent) return '';
    try {
      const rawHtml = marked.parse(document.markdownContent, {
        gfm: true,
        breaks: true,
      });
      return DOMPurify.sanitize(rawHtml as string);
    } catch (e) {
      console.error('Failed to parse markdown', e);
      return '<p class="text-rose-400">Failed to render markdown content.</p>';
    }
  }, [document?.markdownContent]);

  const handleCopy = async () => {
    if (!document?.markdownContent) return;
    try {
      await navigator.clipboard.writeText(document.markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  if (!document) {
    return (
      <div className="h-full min-h-[460px] flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-500 flex items-center justify-center mb-4">
          <FileCode className="w-7 h-7" />
        </div>
        <h3 className="text-base font-medium text-slate-300">
          No Document Selected
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1">
          Upload a PDF and select it to inspect the clean converted Markdown, syntax preview, and metrics.
        </p>
      </div>
    );
  }

  if (document.status === 'converting') {
    return (
      <div className="h-full min-h-[460px] flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-4" />
        <h3 className="text-base font-medium text-slate-200">
          Converting '{document.name}'
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Microsoft MarkItDown is extracting headings, paragraphs, and structure...
        </p>
      </div>
    );
  }

  if (document.status === 'error') {
    return (
      <div className="h-full min-h-[460px] flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-rose-900/30 rounded-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-rose-300">
          Conversion Failed
        </h3>
        <p className="text-xs text-slate-400 max-w-md mt-2">
          {document.error || 'An unexpected error occurred while processing this PDF.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Top Header & Actions */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold text-slate-100 truncate max-w-xs sm:max-w-md">
              {document.markdownFilename || `${document.name}.md`}
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Ready
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
            <span className="flex items-center space-x-1">
              <Type className="w-3.5 h-3.5 text-slate-500" />
              <span>{document.wordCount?.toLocaleString() || 0} words</span>
            </span>
            <span>•</span>
            <span>{document.charCount?.toLocaleString() || 0} chars</span>
            <span>•</span>
            <span>{document.lineCount || 0} lines</span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-blue-400">
              <Clock className="w-3 h-3" />
              <span>{document.durationMs || 0}ms</span>
            </span>
          </div>
        </div>

        {/* View Mode & Buttons */}
        <div className="flex items-center space-x-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition ${
                viewMode === 'preview'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rendered HTML Preview"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rendered</span>
            </button>

            <button
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition ${
                viewMode === 'raw'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Raw Markdown"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Raw</span>
            </button>

            <button
              onClick={() => setViewMode('split')}
              className={`hidden lg:flex px-2.5 py-1 rounded-md items-center space-x-1.5 transition ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition flex items-center space-x-1.5"
            title="Copy Markdown to Clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Download Button */}
          <button
            onClick={() => onDownload(document)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/50">
        {viewMode === 'preview' && (
          <div
            className="markdown-body max-w-4xl mx-auto"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )}

        {viewMode === 'raw' && (
          <pre className="text-xs sm:text-sm font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
            {document.markdownContent}
          </pre>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="h-full overflow-y-auto pr-2">
              <h4 className="text-xs uppercase font-semibold text-slate-400 mb-2">
                Raw Markdown
              </h4>
              <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
                {document.markdownContent}
              </pre>
            </div>
            <div className="h-full overflow-y-auto pl-2 border-l border-slate-800">
              <h4 className="text-xs uppercase font-semibold text-slate-400 mb-2">
                Rendered Preview
              </h4>
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
