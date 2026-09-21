import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) return null;

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-black font-mono text-[10px] font-bold tracking-wider hover:bg-neutral-200 transition cursor-pointer"
        title="Installera FujiCam på Android/skrivbord"
      >
        <Smartphone className="w-3 h-3" />
        <span>INSTALLERA APP</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1 px-2 py-1 rounded border border-white/30 text-white font-mono text-[10px] hover:border-white transition cursor-pointer"
        >
          <Smartphone className="w-3 h-3" />
          <span>INSTALLERA PÅ iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 p-4 font-mono">
            <div className="w-full max-w-xs rounded-lg bg-neutral-950 border border-white/30 p-5 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider">Installera FujiCam</h3>
                <button onClick={() => setShowIOSGuide(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                1. Tryck på <strong>Dela</strong>-knappen i Safari (fyrkanten med pil uppåt).<br />
                2. Rulla ner och välj <strong>Lägg till på hemskärmen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded bg-white py-1.5 text-xs font-bold text-black hover:bg-neutral-200"
              >
                Stäng
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
