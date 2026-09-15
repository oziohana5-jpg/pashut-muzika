const PUSH_SW_URL = '/sw.js';

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    return await navigator.serviceWorker.register(`${PUSH_SW_URL}?v=2`, { updateViaCache: 'none' });
  } catch (error) {
    console.warn('[push] service worker registration failed:', error);
    return null;
  }
}

function decodeVapidKey(publicKey: string): Uint8Array {
  const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
  const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    const registration = await registerPushServiceWorker();
    if (!registration || !('PushManager' in window)) return false;

    const existing = await registration.pushManager.getSubscription();
    let subscription = existing;

    if (!subscription) {
      const response = await fetch('/api/push/vapid-public-key', { cache: 'no-store' });
      if (!response.ok) return false;
      const { publicKey } = await response.json() as { publicKey?: string };
      if (!publicKey) return false;

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(publicKey),
      });
    }

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });
    return response.ok;
  } catch (error) {
    console.warn('[push] subscribe failed:', error);
    return false;
  }
}
