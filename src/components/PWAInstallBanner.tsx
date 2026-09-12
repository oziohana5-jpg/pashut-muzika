import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner: React.FC = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const dismissed = localStorage.getItem('simply_music_pwa_dismissed');
    // Check if already installed as standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (isStandalone || dismissed) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show after 4 seconds on mobile browsers if not standalone
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const timer = setTimeout(() => {
      if (!dismissed && !isStandalone && isMobile) {
        setIsVisible(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // If iOS or generic mobile browser
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIosGuide(false);
    localStorage.setItem('simply_music_pwa_dismissed', 'true');
  };

  if (!isVisible && !showIosGuide) return null;

  return (
    <>
      {/* Banner */}
      {isVisible && !showIosGuide && (
        <div
          id="pwa-install-banner"
          className="fixed bottom-24 sm:bottom-6 start-4 end-4 sm:start-auto sm:end-6 sm:w-96 z-40 bg-[#161822]/95 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white leading-snug">
              הוסף את פשוט מוזיקה למסך הבית
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
              גישה מהירה בלחיצה אחת, שירים מלאים וחוויית אפליקציה מושלמת
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              id="btn-banner-download-apk"
              href="/api/download/apk"
              download="simply-music.apk"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              title="הורדת קובץ APK לאנדרואיד"
            >
              הורד APK
            </a>
            <button
              id="btn-install-pwa"
              onClick={handleInstallClick}
              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-md shadow-blue-600/20 active:scale-95 transition"
            >
              התקן
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS / Manual Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            id="ios-pwa-guide-modal"
            className="w-full max-w-sm bg-[#151720] border border-white/10 rounded-2xl p-6 shadow-2xl text-white space-y-4 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold">
              התקנה במסך הבית
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed">
              כדי להתקין את פשוט מוזיקה באייפון או בדפדפן הנייד:
            </p>

            <div className="space-y-2.5 text-start bg-white/5 p-3.5 rounded-xl border border-white/5 text-xs text-zinc-300">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <span>לחץ על כפתור השיתוף בתחתית הדפדפן (<Share className="w-3.5 h-3.5 inline text-blue-400" />)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <span>גלול ובחר באפשרות <strong>״הוסף למסך הבית״</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />)</span>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
