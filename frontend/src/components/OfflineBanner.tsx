import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
}

export const OfflineBanner = ({ isOnline }: OfflineBannerProps) => {
  if (isOnline) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center space-x-2">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>
        <strong>Offline Mode:</strong> You can view existing converted documents. Backend connection is needed to convert new PDF files.
      </span>
    </div>
  );
};
