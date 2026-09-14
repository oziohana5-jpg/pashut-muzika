import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Globe,
  Sliders,
  Trash2,
  LogOut,
  Shield,
  CheckCircle,
  AlertCircle,
  Volume2,
  Headphones,
  Info,
  Heart,
  Smartphone,
  Bell,
  Sparkles,
  Send,
  Music2,
  ShieldCheck,
  Share,
  PlusSquare,
  Check,
  Download,
  Copy,
  ArrowDownToLine,
  Award,
  Palette,
  WandSparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePlayer } from '../contexts/PlayerContext';
import { themes, useTheme } from '../contexts/ThemeContext';
import { ActiveTab } from '../types';

interface SettingsViewProps {
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateTab }) => {
  const { user, token, logout, updateProfile, changePassword, deleteAccount, openAuthModal } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { audioQuality, setAudioQuality } = usePlayer();
  const { themeId, setThemeId, customColors, setCustomColor, confettiEnabled, setConfettiEnabled } = useTheme();

  // Audio playback preferences
  const [normalizeAudio, setNormalizeAudio] = useState(true);
  const [crossfade, setCrossfade] = useState(false);

  // Profile Form State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Form State
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notifications setting
  const [newSongNotifs, setNewSongNotifs] = useState(() => {
    return localStorage.getItem('simply_music_disable_release_notifs') !== 'true';
  });
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  // PWA install guide modal
  const [showPwaGuide, setShowPwaGuide] = useState(false);
  const [installedApp, setInstalledApp] = useState(false);
  const [copiedApk, setCopiedApk] = useState(false);

  // Feedback form state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setInstalledApp(true);
    }
  }, []);

  const handleToggleNotifs = () => {
    const nextVal = !newSongNotifs;
    setNewSongNotifs(nextVal);
    if (!nextVal) {
      localStorage.setItem('simply_music_disable_release_notifs', 'true');
    } else {
      localStorage.removeItem('simply_music_disable_release_notifs');
    }
  };

  const handleEnableBrowserNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setBrowserNotificationPermission(permission);
    if (permission === 'granted') {
      localStorage.setItem('simply_music_browser_notifications', 'true');
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    if (!token) {
      openAuthModal('כדי לשלוח פידבק לצוות, יש להתחבר לחשבון.', 'login');
      return;
    }
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: feedbackText }),
      });
      if (!response.ok) return;
    } catch {
      return;
    }
    setFeedbackSuccess(true);
    setFeedbackText('');
    setTimeout(() => setFeedbackSuccess(false), 4000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    const res = await updateProfile(displayName, username, avatarUrl);
    if (res.success) {
      setProfileMsg({ type: 'success', text: t('profileUpdated') });
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Failed' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    const res = await changePassword(currPassword, newPassword);
    if (res.success) {
      setPwdMsg({ type: 'success', text: t('passwordChanged') });
      setCurrPassword('');
      setNewPassword('');
    } else {
      setPwdMsg({ type: 'error', text: res.error || 'Failed' });
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(t('confirmDeleteAccount'))) {
      await deleteAccount();
    }
  };

  return (
    <div className="max-w-3xl space-y-8 pb-32 pt-2 px-4 sm:px-8 text-white">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
        {t('settingsTitle')}
      </h1>

      {user?.role === 'admin' && (
        <section className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">Admin Access</p>
              <h2 className="mt-1 text-base font-black text-white">ממשק אדמין</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-400">ניהול משתמשים, ספקי שמע, עדכונים, פידבק ושגיאות מערכת.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab?.('admin')}
              className="inline-flex items-center justify-center rounded-xl border border-amber-300/30 bg-amber-400/15 px-4 py-3 text-xs font-bold text-amber-200 transition hover:bg-amber-400/25"
            >
              פתח ממשק אדמין
            </button>
          </div>
        </section>
      )}

      {/* Visual identity */}
      <section className="theme-studio relative overflow-hidden rounded-3xl border border-white/10 p-5 sm:p-6 space-y-5">
        <div className="absolute -top-24 -end-16 h-56 w-56 rounded-full bg-[var(--app-glow)]/20 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-accent)]/15 text-[var(--app-accent)] border border-[var(--app-accent)]/30">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">סגנון עיצוב</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-400">תבחרו את האווירה של פשוט מוזיקה. השינוי נשמר אוטומטית בכל המכשירים בדפדפן הזה.</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[var(--app-accent)]/30 bg-[var(--app-accent)]/10 px-3 py-1 text-[10px] font-bold text-[var(--app-accent)]"><WandSparkles className="h-3.5 w-3.5" /> LIVE STYLE</span>
        </div>

        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3">
          {themes.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setThemeId(option.id)}
              className={`group rounded-2xl border p-3 text-start transition ${themeId === option.id ? 'border-[var(--app-accent)] bg-[var(--app-accent)]/10 shadow-lg shadow-[var(--app-accent)]/10' : 'border-white/10 bg-black/10 hover:border-white/25 hover:bg-white/5'}`}
            >
              <span className="mb-3 flex h-10 items-center gap-1 overflow-hidden rounded-xl border border-white/10 p-1" style={{ background: option.background }}>
                {option.preview.map((color) => <i key={color} className="h-full flex-1 rounded-lg" style={{ background: color }} />)}
              </span>
              <span className="block text-xs font-bold text-white">{option.id === 'custom' ? 'מותאם אישית' : option.name}</span>
              <span className={`mt-0.5 block truncate text-[10px] ${option.id === 'custom' ? 'font-bold text-[var(--app-accent)]' : 'text-zinc-500'}`}>{option.id === 'custom' ? 'לחצו כאן לעריכת כל הגוונים' : option.description}</span>
            </button>
          ))}
        </div>

        {themeId !== 'custom' && (
          <button type="button" onClick={() => setThemeId('custom')} className="relative flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--app-accent)]/30 bg-[var(--app-accent)]/10 p-3.5 text-start transition hover:bg-[var(--app-accent)]/15">
            <span><span className="block text-xs font-black text-white">רוצים לבנות סגנון משלכם?</span><span className="mt-1 block text-[10px] text-zinc-400">פתחו התאמה אישית ושנו את כל חמשת גווני הממשק</span></span>
            <span className="shrink-0 rounded-xl bg-[var(--app-accent)] px-3 py-2 text-[10px] font-black text-white">פתח התאמה אישית</span>
          </button>
        )}

        {themeId === 'custom' && (
          <div className="relative grid gap-2 rounded-2xl border border-white/10 bg-black/15 p-3.5 sm:grid-cols-2">
            {([
              ['background', 'רקע האפליקציה'],
              ['surface', 'כרטיסים ומשטחים'],
              ['surfaceStrong', 'משטחים מודגשים'],
              ['accent', 'צבע מוביל וכפתורים'],
              ['glow', 'צבעי זוהר ואפקטים'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <span className="text-xs font-semibold text-zinc-200">{label}</span>
                <span className="flex items-center gap-2"><input type="color" value={customColors[key]} onChange={(event) => setCustomColor(key, event.target.value)} className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent" aria-label={`בחירת ${label}`} /><span className="w-16 text-end text-[10px] font-mono text-zinc-500">{customColors[key].toUpperCase()}</span></span>
              </label>
            ))}
          </div>
        )}

        <div className="relative flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/15 p-3.5">
          <div className="flex items-center gap-3"><span className="text-xl">✨</span><span><span className="block text-xs font-bold text-white">Emoji Confetti</span><span className="mt-1 block text-[10px] text-zinc-500">אפקט אימוג׳ים קטן בכל פעם שמתחילים להקליד</span></span></div>
          <button type="button" role="switch" aria-checked={confettiEnabled} onClick={() => setConfettiEnabled(!confettiEnabled)} className={`relative h-6 w-11 shrink-0 rounded-full p-1 transition ${confettiEnabled ? 'bg-[var(--app-accent)]' : 'bg-zinc-700'}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${confettiEnabled ? 'translate-x-5 rtl:-translate-x-5' : ''}`} /></button>
        </div>
      </section>

      {/* Language Section */}
      <section className="p-6 rounded-2xl bg-[#13151d] border border-white/5 space-y-4">
        <div className="flex items-center gap-2.5 text-blue-400">
          <Globe className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">{t('language')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            onClick={() => setLanguage('he')}
            className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition ${
              language === 'he'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-white/5 text-zinc-300 border-white/5 hover:bg-white/10'
            }`}
          >
            עברית (RTL)
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition ${
              language === 'en'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-white/5 text-zinc-300 border-white/5 hover:bg-white/10'
            }`}
          >
            English (LTR)
          </button>
        </div>
      </section>

      {/* Audio Quality Section */}
      <section className="p-6 rounded-2xl bg-[#13151d] border border-white/5 space-y-4">
        <div className="flex items-center gap-2.5 text-blue-400">
          <Headphones className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">{t('audioQuality')}</h2>
        </div>
        <div className="space-y-2 max-w-md">
          {[
            { id: 'high', label: t('qualityHigh') },
            { id: 'normal', label: t('qualityNormal') },
            { id: 'saver', label: t('qualitySaver') },
          ].map((q) => (
            <label
              key={q.id}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                audioQuality === q.id
                  ? 'bg-blue-600/10 border-blue-500/30 text-white'
                  : 'bg-white/[0.02] border-white/5 text-zinc-300 hover:bg-white/5'
              }`}
            >
              <span className="text-xs font-medium">{q.label}</span>
              <input
                type="radio"
                name="audioQuality"
                value={q.id}
                checked={audioQuality === q.id}
                onChange={() => setAudioQuality(q.id as any)}
                className="w-4 h-4 text-blue-600 focus:ring-0"
              />
            </label>
          ))}
        </div>

        {/* Normalization & Gapless */}
        <div className="pt-2 border-t border-white/5 space-y-3">
          <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
            <span>{t('normalizeVolume')}</span>
            <input
              type="checkbox"
              checked={normalizeAudio}
              onChange={(e) => setNormalizeAudio(e.target.checked)}
              className="rounded w-4 h-4 text-blue-600 bg-zinc-800"
            />
          </label>
          <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
            <span>{t('crossfade')}</span>
            <input
              type="checkbox"
              checked={crossfade}
              onChange={(e) => setCrossfade(e.target.checked)}
              className="rounded w-4 h-4 text-blue-600 bg-zinc-800"
            />
          </label>
        </div>
      </section>

      {/* Account Settings (If Logged In) */}
      {user ? (
        <>
          {/* Edit Profile */}
          <section className="p-6 rounded-2xl bg-[#13151d] border border-white/5 space-y-4">
            <div className="flex items-center gap-2.5 text-blue-400">
              <User className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">{t('editProfile')}</h2>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">{t('displayName')}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">{t('username')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">{t('profilePictureUrl')}</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
              >
                {t('saveChanges')}
              </button>
            </form>
          </section>

          {/* Change Password */}
          <section className="p-6 rounded-2xl bg-[#13151d] border border-white/5 space-y-4">
            <div className="flex items-center gap-2.5 text-blue-400">
              <Lock className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">{t('changePassword')}</h2>
            </div>

            {pwdMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pwdMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {pwdMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">{t('currentPassword')}</label>
                <input
                  type="password"
                  required
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">{t('newPassword')}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
              >
                {t('updatePassword')}
              </button>
            </form>
          </section>

          {/* Logout & Delete Account */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
            <h2 className="text-base font-bold text-white">{t('accountSettings')}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white border border-white/5 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>

              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 border border-rose-500/20 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('deleteAccount')}</span>
              </button>
            </div>
          </section>
        </>
      ) : null}

      {/* Android APK & Home Screen Installation */}
      <section
        id="settings-pwa-section"
        className="p-6 rounded-2xl bg-gradient-to-br from-[#13151d] via-[#101926] to-[#0f1f1d] border border-emerald-500/30 space-y-5 shadow-xl shadow-emerald-950/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <Smartphone className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">אפליקציה לאנדרואיד (APK) ומסך הבית</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            APK Android v2.5
          </span>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
          הורד ישירות את קובץ ה-APK להתקנה מלאה במכשירי Android, או הוסף את האפליקציה למסך הבית. חוויית נגן מלאה, שירים באורך מלא וללא שום פרסומות!
        </p>

        {/* Action Buttons: Direct APK Download & Copy Link */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            id="btn-settings-download-apk"
            href="/api/download/apk"
            download="simply-music.apk"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>הורד קובץ APK עכשיו (simply-music.apk)</span>
          </a>

          <button
            id="btn-settings-copy-apk-link"
            onClick={() => {
              if (navigator.clipboard) {
                const url = `${window.location.origin}/api/download/apk`;
                navigator.clipboard.writeText(url);
                setCopiedApk(true);
                setTimeout(() => setCopiedApk(false), 3000);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-semibold transition"
          >
            {copiedApk ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">הקישור הועתק!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>העתק קישור ישיר להורדה</span>
              </>
            )}
          </button>

          <button
            id="btn-settings-install-pwa"
            onClick={() => setShowPwaGuide(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold active:scale-95 transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>{installedApp ? 'האפליקציה מותקנת במסך הבית ✓' : 'מדריך הוספה למסך הבית'}</span>
          </button>
        </div>

        {/* Brief Instructions Note */}
        <div className="p-3.5 rounded-xl bg-black/30 border border-emerald-500/15 text-[11px] text-zinc-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            לאחר ההורדה, פתח את הקובץ <strong className="text-white">simply-music.apk</strong> בהתראות המכשיר. אם הטלפון יבקש אישור להתקנה מדפדפן זה (מקורות לא מוכרים), אשר ב'הגדרות' וההתקנה תושלם מיד.
          </span>
        </div>
      </section>

      {/* Release Notifications ("לא לחפור") */}
      <section
        id="settings-notifs-section"
        className="p-6 rounded-2xl bg-[#13151d] border border-white/5 space-y-4"
      >
        <div className="flex items-center gap-2.5 text-blue-400">
          <Bell className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">עדכונים והתראות על שירים חדשים</h2>
        </div>
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div>
            <p className="text-sm font-semibold text-white">התראות על סינגלים ולהיטים חדשים</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              עדכון עדין כשיצא שיר חדש של אמנים מובילים (ללא ספאם / לא חופר)
            </p>
          </div>
          <button
            onClick={handleToggleNotifs}
            className={`w-12 h-6 rounded-full p-1 transition duration-200 ease-in-out relative ${
              newSongNotifs ? 'bg-blue-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition duration-200 ease-in-out transform ${
                newSongNotifs ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
          <div>
            <p className="text-sm font-semibold text-white">קבל עדכונים (אנחנו לא חופרים)</p>
            <p className="mt-0.5 text-xs text-zinc-400">התראה על שירים חדשים ועדכונים חשובים בלבד.</p>
          </div>
          {browserNotificationPermission === 'granted' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400"><Check className="h-4 w-4" /> ההתראות פעילות</span>
          ) : browserNotificationPermission === 'denied' ? (
            <span className="text-xs text-zinc-500">ההתראות חסומות בהגדרות הדפדפן</span>
          ) : (
            <button onClick={handleEnableBrowserNotifications} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500">הפעל התראות</button>
          )}
        </div>
      </section>

      {/* WHO WE ARE - OUR STORY */}
      <section
        id="about-us-story-section"
        className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#151824] via-[#12141c] to-[#0f1118] border border-blue-500/30 space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Background glow & emblem */}
        <div className="absolute top-0 end-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Heart className="w-6 h-6 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                מי אנחנו — הסיפור של "פשוט מוזיקה"
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                100% חינם
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              הסיפור מאחורי הפרויקט והחזון שלנו למוזיקה נקייה
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p className="font-medium text-white/90 text-sm sm:text-base">
            פתחנו את <strong className="text-blue-400">"פשוט מוזיקה"</strong> מתוך מטרה אחת פשוטה וישירה: להחזיר את האהבה והכיף להאזנה למוזיקה — בלי הפרעות.
          </p>

          <p>
            כמוכם, גם אנחנו היינו מתוסכלים מאפליקציות שמפציצות בפרסומות קופצות ורועשות כל שני שירים, חוסמות שירים אחרי 30 שניות, או דורשות מנויים יקרים כדי ליהנות ממוזיקה ישראלית איכותית.
          </p>

          <p>
            לכן החלטנו להשקיע את כל הלב, הזמן והטכנולוגיה, ובנינו פלטפורמה שנבנתה במיוחד בשבילכם:
          </p>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>100% ללא פרסומות לעולם</span>
              </div>
              <p className="text-zinc-400 text-xs">
                שום קטיעות מעצבנות באמצע פלייליסט, שום סרטוני פרסומת וחסויות קופצות.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Music2 className="w-4 h-4" />
                <span>שירים מלאים וקליפים רשמיים</span>
              </div>
              <p className="text-zinc-400 text-xs">
                שומעים כל שיר באורך מלא מההתחלה ועד הסוף, כולל אפשרות צפייה בקליפ הווידאו.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>מוזיקה איכותית לכולם</span>
              </div>
              <p className="text-zinc-400 text-xs">
                מוזיקה איכותית מכל הסגנונות, עם להיטים ישראליים ובינלאומיים ועוד עשרות אמנים.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <Heart className="w-4 h-4" />
                <span>אנחנו באמת משקיעים בשבילכם</span>
              </div>
              <p className="text-zinc-400 text-xs">
                עובדים מסביב לשעון כדי לשפר את המערכת, להוסיף שירים חדשים ולתת לכם את החוויה הכי טובה שיש.
              </p>
            </div>
          </div>
        </div>

        {/* Message / Song Request Form */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>רוצים להציע שיר חדש או לשלוח מילה לצוות?</span>
            </span>
          </div>

          {feedbackSuccess ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>תודה רבה! ההודעה נשלחה בהצלחה לצוות פשוט מוזיקה. אנחנו באמת מעריכים אתכם!</span>
            </div>
          ) : (
            <form onSubmit={handleSendFeedback} className="flex gap-2">
              <input
                type="text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="כתבו לנו הצעה לשיר, בקשה או פידבק..."
                className="flex-1 bg-[#181a24] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow shrink-0"
              >
                שלח
              </button>
            </form>
          )}
        </div>
      </section>

      {/* About App & License info */}
      <section className="p-6 rounded-2xl bg-[#13151d] border border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-zinc-400">
          <Info className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            {t('aboutTitle')}
          </h2>
        </div>
        <p className="text-sm font-semibold text-white">
          {t('appName')} • Simply Music v2.5 Pro (Full-Length Audio Experience)
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
          {t('legalDisclaimer')}
        </p>
      </section>

      {/* Credits */}
      <section id="settings-credits-section" className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#151824] to-[#11131a] border border-amber-400/20 space-y-5">
        <div className="flex items-center gap-2.5 text-amber-300">
          <Award className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">קרדיטים ותודות</h2>
        </div>
        <p className="text-sm leading-6 text-zinc-300">תודה לכל מי שעזר לנו לבנות את פשוט מוזיקה ולהפוך את הרעיון למציאות.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm text-white"><strong className="block text-amber-300">Spotify</strong><span className="text-xs text-zinc-400">מקור השראה ושירותי קטלוג</span></div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm text-white"><strong className="block text-red-300">YouTube</strong><span className="text-xs text-zinc-400">קליפים רשמיים ומקורות וידאו</span></div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm text-white"><strong className="block text-blue-300">עוז</strong><span className="text-xs text-zinc-400">המתכנת</span></div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm text-white"><strong className="block text-emerald-300">יהונתן</strong><span className="text-xs text-zinc-400">יועץ ופיתוח האתר</span></div>
        </div>
      </section>

      {/* iOS / PWA Guide Modal from Settings */}
      {showPwaGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            id="settings-pwa-modal"
            className="w-full max-w-sm bg-[#151720] border border-white/10 rounded-2xl p-6 shadow-2xl text-white space-y-4 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold">
              הוספה למסך הבית
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed">
              התקנת "פשוט מוזיקה" במסך הבית מאפשרת להאזין כמו באפליקציה מקורית:
            </p>

            <div className="space-y-2.5 text-start bg-white/5 p-3.5 rounded-xl border border-white/5 text-xs text-zinc-300">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <span>בספארי / אייפון: לחץ על כפתור השיתוף (<Share className="w-3.5 h-3.5 inline text-blue-400" />)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <span>בחר <strong>״הוסף למסך הבית״</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <span>באנדרואיד / כרום: לחץ על שלוש הנקודות ⋮ ובחר "התקן אפליקציה"</span>
              </div>
            </div>

            <button
              onClick={() => setShowPwaGuide(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
            >
              הבנתי, סגור
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
