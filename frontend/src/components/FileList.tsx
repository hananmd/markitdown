import {
  FileText,
  Loader2,
  Download,
  Trash2,
  Play,
  Archive,
  RefreshCw,
} from 'lucide-react';
import type { ConvertedDocument } from '../types';

interface FileListProps {
  documents: ConvertedDocument[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onConvertSingle: (id: string) => void;
  onConvertAll: () => void;
  onDownloadSingle: (doc: ConvertedDocument) => void;
  onDownloadAllZip: () => void;
  onClearAll: () => void;
  isBatchConverting: boolean;
}

export const FileList = ({
  documents,
  selectedId,
  onSelect,
  onRemove,
  onConvertSingle,
  onConvertAll,
  onDownloadSingle,
  onDownloadAllZip,
  onClearAll,
  isBatchConverting,
}: FileListProps) => {
  if (documents.length === 0) {
    return null;
  }

  const completedCount = documents.filter((d) => d.status === 'completed').length;
  const pendingCount = documents.filter((d) => d.status === 'pending' || d.status === 'error').length;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header & Batch Actions */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            Queue ({documents.length} {documents.length === 1 ? 'file' : 'files'})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {completedCount} converted • {pendingCount} pending
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Convert All Button */}
          {pendingCount > 0 && (
            <button
              onClick={onConvertAll}
              disabled={isBatchConverting}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-xs font-medium shadow transition flex items-center space-x-1.5"
            >
              {isBatchConverting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Convert All</span>
                </>
              )}
            </button>
          )}

          {/* Download All as ZIP */}
          {completedCount > 0 && (
            <button
              onClick={onDownloadAllZip}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow transition flex items-center space-x-1.5"
              title="Download all converted files as a ZIP archive"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Download ZIP ({completedCount})</span>
            </button>
          )}

          {/* Clear All */}
          <button
            onClick={onClearAll}
            disabled={isBatchConverting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="Clear Queue"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List items */}
      <div className="divide-y divide-slate-800/60 overflow-y-auto max-h-[480px]">
        {documents.map((doc) => {
          const isSelected = doc.id === selectedId;

          return (
            <div
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                isSelected
                  ? 'bg-blue-600/15 border-l-4 border-l-blue-500'
                  : 'hover:bg-slate-800/40 border-l-4 border-l-transparent'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    doc.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : doc.status === 'error'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                    {doc.name}
                  </p>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{formatSize(doc.size)}</span>

                    {doc.status === 'completed' && doc.wordCount !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">
                          {doc.wordCount.toLocaleString()} words
                        </span>
                        <span>•</span>
                        <span>{doc.durationMs}ms</span>
                      </>
                    )}

                    {doc.status === 'error' && (
                      <>
                        <span>•</span>
                        <span className="text-rose-400 truncate max-w-[140px]" title={doc.error}>
                          {doc.error || 'Failed'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Status & Actions */}
              <div className="flex items-center space-x-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {doc.status === 'pending' && (
                  <button
                    onClick={() => onConvertSingle(doc.id)}
                    disabled={isBatchConverting}
                    className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs flex items-center space-x-1"
                    title="Convert this document"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}

                {doc.status === 'converting' && (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Processing</span>
                  </div>
                )}

                {doc.status === 'completed' && (
                  <>
                    <button
                      onClick={() => onDownloadSingle(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                      title="Download Markdown (.md)"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                )}

                {doc.status === 'error' && (
                  <button
                    onClick={() => onConvertSingle(doc.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                    title="Retry conversion"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => onRemove(doc.id)}
                  disabled={doc.status === 'converting'}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                  title="Remove from queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
