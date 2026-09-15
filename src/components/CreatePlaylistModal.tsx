import React, { useState, useRef } from 'react';
import { X, Plus, Radio, ImagePlus, Music2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newPlaylistId: string) => void;
}

// Pretty gradient covers — shown when no image chosen
const PLAYLIST_GRADIENTS = [
  { id: 'g1', from: '#7c3aed', to: '#a855f7', icon: '🎵' },
  { id: 'g2', from: '#0ea5e9', to: '#6366f1', icon: '🎧' },
  { id: 'g3', from: '#f59e0b', to: '#ef4444', icon: '🔥' },
  { id: 'g4', from: '#10b981', to: '#0ea5e9', icon: '🌊' },
  { id: 'g5', from: '#ec4899', to: '#f97316', icon: '💫' },
  { id: 'g6', from: '#6366f1', to: '#14b8a6', icon: '✨' },
];

function randomGradient() {
  return PLAYLIST_GRADIENTS[Math.floor(Math.random() * PLAYLIST_GRADIENTS.length)];
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { token, openAuthModal } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedGradient] = useState(randomGradient);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setCoverPreview(result);
      setCoverUrl(result); // base64 — send to server
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCoverPreview(null);
    setCoverUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openAuthModal('כדי ליצור פלייליסט ולשמור אותו בספרייה האישית, יש להתחבר לחשבון.');
      return;
    }
    setLoading(true);
    setError(null);

    // If no image chosen, pass gradient metadata as coverUrl placeholder
    const finalCoverUrl = coverUrl || `gradient:${selectedGradient.from}:${selectedGradient.to}:${selectedGradient.icon}`;

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, isPublic, coverUrl: finalCoverUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create playlist');
      } else {
        onCreated(data.playlist.id);
        onClose();
        // Reset
        setName(''); setDescription(''); setCoverUrl(''); setCoverPreview(null);
      }
    } catch (err: any) {
      setError(err.message || 'Error creating playlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#12141a] border border-white/10 rounded-2xl shadow-2xl p-6 text-white">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 mb-3 border border-blue-500/20">
            <Radio className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">{t('createPlaylist')}</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Cover image picker */}
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="relative shrink-0">
              {coverPreview ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden">
                  <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ) : (
                /* Gradient fallback preview */
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${selectedGradient.from}, ${selectedGradient.to})` }}
                >
                  {selectedGradient.icon}
                </div>
              )}
            </div>

            {/* Upload button */}
            <div className="flex-1">
              <p className="text-xs font-medium text-zinc-300 mb-1.5">תמונת עטיפה</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition"
              >
                <ImagePlus className="w-4 h-4" />
                {coverPreview ? 'החלף תמונה' : 'בחר תמונה'}
              </button>
              {!coverPreview && (
                <p className="text-[11px] text-zinc-600 mt-1.5 flex items-center gap-1">
                  <Music2 className="w-3 h-3" />
                  אם לא תבחר — נשתמש בעיצוב צבעוני אוטומטי
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFile}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              {t('playlistName')} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שירים לנסיעה / My Favorites"
              className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              {t('playlistDescription')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="תיאור קצר לפלייליסט..."
              className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="playlist-public-check"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 bg-zinc-800 focus:ring-0"
            />
            <label htmlFor="playlist-public-check" className="text-xs text-zinc-300 cursor-pointer">
              {t('publicPlaylist')}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? '...' : t('createPlaylist')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
