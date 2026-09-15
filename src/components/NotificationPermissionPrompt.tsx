import React, { useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const PROMPT_SEEN_KEY = 'simply_music_notification_prompt_seen';

async function subscribeToPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    // Check if already subscribed
    const existing = await reg.pushManager.getSubscription();
    if (existing) return; // already subscribed

    // Fetch VAPID public key from server
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) return;
    const { publicKey } = await res.json() as { publicKey: string };

    // Convert base64url to Uint8Array
    const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
    const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawKey = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: rawKey,
    });

    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });
  } catch (err) {
    console.warn('[push] subscribe failed:', err);
  }
}

export const NotificationPermissionPrompt: React.FC = () => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    if (localStorage.getItem(PROMPT_SEEN_KEY) === 'true') return;
    const timer = window.setTimeout(() => setVisible(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  // If permission already granted on mount, subscribe silently
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      subscribeToPush();
    }
  }, []);

  const close = () => {
    localStorage.setItem(PROMPT_SEEN_KEY, 'true');
    setVisible(false);
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) return close();
    setRequesting(true);
    const result = await Notification.requestPermission();
    if (result === 'granted' && 'serviceWorker' in navigator) {
      await subscribeToPush();
    }
    setRequesting(false);
    close();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 top-16 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-top-3 duration-300 sm:start-auto sm:end-6 sm:mx-0">
      <div className="rounded-2xl border border-blue-500/30 bg-[#151a26]/95 p-4 text-right shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-xl border border-blue-500/30 bg-blue-500/15 p-2.5 text-blue-300"><Bell className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-bold text-white">{language === 'he' ? 'רוצה לקבל עדכונים?' : 'Want to receive updates?'}</h2>
              <button onClick={close} className="rounded-lg p-1 text-zinc-500 hover:bg-white/10 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-1 text-xs leading-5 text-zinc-400">{language === 'he' ? 'שירים חדשים ועדכונים חשובים בלבד. אנחנו לא חופרים.' : 'Only new releases and important updates. No spam.'}</p>
            <button onClick={requestPermission} disabled={requesting} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-60">
              <Check className="h-4 w-4" />
              {language === 'he' ? 'קבל עדכונים' : 'Enable updates'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
