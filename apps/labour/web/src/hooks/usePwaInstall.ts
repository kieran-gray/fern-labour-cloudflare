import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(isInstallable: boolean) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;

    for (const listener of listeners) {
      listener(true);
    }
  });
}

export function usePwaInstall() {
  const [isInstallable, setIsInstallable] = useState<boolean>(!!globalDeferredPrompt);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    listeners.add(setIsInstallable);

    setIsInstallable(!!globalDeferredPrompt);

    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    return () => {
      listeners.delete(setIsInstallable);
    };
  }, []);

  const install = async () => {
    if (!globalDeferredPrompt) {
      return;
    }

    await globalDeferredPrompt.prompt();

    const choiceResult = await globalDeferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    globalDeferredPrompt = null;

    for (const listener of listeners) {
      listener(false);
    }
  };

  return { isInstallable, isStandalone, isIos, install };
}
