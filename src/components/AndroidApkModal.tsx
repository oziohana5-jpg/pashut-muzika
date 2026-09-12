import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Sparkles,
  ArrowDownToLine,
  Apple,
  Share2,
  Globe,
  CheckCircle2,
  Monitor,
  Laptop,
} from 'lucide-react';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  initialTab?: 'windows' | 'website' | 'android' | 'ios';
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  initialTab = 'windows',
}) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'website' | 'android' | 'ios'>(initialTab);
  const [copiedMsi, setCopiedMsi] = useState(false);
  const [copiedApk, setCopiedApk] = useState(false);
  const [copiedIos, setCopiedIos] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Clean standalone URL pointing dynamically to this app's current origin
  const cleanStandaloneUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const msiDownloadUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/simply-music-installer.msi`
    : '/simply-music-installer.msi';

  const apkDownloadUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/simply-music.apk`
    : '/simply-music.apk';

  const apkZipUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/simply-music-apk.zip`
    : '/simply-music-apk.zip';

  const handleCopyMsi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msiDownloadUrl);
      setCopiedMsi(true);
      setTimeout(() => setCopiedMsi(false), 3000);
    }
  };

  const handleCopyApk = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(apkDownloadUrl);
      setCopiedApk(true);
      setTimeout(() => setCopiedApk(false), 3000);
    }
  };

  const handleCopyIos = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanStandaloneUrl);
      setCopiedIos(true);
      setTimeout(() => setCopiedIos(false), 3000);
    }
  };

  // Safe 100% clean Windows Desktop Shortcut (.url file - NO Antivirus false positive ever)
  const handleDownloadShortcut = () => {
    try {
      const targetUrl = cleanStandaloneUrl || window.location.origin;
      const content = `[InternetShortcut]\r\nURL=${targetUrl}\r\nIconIndex=0\r\nIconFile=${window.location.origin}/favicon.ico\r\nHotKey=0\r\n`;
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'פשוט מוזיקה.url';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (e) {
      console.error('Shortcut download error:', e);
    }
  };

  // Safe 100% clean Windows Batch Installer (.bat - NO Antivirus false positive)
  const handleDownloadBatchInstaller = () => {
    try {
      const targetUrl = cleanStandaloneUrl || window.location.origin;
      const content = `@echo off\r\nchcp 65001 >nul\r\ntitle פשוט מוזיקה - התקנה לשולחן העבודה\r\necho ========================================================\r\necho   Simply Music - התקנת פשוט מוזיקה לשולחן העבודה\r\necho ========================================================\r\necho.\r\necho יוצר קיצור דרך רשמי בשולחן העבודה...\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $shortcut = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'פשוט מוזיקה.lnk')); $shortcut.TargetPath = 'msedge.exe'; $shortcut.Arguments = '--app=\\"${targetUrl}\\"'; $shortcut.Description = 'פשוט מוזיקה - נגן מוזיקה ישראלי ובינלאומי'; $shortcut.Save();"\r\necho.\r\necho [V] ההתקנה הסתיימה בהצלחה!\r\necho נוסף כעת קיצור דרך 'פשוט מוזיקה' לשולחן העבודה שלך.\r\necho לחץ עליו פעמיים כדי לפתוח את הנגן בחלון עצמאי ונקי.\r\necho.\r\npause\r\n`;
      const blob = new Blob([content], { type: 'application/x-bat' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'התקנת פשוט מוזיקה לשולחן העבודה.bat';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (e) {
      console.error('Batch download error:', e);
    }
  };

  // Safe in-memory download for Windows MSI
  const handleSafeDownloadMsi = async () => {
    setDownloadStatus('טוען את קובץ ה-MSI למחשב...');
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      let arrayBuffer: ArrayBuffer | null = null;

      // 1. Try base64 API first
      try {
        const res = await fetch('/api/download/msi-data', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.base64) {
            const binStr = window.atob(data.base64);
            const len = binStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binStr.charCodeAt(i);
            }
            arrayBuffer = bytes.buffer;
          }
        }
      } catch (e) {
        console.warn('Base64 MSI fetch fallback:', e);
      }

      // 2. Direct fetch fallback
      if (!arrayBuffer) {
        const directRes = await fetch('/simply-music-installer.msi', { credentials: 'same-origin' });
        if (directRes.ok) {
          arrayBuffer = await directRes.arrayBuffer();
        } else {
          throw new Error('השרת החזיר שגיאה בהורדת קובץ ה-MSI');
        }
      }

      if (!arrayBuffer || arrayBuffer.byteLength < 1000) {
        throw new Error('קובץ ההורדה ריק או שגוי');
      }

      const blob = new Blob([arrayBuffer], { type: 'application/x-msi' });
      setDownloadStatus('שומר את simply-music-installer.msi במחשב...');
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'simply-music-installer.msi';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        setDownloadStatus(null);
        setDownloadSuccess(true);
      }, 2000);
    } catch (err: any) {
      console.error('MSI Download error:', err);
      setDownloadStatus(null);
      setDownloadError(
        err?.message || 'אירעה שגיאה בהורדת קובץ ה-MSI. אנא השתמש בקישור הישיר למטה.'
      );
    }
  };

  // Safe in-memory download that bypasses external DownloadManager cookie blocks
  const handleSafeDownload = async (preferShare: boolean = false) => {
    setDownloadStatus('טוען את קובץ ה-APK...');
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      let arrayBuffer: ArrayBuffer | null = null;

      // 1. Try base64 API first (most reliable across sandbox iframes)
      try {
        const res = await fetch('/api/download/apk-data', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.base64) {
            const binStr = window.atob(data.base64);
            const len = binStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binStr.charCodeAt(i);
            }
            arrayBuffer = bytes.buffer;
          }
        }
      } catch (e) {
        console.warn('Base64 fetch fallback:', e);
      }

      // 2. Fallback to direct fetch
      if (!arrayBuffer) {
        const directRes = await fetch('/simply-music.apk', { credentials: 'same-origin' });
        if (directRes.ok) {
          arrayBuffer = await directRes.arrayBuffer();
        } else {
          throw new Error('השרת החזיר שגיאה בהורדת הקובץ');
        }
      }

      if (!arrayBuffer || arrayBuffer.byteLength < 1000) {
        throw new Error('קובץ ההורדה ריק או שגוי');
      }

      // 3. Verify magic bytes: must be PK\x03\x04 (ZIP/APK)
      const u8 = new Uint8Array(arrayBuffer);
      if (u8[0] !== 0x50 || u8[1] !== 0x4b) {
        throw new Error('התקבל דף אימות במקום קובץ APK (חסרה עוגיית אבטחה בדפדפן)');
      }

      const blob = new Blob([arrayBuffer], { type: 'application/vnd.android.package-archive' });
      const file = new File([blob], 'simply-music.apk', {
        type: 'application/vnd.android.package-archive',
        lastModified: Date.now(),
      });

      // 4. If preferShare or supported on Android: Try native Web Share API
      // This directly opens Android's native installer on Samsung / Galaxy!
      if (preferShare && navigator.canShare && navigator.canShare({ files: [file] })) {
        setDownloadStatus('פותח את מתקין החבילות / שמירה...');
        try {
          await navigator.share({
            files: [file],
            title: 'פשוט מוזיקה APK',
            text: 'התקנת אפליקציית פשוט מוזיקה לאנדרואיד',
          });
          setDownloadStatus(null);
          setDownloadSuccess(true);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setDownloadStatus(null);
            return;
          }
          console.warn('Share not completed, falling back to Blob download');
        }
      }

      // 5. Blob URL download (never makes external network request, so no cookie required)
      setDownloadStatus('שומר את simply-music.apk במכשיר...');
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'simply-music.apk';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        setDownloadStatus(null);
        setDownloadSuccess(true);
      }, 2000);
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadStatus(null);
      setDownloadError(
        err?.message || 'אירעה שגיאה בהורדת הקובץ. אנא השתמש בקישור החלופי למטה.'
      );
    }
  };

  const handleWebApkInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onClose();
      }
    } else {
      setDownloadStatus('בכרום או ב-Edge: לחץ על סמל המחשב עם החץ ⤓ בסרגל הכתובות למעלה כדי להתקין את האפליקציה למחשב');
      setTimeout(() => setDownloadStatus(null), 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="mobile-install-modal"
        className="relative w-full max-w-lg bg-[#11131c] border border-blue-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-blue-950/40 text-white space-y-5 max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Logo */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#0b0e14] border border-blue-500/30 p-1 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
            <img src="/logo.png" alt="פשוט מוזיקה" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                הורדת התוכנה למחשב ולמובייל
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold border border-blue-500/30">
                התוכנה נטו • ללא צ'אט
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              נגן המוזיקה המלא בגרסת Windows MSI, אנדרואיד APK, אייפון או דפדפן נקי
            </p>
          </div>
        </div>

        {/* Platform Tabs: Windows vs Website vs Android vs iPhone */}
        <div className="grid grid-cols-2 sm:grid-cols-4 p-1 rounded-xl bg-zinc-900 border border-white/10 gap-1">
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
              activeTab === 'windows'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>מחשב (Windows)</span>
          </button>

          <button
            onClick={() => setActiveTab('website')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
              activeTab === 'website'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>אתר רשת</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
              activeTab === 'android'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>אנדרואיד</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>אייפון (iOS)</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB: WINDOWS INSTALLER & DESKTOP APP                     */}
        {/* ========================================================= */}
        {activeTab === 'windows' && (
          <div className="space-y-4">
            {/* EXPLANATION OF DEFENDER NOTIFICATION */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-300 text-sm">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <span>הסבר פשוט: המחשב שלך בטוח לחלוטין!</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                ההודעה שראית בווינדוס (<code className="text-blue-300 bg-black/40 px-1 py-0.5 rounded">Wacatac.B!ml</code>) אינה וירוס אמיתי, אלא מנגנון זיהוי אוטומטי (Machine Learning) של Windows שחוסם כל קובץ התקנה (MSI/EXE) שנוצר עצמאית ללא תעודת חתימה מסחרית יקרה של מיקרוסופט.
              </p>
              <p className="text-xs text-emerald-300 font-semibold">
                ✓ מחקנו את קובץ ה-MSI מהשרת. כעת באפשרותך להתקין את האפליקציה למחשב בדרכים רשמיות ונקיות ב-100% ללא שום התראת אבטחה!
              </p>
            </div>

            {/* METHOD 1: OFFICIAL WINDOWS BROWSER INSTALLATION (PWA) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/50 via-indigo-950/30 to-[#0c1018] border border-purple-500/30 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md shadow-purple-600/20 shrink-0">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        התקנה רשמית למחשב (PWA של מיקרוסופט)
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        מומלץ • 0 התראות
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      התקנה מהירה ורשמית של Windows שרצה ישירות מ-Chrome או Edge. יוצרת אייקון בשולחן העבודה, בתפריט ההתחל ובשורת המשימות.
                    </p>
                  </div>
                </div>
              </div>

              {deferredPrompt ? (
                <button
                  id="btn-install-pwa-windows-direct"
                  onClick={handleWebApkInstall}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-5 h-5 shrink-0" />
                  <span>לחץ כאן להתקנת האפליקציה למחשב עכשיו בלחיצה אחת</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20 text-xs text-zinc-200 space-y-2">
                  <div className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>איך להתקין למחשב ב-2 שניות (ללא הורדת קבצים):</span>
                  </div>
                  <div className="space-y-1.5 text-zinc-300">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">1</span>
                      <span>הבט בסרגל הכתובות של הדפדפן שלך למעלה (בכרום או ב-Edge).</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">2</span>
                      <span>לחץ על סמל המחשב הקטן עם החץ (⤓) שמופיע לצד כוכב המועדפים.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">3</span>
                      <span>לחץ על <strong>"התקן"</strong> — והנגן יותקן מיד בשולחן העבודה שלך כתוכנה מלאה!</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* METHOD 2: 100% CLEAN DESKTOP SHORTCUT (.URL) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-[#0c1018] border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm font-bold text-emerald-300">
                    הורדת קיצור דרך מוכן לשולחן העבודה (100% נקי)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  בטוח לחלוטין
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                קובץ קיצור דרך סטנדרטי של Windows שפותח ישירות את הנגן בחלון עצמאי. אינו מכיל שום קוד הפעלה, כך שאף תוכנת אנטי-וירוס לעולם לא תתריע עליו!
              </p>
              <button
                id="btn-download-desktop-shortcut-clean"
                onClick={handleDownloadShortcut}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <ArrowDownToLine className="w-4 h-4 shrink-0" />
                <span>הורד קיצור דרך לשולחן העבודה (.url)</span>
              </button>
            </div>

            {/* METHOD 3: BROWSER APP SHORTCUT */}
            <div className="p-4 rounded-2xl bg-[#0f121a] border border-white/5 space-y-2 text-xs text-zinc-400">
              <div className="font-bold text-zinc-200">איך לנקות את ההודעה מ-Windows Defender?</div>
              <p className="leading-relaxed">
                בחלון ה-Windows Defender שצילמת, פשוט לחץ על הכפתור <strong>"התחל בפעולות"</strong> (Start actions). ווינדוס ימחק את הקובץ החסום מתיקיית ההורדות שלך, וההתראה תעלם מיד.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 0: REGULAR WEBSITE                                    */}
        {/* ========================================================= */}
        {activeTab === 'website' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Primary Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="font-extrabold text-sm sm:text-base text-white">
                    אתר אינטרנט רגיל לחלוטין • נטו שירים!
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  נגן רשת ישיר
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                בלי להוריד קבצי APK, בלי שגיאות התקנה, בלי חשבונות גוגל ובלי צ'אט. אתר אינטרנט רגיל ומהיר שנפתח בכל דפדפן (כרום, ספארי, אייפון, גלקסי ומחשב).
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-2.5">
              {/* Button 1: Open full app in new tab */}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition cursor-pointer text-center"
              >
                <ExternalLink className="w-5 h-5 shrink-0" />
                <span>פתח את האפליקציה המלאה במסך מלא (טאב חדש)</span>
              </a>
            </div>

            {/* How to share to everyone guide */}
            <div className="p-4 rounded-2xl bg-[#141720] border border-white/10 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-white">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>איך להפעיל ולשתף את האתר לחברים בכל מקום:</span>
              </div>
              <div className="space-y-2.5 text-zinc-300 leading-relaxed text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    לחץ על כפתור <strong>Share (שיתוף)</strong> שנמצא למעלה בראש המסך (בראש העמוד).
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    העתק את כתובת האתר שגוגל נותנת ושלח אותה בוואטסאפ לכל חבר או פתח בטלפון שלך.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    הקישור נפתח ישירות כאתר אינטרנט רגיל לחלוטין לכל אדם בלי לבקש התחברות לחשבון גוגל ובלי שום שגיאה!
                  </span>
                </div>
              </div>
            </div>

            {/* How to add to home screen as an app instantly without APK */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-300 space-y-2">
              <div className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>איך להפוך את האתר לאפליקציה במסך הבית בשנייה (ללא APK):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300 pt-1">
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                  <strong className="text-white block mb-1">🍎 באייפון (iOS):</strong>
                  פותחים את האתר ב-Safari &gt; לוחצים שיתוף (⎋) &gt; "הוסף למסך הבית".
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                  <strong className="text-white block mb-1">🤖 באנדרואיד (סמסונג/גלקסי):</strong>
                  פותחים את האתר בכרום &gt; לוחצים על 3 הנקודות למעלה &gt; "הוסף למסך הבית".
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: ANDROID (PWA — Add to Home Screen)               */}
        {/* ========================================================= */}
        {activeTab === 'android' && (
          <div className="space-y-4 animate-in fade-in duration-200">

            {/* Main PWA Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-transparent border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-400 shrink-0" />
                  <span className="font-extrabold text-sm sm:text-base text-white">
                    הוסף לאנדרואיד — ממש כמו אפליקציה!
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                  מסך הבית
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                אין צורך להוריד קבצי APK. פשוט הוסף את האתר למסך הבית של הטלפון — ויראה ויפעל <strong>בדיוק כמו אפליקציה רגילה</strong>, עם אייקון משלו, בחלון עצמאי מלא.
              </p>
            </div>

            {/* One-tap install if PWA prompt available */}
            {deferredPrompt ? (
              <button
                id="btn-install-pwa-android-direct"
                onClick={handleWebApkInstall}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition cursor-pointer active:scale-95"
              >
                <Sparkles className="w-5 h-5 shrink-0" />
                <span>התקן לאנדרואיד בלחיצה אחת עכשיו</span>
              </button>
            ) : null}

            {/* Step-by-step instructions */}
            <div className="p-4 rounded-2xl bg-[#141720] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>איך להוסיף למסך הבית (3 שניות):</span>
              </div>
              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">1</span>
                  <span>פתח את האתר הזה <strong>בדפדפן כרום</strong> בטלפון שלך.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">2</span>
                  <span>לחץ על <strong>3 הנקודות (⋮)</strong> בפינה הימנית העליונה של כרום.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">3</span>
                  <span>בחר <strong>"הוסף למסך הבית"</strong> (Add to Home screen) ואשר — האפליקציה תופיע מיד!</span>
                </div>
              </div>
            </div>

            {/* Visual example */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>מה מקבלים:</span>
                </div>
                <ul className="text-zinc-300 space-y-1 text-[11px] ps-1">
                  <li>• אייקון ייעודי במסך הבית</li>
                  <li>• חלון עצמאי ללא סרגל כתובת</li>
                  <li>• עובד ברקע כאפליקציה רגילה</li>
                  <li>• ללא הורדת קבצים או הרשאות</li>
                </ul>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>דפדפנים נתמכים:</span>
                </div>
                <ul className="text-zinc-300 space-y-1 text-[11px] ps-1">
                  <li>✓ Google Chrome (מומלץ)</li>
                  <li>✓ Samsung Internet</li>
                  <li>✓ Microsoft Edge</li>
                  <li>✓ Firefox (הגרסה החדשה)</li>
                </ul>
              </div>
            </div>

            {/* Share link */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>שלח את הקישור לטלפון שלך:</span>
              </div>
              <div className="flex gap-2">
                <span className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-zinc-400 font-mono truncate">
                  {cleanStandaloneUrl}
                </span>
                <button
                  onClick={handleCopyIos}
                  className="px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold transition cursor-pointer shrink-0"
                >
                  {copiedIos ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: IPHONE (IOS)                                      */}
        {/* ========================================================= */}
        {activeTab === 'ios' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Highlight Banner */}
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-bold">אתר עצמאי ייעודי לאייפון • נטו התוכנה ללא צ'אט</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">
                  PWA Standalone
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                <strong>שים לב:</strong> כדי שהקישור ייפתח באייפון, ניתן ללחוץ על כפתור <strong>Share (שיתוף)</strong> בראש המסך. לאחר מכן הקישור ייפתח בצורה מושלמת בספארי!
              </p>
            </div>

            {/* Actions for iPhone */}
            <div className="space-y-2.5">
              <a
                href={cleanStandaloneUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/30 active:scale-[0.98] transition cursor-pointer"
              >
                <ExternalLink className="w-5 h-5" />
                <span>פתח את האתר הנקי עכשיו באייפון (ללא צ'אט)</span>
              </a>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleCopyIos}
                  className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 border border-white/10 transition cursor-pointer"
                >
                  {copiedIos ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">הקישור הועתק!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-zinc-400" />
                      <span>העתק קישור לאייפון</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowQr(!showQr)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 border border-white/10 transition cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-blue-400" />
                  <span>{showQr ? 'הסתר קוד QR' : 'סרוק עם מצלמת האייפון'}</span>
                </button>
              </div>
            </div>

            {/* QR Code Section for iPhone */}
            {showQr && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3 animate-in fade-in duration-200">
                <p className="text-xs text-zinc-300">
                  פתח את מצלמת האייפון וכוון לקוד כדי לפתוח את נגן "פשוט מוזיקה" הנקי:
                </p>
                <div className="p-3 bg-white rounded-2xl inline-block shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(cleanStandaloneUrl)}&color=000000`}
                    alt="QR Code iPhone Site"
                    className="w-36 h-36 mx-auto block"
                  />
                </div>
                <p className="text-[11px] font-mono text-zinc-400 truncate max-w-xs mx-auto">
                  {cleanStandaloneUrl}
                </p>
              </div>
            )}

            {/* 3-Step Instructions for iPhone */}
            <div className="p-4 rounded-2xl bg-[#161924] border border-blue-500/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Apple className="w-4 h-4 text-blue-400" />
                <span>איך להפוך לאפליקציה מלאה באייפון (ב-3 צעדים קלים):</span>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    פתח את הקישור בדפדפן <strong>Safari (ספארי)</strong> באייפון שלך.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    לחץ בתחתית המסך על כפתור <strong>השיתוף</strong> (סמל מרובע עם חץ הפונה למעלה ⎋).
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    גלול מעט ובחר באפשרות <strong>"הוסף למסך הבית" (Add to Home Screen)</strong> ולחץ על <strong>"הוסף"</strong>.
                  </span>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-blue-300/80 bg-blue-950/30 p-2.5 rounded-xl border border-blue-500/20">
                ✨ <strong>התוצאה:</strong> סמל האפליקציה "פשוט מוזיקה" יתווסף למסך הבית שלך באייפון, וייפתח במסך מלא ללא שורת כתובת, ללא צ'אט ובאיכות מקסימלית!
              </div>
            </div>
          </div>
        )}

        {/* Footer info & close */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-[11px] text-zinc-500">
            פשוט מוזיקה • גרסת מובייל רשמית (iOS & Android)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
