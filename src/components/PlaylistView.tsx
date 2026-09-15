import React, { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, Plus, Trash2, Edit2, Lock, Globe, Clock, Check, X } from 'lucide-react';
import { Playlist, Song } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime } from '../utils/formatters';

interface PlaylistViewProps {
  playlistId: string;
  onDeleted?: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId, onDeleted }) => {
  const { playSong, playback, isLiked, toggleLike, addToQueue } = usePlayer();
  const { user, token } = useAuth();
  const { t } = useLanguage();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPublic, setEditPublic] = useState(true);

  // Add Songs modal
  const [isAddingSongs, setIsAddingSongs] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);

  const fetchPlaylist = () => {
    setLoading(true);
    fetch(`/api/music/playlists/${playlistId}`)
      .then((res) => res.json())
      .then((data) => {
        setPlaylist(data.playlist);
        setSongs(data.songs || []);
        if (data.playlist) {
          setEditName(data.playlist.name);
          setEditDesc(data.playlist.description || '');
          setEditPublic(data.playlist.isPublic);
        }
      })
      .catch((err) => console.error('Failed to load playlist:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlaylist();
  }, [playlistId]);

  const isOwner = user && playlist && (user.id === playlist.ownerId || user.role === 'admin');

  const handleSaveEdit = async () => {
    if (!token || !playlist) return;
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          isPublic: editPublic,
        }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchPlaylist();
      }
    } catch (err) {
      console.error('Failed to update playlist:', err);
    }
  };

  const handleDelete = async () => {
    if (!token || !playlist || !window.confirm(t('confirmDeletePlaylist'))) return;
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && onDeleted) {
        onDeleted();
      }
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  const handleRemoveTrack = async (songId: string) => {
    if (!token || !playlist) return;
    try {
      const res = await fetch(`/api/playlists/${playlist.id}/songs/${songId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSongs(prev => prev.filter(s => s.id !== songId));
      }
    } catch (err) {
      console.error('Failed to remove track:', err);
    }
  };

  const openAddSongsModal = async () => {
    setIsAddingSongs(true);
    try {
      const res = await fetch('/api/music/search?q=');
      const data = await res.json();
      setAvailableSongs(data.songs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTrack = async (songId: string) => {
    if (!token || !playlist) return;
    try {
      const res = await fetch(`/api/playlists/${playlist.id}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId }),
      });
      if (res.ok) {
        fetchPlaylist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const playAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs.slice(1));
    }
  };

  const shuffleAll = () => {
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled.slice(1));
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="space-y-8 pb-28 pt-2 px-4 sm:px-8">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 pt-4">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden bg-zinc-900 shrink-0 shadow-2xl border border-white/10">
          {playlist.coverUrl?.startsWith('gradient:') ? (() => {
            const [, from, to, icon] = playlist.coverUrl.split(':');
            return (
              <div
                className="w-full h-full flex items-center justify-center text-7xl"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              >
                {icon}
              </div>
            );
          })() : (
            <img
              src={playlist.coverUrl}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="text-center sm:text-start space-y-2 flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">
              {t('tabPlaylists')}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
              {playlist.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {playlist.isPublic ? t('publicPlaylist') : t('privatePlaylist')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {playlist.name}
          </h1>

          {playlist.description && (
            <p className="text-sm text-zinc-400 max-w-xl">
              {playlist.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-zinc-400">
            <span className="text-zinc-300 font-medium">{playlist.ownerName}</span>
            <span>•</span>
            <span>{songs.length} {t('tracksCount')}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={playAll}
          disabled={songs.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 active:scale-95 transition disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{t('playAll')}</span>
        </button>

        <button
          onClick={shuffleAll}
          disabled={songs.length === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium text-sm border border-white/5 active:scale-95 transition disabled:opacity-50"
        >
          <Shuffle className="w-4 h-4" />
          <span>{t('shuffle')}</span>
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-sm font-medium border border-white/5 transition"
            >
              <Edit2 className="w-4 h-4" />
              <span>{t('editPlaylist')}</span>
            </button>

            <button
              onClick={openAddSongsModal}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm font-medium border border-blue-500/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addSongsToPlaylist')}</span>
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200"
              title={t('deletePlaylist')}
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('deletePlaylist')}</span>
            </button>
          </>
        )}
      </div>

      {/* Song List */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/5">
          <div className="flex items-center gap-4">
            <span className="w-6 text-center">#</span>
            <span>{t('trackTitle')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {songs.map((song, index) => {
          const isPlayingThis = playback.currentSong?.id === song.id && playback.isPlaying;
          const liked = isLiked(song.id);

          return (
            <div
              key={song.id}
              className={`flex items-center justify-between p-2.5 rounded-xl transition group ${
                isPlayingThis ? 'bg-blue-600/10' : 'hover:bg-white/5'
              }`}
            >
              <div
                onClick={() => playSong(song, songs)}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
              >
                <span className="text-xs text-zinc-500 w-6 text-center font-mono">
                  {index + 1}
                </span>

                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-900">
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 pe-2">
                  <p
                    className={`text-sm font-semibold truncate ${
                      isPlayingThis ? 'text-blue-400' : 'text-white'
                    }`}
                  >
                    {song.titleHe || song.title}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {song.artistName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleLike(song.id, song)}
                  className={`p-2 rounded-full transition ${
                    liked ? 'text-rose-500' : 'text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100'
                  }`}
                  aria-label="Like"
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
                </button>

                <button
                  onClick={() => addToQueue(song)}
                  className="p-2 text-zinc-500 hover:text-white transition opacity-0 group-hover:opacity-100"
                  title={t('addToQueue')}
                >
                  <Plus className="w-4 h-4" />
                </button>

                {isOwner && (
                  <button
                    onClick={() => handleRemoveTrack(song.id)}
                    className="p-2 text-zinc-500 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
                    title={t('remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <span className="text-xs text-zinc-500 font-mono px-2">
                  {formatTime(song.duration)}
                </span>
              </div>
            </div>
          );
        })}

        {songs.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm">
            {t('noTracksInPlaylist')}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 text-white">
            <h3 className="text-lg font-bold">{t('editPlaylist')}</h3>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                {t('playlistName')}
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                {t('playlistDescription')}
              </label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-public-checkbox"
                checked={editPublic}
                onChange={(e) => setEditPublic(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0 w-4 h-4 bg-zinc-800"
              />
              <label htmlFor="edit-public-checkbox" className="text-xs text-zinc-300">
                {t('publicPlaylist')}
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Songs Picker Modal */}
      {isAddingSongs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-lg font-bold">{t('addSongsToPlaylist')}</h3>
              <button
                onClick={() => setIsAddingSongs(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-1">
              {availableSongs.map((s) => {
                const alreadyAdded = songs.some((curr) => curr.id === s.id);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={s.coverUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-zinc-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.titleHe || s.title}</p>
                        <p className="text-xs text-zinc-400 truncate">{s.artistName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddTrack(s.id)}
                      disabled={alreadyAdded}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        alreadyAdded
                          ? 'bg-zinc-800 text-zinc-500'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {alreadyAdded ? t('save') : t('addToPlaylist')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
