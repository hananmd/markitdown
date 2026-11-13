import { X, ShieldCheck, Zap, Download, Layers } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">About MarkItDown PWA</h3>
            <p className="text-xs text-slate-400">Powered by Microsoft MarkItDown</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <p>
            <strong>MarkItDown PWA</strong> is an open, installable Progressive Web Application designed to turn complex PDF files into clean, readable, GitHub-flavored Markdown (.md) documents.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <Zap className="w-5 h-5 text-amber-400 mb-2" />
              <h4 className="font-semibold text-slate-200">Fast & Batch</h4>
              <p className="text-[11px] text-slate-400 mt-1">Convert single documents or dozens in batch, with instant ZIP download.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
              <h4 className="font-semibold text-slate-200">100% Private</h4>
              <p className="text-[11px] text-slate-400 mt-1">PDFs are processed in-memory. Zero document data is retained on disk.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <Download className="w-5 h-5 text-blue-400 mb-2" />
              <h4 className="font-semibold text-slate-200">Installable PWA</h4>
              <p className="text-[11px] text-slate-400 mt-1">Install to your home screen or desktop dock for an app-like experience.</p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="font-semibold text-slate-200 mb-1">How to Install as App:</h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
              <li><strong>Chrome / Edge:</strong> Click the "Install App" button in the top bar or the install icon in your address bar.</li>
              <li><strong>Android:</strong> Tap the prompt banner or the browser menu (⋮) → "Add to Home screen".</li>
              <li><strong>iOS (Safari):</strong> Tap the Share button (⎋) → "Add to Home Screen".</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
