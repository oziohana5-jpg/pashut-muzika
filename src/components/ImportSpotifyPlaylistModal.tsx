import React, { useState } from 'react';
import { Link, Music2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ImportSpotifyPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (playlistId: string) => void;
}

export const ImportSpotifyPlaylistModal: React.FC<ImportSpotifyPlaylistModalProps> = ({ isOpen, onClose, onImported }) => {
  const { token, openAuthModal } = useAuth();
  const { language } = useLanguage();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      openAuthModal(language === 'he' ? 'כדי לייבא פלייליסט, יש להתחבר לחשבון.' : 'Sign in to import a playlist.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/playlists/import/spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || (language === 'he' ? 'הייבוא נכשל.' : 'Import failed.'));
        return;
      }
      setUrl('');
      onClose();
      onImported(data.playlist.id);
    } catch {
      setError(language === 'he' ? 'לא ניתן להתחבר לשרת. נסה שוב.' : 'Could not reach the server. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12141a] p-6 text-white shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 rounded-full p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white" aria-label={language === 'he' ? 'סגור' : 'Close'}>
          <X className="h-5 w-5" />
        </button>
        <div className="mb-5 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/15 text-green-400"><Music2 className="h-6 w-6" /></div>
          <h2 className="text-xl font-bold">{language === 'he' ? 'ייבוא פלייליסט מספוטיפיי' : 'Import Spotify playlist'}</h2>
          <p className="mt-2 text-xs leading-5 text-zinc-400">{language === 'he' ? 'הדבק קישור לפלייליסט ציבורי ונעתיק את השם, התמונה ורשימת השירים.' : 'Paste a public playlist link to copy its name, cover, and tracks.'}</p>
        </div>
        {error && <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-xs leading-5 text-red-300">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-medium text-zinc-300">
            {language === 'he' ? 'קישור לפלייליסט' : 'Playlist link'}
            <div className="relative mt-1.5">
              <Link className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input autoFocus required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://open.spotify.com/playlist/..." className="w-full rounded-xl border border-white/10 bg-[#181a22] py-3 ps-10 pe-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-green-500" />
            </div>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl bg-white/5 px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/10">{language === 'he' ? 'ביטול' : 'Cancel'}</button>
            <button type="submit" disabled={loading} className="rounded-xl bg-green-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-500 disabled:opacity-50">{loading ? (language === 'he' ? 'מייבא...' : 'Importing...') : (language === 'he' ? 'ייבא פלייליסט' : 'Import playlist')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};