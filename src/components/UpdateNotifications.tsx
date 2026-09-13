import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { AppUpdate, ActiveTab } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface UpdateNotificationsProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

const READ_UPDATES_KEY = 'simply_music_read_updates';
const NOTIFICATION_ENABLED_KEY = 'simply_music_browser_notifications';

export const UpdateNotifications: React.FC<UpdateNotificationsProps> = ({ onNavigateTab }) => {
  const { language } = useLanguage();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(READ_UPDATES_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const knownIdsRef = useRef<Set<string> | null>(null);

  const loadUpdates = async () => {
    try {
      const response = await fetch('/api/updates', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json() as { updates?: AppUpdate[] };
      const nextUpdates = Array.isArray(data.updates) ? data.updates : [];
      const nextIds = new Set(nextUpdates.map((update) => update.id));

      if (knownIdsRef.current) {
        nextUpdates
          .filter((update) => !knownIdsRef.current?.has(update.id))
          .slice(0, 3)
          .forEach((update) => {
            if (permission === 'granted') {
              new Notification(update.title, {
                body: update.body.slice(0, 140),
                icon: '/icon-192.png',
                tag: update.id,
              });
            }
          });
      } else if (readIds.length === 0) {
        const initialIds = nextUpdates.map((update) => update.id);
        setReadIds(initialIds);
        localStorage.setItem(READ_UPDATES_KEY, JSON.stringify(initialIds));
      }

      knownIdsRef.current = nextIds;
      setUpdates(nextUpdates);
    } catch {
      // Notifications should never interrupt the music experience.
    }
  };

  useEffect(() => {
    void loadUpdates();
    const timer = window.setInterval(() => void loadUpdates(), 30000);
    return () => window.clearInterval(timer);
  }, [permission]);

  const unreadUpdates = updates.filter((update) => !readIds.includes(update.id));

  const markAllRead = () => {
    const ids = updates.map((update) => update.id);
    setReadIds(ids);
    localStorage.setItem(READ_UPDATES_KEY, JSON.stringify(ids));
  };

  const enableBrowserNotifications = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      localStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
    }
  };

  return (
    <div className="relative">
      <button
        id="btn-update-notifications"
        onClick={() => {
          setIsOpen((current) => !current);
          if (!isOpen) markAllRead();
        }}
        className="relative rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
        aria-label={language === 'he' ? 'התראות עדכונים' : 'Update notifications'}
        title={language === 'he' ? 'התראות עדכונים' : 'Update notifications'}
      >
        <Bell className="h-4 w-4" />
        {unreadUpdates.length > 0 && <span className="absolute end-1 top-1 h-2 w-2 rounded-full bg-blue-400 ring-2 ring-[#0a0b0e]" />}
      </button>

      {isOpen && (
        <div className="absolute end-0 top-11 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/10 bg-[#151821] text-right shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div><p className="text-sm font-bold text-white">{language === 'he' ? 'עדכונים' : 'Updates'}</p><p className="text-[11px] text-zinc-500">{unreadUpdates.length ? `${unreadUpdates.length} ${language === 'he' ? 'חדשים' : 'new'}` : language === 'he' ? 'הכול נקרא' : 'All read'}</p></div>
            {unreadUpdates.length > 0 && <button onClick={markAllRead} className="inline-flex items-center gap-1 text-[11px] text-blue-300 hover:text-white"><Check className="h-3.5 w-3.5" /> {language === 'he' ? 'סמן כנקרא' : 'Mark read'}</button>}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {updates.slice(0, 5).map((update) => <button key={update.id} onClick={() => { markAllRead(); setIsOpen(false); onNavigateTab('updates'); }} className="block w-full border-b border-white/5 px-4 py-3 text-start transition hover:bg-white/5">
              <p className="truncate text-xs font-bold text-white">{update.title}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-zinc-400">{update.body}</p>
            </button>)}
            {updates.length === 0 && <p className="px-4 py-8 text-center text-xs text-zinc-500">{language === 'he' ? 'אין עדכונים כרגע' : 'No updates yet'}</p>}
          </div>

          <div className="space-y-2 border-t border-white/10 p-3">
            {permission === 'default' && <button onClick={enableBrowserNotifications} className="w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/20">{language === 'he' ? 'הפעל התראות בדפדפן' : 'Enable browser notifications'}</button>}
            {permission === 'denied' && <p className="text-[10px] leading-4 text-zinc-500">{language === 'he' ? 'ההתראות נחסמו בדפדפן. אפשר לאשר אותן דרך הגדרות האתר.' : 'Notifications are blocked. Allow them in browser site settings.'}</p>}
            <button onClick={() => { setIsOpen(false); onNavigateTab('updates'); }} className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"><ExternalLink className="h-3.5 w-3.5" /> {language === 'he' ? 'פתח את כל העדכונים' : 'View all updates'}</button>
          </div>
        </div>
      )}
    </div>
  );
};
