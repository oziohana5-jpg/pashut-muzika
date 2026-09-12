import React, { useState, useEffect } from 'react';
import { X, Plus, Check, ListPlus, Music2, FolderPlus, Loader2 } from 'lucide-react';
import { Song, Playlist } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  song,
}) => {
  const { user, token, openAuthModal } = useAuth();
  const { t } = useLanguage();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !token) return;

    setLoading(true);
    fetch('/api/user/library', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const userPlaylists: Playlist[] = data.playlists || [];
        setPlaylists(userPlaylists);

        // Mark playlists that already contain this song
        if (song) {
          const already = new Set<string>();
          userPlaylists.forEach((p) => {
            if (p.songIds && p.songIds.includes(song.id)) {
              already.add(p.id);
            }
          });
          setAddedIds(already);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen, token, song]);

  if (!isOpen || !song) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!token || !user) {
      openAuthModal('כדי להוסיף שירים לפלייליסטים שלך, יש להתחבר לחשבון.');
      return;
    }

    setAddingId(playlistId);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId: song.id }),
      });

      if (res.ok) {
        setAddedIds((prev) => new Set(prev).add(playlistId));
        showToast('השיר נוסף לפלייליסט בהצלחה! ✨');
      }
    } catch (err) {
      console.error('Error adding song to playlist:', err);
    } finally {
      setAddingId(null);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !token) return;

    setCreating(true);
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          description: `נוצר עבור ${song.title}`,
          isPublic: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.playlist) {
        const newPl = data.playlist;
        // Now add song to the newly created playlist
        await fetch(`/api/playlists/${newPl.id}/songs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ songId: song.id }),
        });

        newPl.songIds = [song.id];
        setPlaylists((prev) => [newPl, ...prev]);
        setAddedIds((prev) => new Set(prev).add(newPl.id));
        setNewPlaylistName('');
        setShowCreateNew(false);
        showToast(`נוצר הפלייליסט "${newPl.name}" והשיר נוסף אליו!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="add-to-playlist-modal"
        className="relative w-full max-w-md bg-[#13151f] border border-white/10 rounded-2xl shadow-2xl p-6 text-white space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
            <ListPlus className="w-5 h-5" />
            <span>הוספה לפלייליסט</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Song Preview */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
          <img
            src={song.coverUrl}
            alt=""
            className="w-12 h-12 rounded-lg object-cover shadow"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{song.titleHe || song.title}</p>
            <p className="text-xs text-zinc-400 truncate">{song.artistName}</p>
          </div>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Playlists List */}
        {!user || !token ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-xs text-zinc-400">יש להתחבר כדי לשמור שירים לפלייליסטים אישיים</p>
            <button
              onClick={() => {
                onClose();
                openAuthModal('התחבר כדי לנהל את הפלייליסטים שלך ולשמור שירים');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow"
            >
              התחברות לחשבון
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8 text-zinc-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-xs">טוען את הפלייליסטים שלך...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Create New Toggle */}
            {!showCreateNew ? (
              <button
                onClick={() => setShowCreateNew(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-blue-500/40 hover:border-blue-500/80 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-bold transition"
              >
                <FolderPlus className="w-4 h-4" />
                <span>יצירת פלייליסט חדש</span>
              </button>
            ) : (
              <form onSubmit={handleCreateAndAdd} className="space-y-2 p-3 bg-white/5 rounded-xl border border-blue-500/30">
                <p className="text-xs font-bold text-white">פלייליסט חדש:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="שם הפלייליסט..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={creating || !newPlaylistName.trim()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition disabled:opacity-50 shrink-0"
                  >
                    {creating ? 'יוצר...' : 'צור ושמור'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateNew(false)}
                    className="p-1.5 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Existing Playlists Scrollable */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pe-1">
              {playlists.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">עדיין אין לך פלייליסטים. צור את הראשון למעלה!</p>
              ) : (
                playlists.map((pl) => {
                  const isAlreadyAdded = addedIds.has(pl.id);
                  const isCurrentAdding = addingId === pl.id;

                  return (
                    <button
                      key={pl.id}
                      onClick={() => !isAlreadyAdded && handleAddToPlaylist(pl.id)}
                      disabled={isAlreadyAdded || isCurrentAdding}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition text-start ${
                        isAlreadyAdded
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-zinc-300 opacity-90'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 text-white active:scale-[0.99]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                          <Music2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                          <p className="text-[11px] text-zinc-400">
                            {pl.songIds ? pl.songIds.length : 0} שירים
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ms-2">
                        {isAlreadyAdded ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <Check className="w-4 h-4" />
                            <span>נוסף</span>
                          </span>
                        ) : isCurrentAdding ? (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-white/10 hover:bg-blue-600 text-white flex items-center justify-center transition">
                            <Plus className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition"
          >
            סיום
          </button>
        </div>
      </div>
    </div>
  );
};
