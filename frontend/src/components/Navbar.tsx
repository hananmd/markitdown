import { FileText, Download, CheckCircle2, HelpCircle } from 'lucide-react';

interface NavbarProps {
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => void;
  isOnline: boolean;
  apiConnected: boolean;
  onOpenHelp: () => void;
}

export const Navbar = ({
  isInstallable,
  isInstalled,
  onInstall,
  isOnline,
  apiConnected,
  onOpenHelp,
}: NavbarProps) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">MarkItDown</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              PDF to Clean Markdown Converter
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Status Indicators */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                !isOnline
                  ? 'bg-amber-400'
                  : apiConnected
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-300">
              {!isOnline ? 'Offline' : apiConnected ? 'Engine Ready' : 'Connecting...'}
            </span>
          </div>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
            title="About & Help"
            aria-label="About & Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Install PWA Button */}
          {isInstallable && (
            <button
              onClick={onInstall}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-blue-500/25 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
          )}

          {isInstalled && (
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Installed</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
