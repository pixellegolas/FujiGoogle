import React from 'react';
import { Images, Sliders, Info, Disc } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  photoCount: number;
  activeFolderName: string;
  onOpenGallery: () => void;
  onOpenSettings: () => void;
  isProcessing: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  photoCount,
  activeFolderName,
  onOpenGallery,
  onOpenSettings,
  isProcessing,
}) => {
  return (
    <header
      id="camera-top-bar"
      className="relative z-20 w-full bg-black border-b border-white/10 px-3 sm:px-4 py-2.5 flex items-center justify-between select-none"
      style={{ paddingTop: 'calc(0.6rem + env(safe-area-inset-top, 0px))' }}
    >
      {/* Brand logo */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-black" />
        </div>
        <h1 className="font-mono text-xs sm:text-sm font-bold tracking-[0.25em] text-white">
          FUJICAM
        </h1>
      </div>

      {/* Center status / Processing indicator */}
      {isProcessing && (
        <div className="flex items-center gap-1 text-[10px] font-mono text-white/90 bg-neutral-900 border border-white/20 px-2 py-0.5 rounded animate-pulse">
          <Disc className="w-3 h-3 animate-spin" />
          <span>FRAMKALLAR FILM...</span>
        </div>
      )}

      {/* Right controls: Install PWA, Gallery, Settings */}
      <div className="flex items-center gap-2">
        <PWAInstallButton />

        {/* Gallery shortcut */}
        <button
          onClick={onOpenGallery}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-white/20 hover:border-white text-white font-mono text-xs transition cursor-pointer"
          title="Öppna Galleri"
        >
          <Images className="w-3.5 h-3.5" />
          <span className="font-bold">{photoCount}</span>
          <span className="hidden sm:inline text-[10px] text-neutral-400">EXP</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-white/20 hover:border-white text-white transition cursor-pointer"
          title="Kamera- & filterinställningar"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
