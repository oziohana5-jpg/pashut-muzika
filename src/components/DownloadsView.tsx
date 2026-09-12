import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  Apple,
  Share2,
  Copy,
  Check,
  Download,
  QrCode,
  Sparkles,
  Music2,
  ExternalLink,
  ShieldCheck,
  Info,
  Sliders,
  Moon,
  FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const DownloadsView: React.FC = () => {
  const { t } = useLanguage();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [downloadingApk, setDownloadingApk] = useState(false);
  const [downloadingMsi, setDownloadingMsi] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Short and memorable public link
  const shortUrl = 'https://pashut-muzika.onrender.com';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pashut-muzika.onrender.com';

  const handleCopyLink = (urlToCopy: string, isDirect: boolean = false) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(urlToCopy);
      if (isDirect) {
        setCopiedDirect(true);
        setTimeout(() => setCopiedDirect(false), 3000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }
    }
  };

  const handleDownloadApk = async () => {
    setDownloadingApk(true);
    setDownloadStatus('מכין את קובץ האפליקציה (simply-music.apk)...');
    setDownloadError(null);

    try {
      let arrayBuffer: ArrayBuffer | null = null;

      // Try base64 API first
      try {
        const res = await fetch('/api/download/apk-data', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.base64) {
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
        console.warn('API fetch fallback:', e);
      }

      // Direct download fallback
      if (!arrayBuffer) {
        const directRes = await fetch('/simply-music.apk', { credentials: 'same-origin' });
        if (directRes.ok) {
          arrayBuffer = await directRes.arrayBuffer();
        }
      }

      if (!arrayBuffer || arrayBuffer.byteLength < 1000) {
        // Fallback to direct anchor navigation
        const a = document.createElement('a');
        a.href = '/simply-music.apk';
        a.download = 'simply-music.apk';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadStatus('ההורדה החלה בהצלחה!');
        setTimeout(() => setDownloadStatus(null), 4000);
        return;
      }

      const blob = new Blob([arrayBuffer], { type: 'application/vnd.android.package-archive' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'simply-music.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      setDownloadStatus('קובץ simply-music.apk ירד בהצלחה למכשירך!');
      setTimeout(() => setDownloadStatus(null), 5000);
    } catch (err: any) {
      console.error(err);
      setDownloadError('אירעה שגיאה בהורדה, מנסה קישור ישיר...');
      const a = document.createElement('a');
      a.href = '/simply-music.apk';
      a.download = 'simply-music.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingApk(false);
    }
  };

  const handleDownloadMsi = async () => {
    setDownloadingMsi(true);
    setDownloadStatus('מוריד קובץ התקנה לווינדוס...');
    try {
      const a = document.createElement('a');
      a.href = '/simply-music-installer.msi';
      a.download = 'simply-music-installer.msi';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadStatus('הורדת קובץ ה-MSI החלה בהצלחה!');
      setTimeout(() => setDownloadStatus(null), 5000);
    } catch (e) {
      console.error(e);
      setDownloadError('שגיאה בהורדת קובץ ההתקנה');
    } finally {
      setDownloadingMsi(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10 pb-32">
      {/* Header */}
      <div className="space-y-2 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              הורדות ואפליקציות
            </h1>
            <p className="text-sm text-zinc-400">
              האזן לכל השירים באיכות מקורית – בכל טלפון, מחשב ודפדפן
            </p>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {downloadStatus && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{downloadStatus}</span>
        </div>
      )}
      {downloadError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <Info className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Main Grid: Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Short Web Link / Share to Everyone */}
        <div className="p-6 rounded-2xl bg-zinc-900/70 border border-white/5 space-y-5 hover:border-white/10 transition flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">קישור קצר לאתר (שיתוף לכולם)</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">
                לכל דפדפן
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              קישור קצר ופשוט שכל אחד יכול לפתוח מיד – מהטלפון, הטאבלט או המחשב, ללא שום התקנה.
            </p>

            {/* Short URL Box */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-zinc-300 truncate direction-ltr select-all">
                  {shortUrl}
                </span>
                <button
                  id="btn-copy-short-url"
                  onClick={() => handleCopyLink(shortUrl, false)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'הועתק!' : 'העתק קישור'}</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                <span className="text-[11px] text-zinc-500">קישור מלא:</span>
                <button
                  id="btn-copy-direct-url"
                  onClick={() => handleCopyLink(siteUrl, true)}
                  className="text-[11px] text-zinc-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedDirect ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDirect ? 'הועתק!' : 'העתק כתובת מלאה'}</span>
                </button>
              </div>
            </div>

            {/* QR Code Preview */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 flex items-center gap-4">
              <div className="p-1.5 bg-white rounded-lg shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(shortUrl)}`}
                  alt="QR Code"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <QrCode className="w-3.5 h-3.5 text-zinc-400" />
                  <span>סריקה מהירה מהטלפון</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  כוון את מצלמת הטלפון לסריקת הקוד והאתר ייפתח מיד.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`בוא לשמוע מוזיקה ישראלית בחינם בנגן "פשוט מוזיקה": ${shortUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>שתף בוואטסאפ לכל החברים</span>
            </a>
          </div>
        </div>

        {/* Card 2: Android APK Application */}
        <div className="p-6 rounded-2xl bg-zinc-900/70 border border-white/5 space-y-5 hover:border-white/10 transition flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">אפליקציה לאנדרואיד (APK עצמאי)</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">
                גרסה 2.0 מעודכנת
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              אפליקציה עצמאית ומלאה הכוללת את כל 28 השירים, מילים מסונכרנות בזמן אמת, איקוולייזר ובס, נגן תקליט ויניל וטיימר שינה.
            </p>

            {/* Feature List */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>כל 28 השירים המקוריים</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>מילים מסונכרנות בלייב</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>איקוולייזר 5 ערוצים</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>טיימר שינה מובנה</span>
              </div>
            </div>

            {/* Quick Install Guide */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-[11px] text-zinc-400">
              <div className="font-semibold text-white">איך מתקינים באנדרואיד?</div>
              <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                <li>לחץ על כפתור ההורדה למטה</li>
                <li>פתח את הקובץ <code className="text-emerald-400">simply-music.apk</code> במכשיר</li>
                <li>אשר "התקנה ממקורות לא מוכרים" אם הטלפון מבקש וההתקנה תסתיים מיד!</li>
              </ol>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              id="btn-download-apk-view"
              onClick={handleDownloadApk}
              disabled={downloadingApk}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingApk ? 'מוריד קובץ...' : 'הורד קובץ לאנדרואיד (simply-music.apk)'}</span>
            </button>
            <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-500">
              <a
                href="/simply-music-apk.zip"
                download="simply-music-apk.zip"
                className="hover:text-zinc-300 transition underline cursor-pointer"
              >
                הורד כארכיון ZIP (.zip)
              </a>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                חתימה רשמית מאומתת
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Windows Computer Installer (.msi) */}
        <div className="p-6 rounded-2xl bg-zinc-900/70 border border-white/5 space-y-5 hover:border-white/10 transition flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">התקנה למחשב (Windows MSI)</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20">
                Windows 10 / 11
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              קובץ התקנה רשמי (.msi) לשולחן העבודה. מתקין את פשוט מוזיקה כאפליקציית מחשב מהירה, עצמאית ונקייה.
            </p>

            {/* PC Benefits */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-[11px] text-zinc-400">
              <div className="font-semibold text-white">יתרונות גרסת המחשב:</div>
              <ul className="space-y-1">
                <li>• פועלת עצמאית בחלון ייעודי משלה ללא דפדפן</li>
                <li>• תמיכה במקשי מדיה במקלדת (Play, Pause, Next)</li>
                <li>• אייקון בשורת המשימות ובשולחן העבודה</li>
              </ul>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="btn-download-msi-view"
              onClick={handleDownloadMsi}
              disabled={downloadingMsi}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingMsi ? 'מוריד התקנה...' : 'הורד התקנה לווינדוס (.msi)'}</span>
            </button>
          </div>
        </div>

        {/* Card 4: iPhone / iPad (iOS) */}
        <div className="p-6 rounded-2xl bg-zinc-900/70 border border-white/5 space-y-5 hover:border-white/10 transition flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-200">
                  <Apple className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">אייפון ו-iPad (התקנה מהירה)</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-white/10">
                iOS / Safari
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              התקנת אפליקציה ישירה למסך הבית באייפון ללא צורך ב-App Store וללא תשלום.
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-[11px] text-zinc-400">
              <div className="font-semibold text-white">שלבי התקנה באייפון:</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>פתח את האתר בדפדפן <strong>Safari</strong> באייפון</li>
                <li>לחץ על כפתור <strong>השיתוף (Share)</strong> בתחתית המסך</li>
                <li>גלול ולחץ על <strong>"הוסף למסך הבית" (Add to Home Screen)</strong></li>
                <li>זהו! האייקון של פשוט מוזיקה יופיע על מסך הבית כאפליקציה רגילה</li>
              </ol>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => handleCopyLink(shortUrl, false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>{copiedLink ? 'הקישור הועתק!' : 'העתק קישור לשליחה לאייפון'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
