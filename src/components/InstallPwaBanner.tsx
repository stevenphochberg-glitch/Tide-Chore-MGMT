import React, { useEffect, useState } from 'react';
import { Download, Check, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
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

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isDismissed || isInstalled) {
    return null;
  }

  // Show banner if install prompt is ready or give a helpful hint for iOS / desktop
  return (
    <div id="pwa-install-banner" className="bg-[#1A3C40] border-b border-[#F0EBE0]/30 text-white px-4 sm:px-8 py-2 text-xs flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A8DADC] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A8DADC]" />
        </span>
        <span className="font-light text-slate-200">
          Install Tide as a Progressive Web App for real-time notifications & offline flow.
        </span>
      </div>

      <div className="flex items-center gap-3">
        {deferredPrompt ? (
          <button
            id="install-pwa-button"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#2D6A4F] hover:bg-[#23533e] text-white font-medium rounded-full transition shadow-xs text-[11px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Get PWA</span>
          </button>
        ) : (
          <span className="hidden sm:inline text-[#A8DADC] uppercase tracking-widest text-[10px] font-semibold">
            PWA Active
          </span>
        )}
        <button
          id="dismiss-pwa-banner"
          onClick={() => setIsDismissed(true)}
          className="p-1 text-slate-400 hover:text-white transition"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
