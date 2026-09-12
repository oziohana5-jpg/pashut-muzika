import React, { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, Plus, Clock } from 'lucide-react';
import { Song } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime } from '../utils/formatters';

export const LikedSongsView: React.FC = () => {
  const { playSong, playback, isLiked, toggleLike, addToQueue, likedSongIds } = usePlayer();
  const { token } = useAuth();
  const { t } = useLanguage();

  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('simply_music_cached_liked_songs') || '{}');
      return Object.values(cached) as Song[];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchLikedSongs = async () => {
    setLoading(true);
    let loadedSongs: Song[] = [];

    // 1. If user is logged in, fetch from backend
    if (token) {
      try {
        const res = await fetch('/api/user/liked', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.songs && Array.isArray(data.songs)) {
          loadedSongs = data.songs;
        }
      } catch (err) {
        console.warn('Error fetching server liked songs:', err);
      }
    }

    // 2. Load from local cache
    try {
      const cachedMap = JSON.parse(localStorage.getItem('simply_music_cached_liked_songs') || '{}');
      const cachedSongs: Song[] = Object.values(cachedMap);

      // 3. For any likedSongIds not in loadedSongs or cachedSongs, fetch via batch endpoint
      const savedIds: string[] = JSON.parse(localStorage.getItem('simply_music_liked_songs') || '[]');
      const currentLoadedIds = new Set(loadedSongs.map((s) => s.id));
      const missingIds = savedIds.filter((id) => !currentLoadedIds.has(id));

      if (missingIds.length > 0) {
        // Check cache first
        for (const s of cachedSongs) {
          if (missingIds.includes(s.id) && !currentLoadedIds.has(s.id)) {
            loadedSongs.push(s);
            currentLoadedIds.add(s.id);
          }
        }

        const stillMissing = missingIds.filter((id) => !currentLoadedIds.has(id));
        if (stillMissing.length > 0) {
          const batchRes = await fetch('/api/music/songs/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: stillMissing }),
          });
          const batchData = await batchRes.json();
          if (batchData.songs && Array.isArray(batchData.songs)) {
            for (const s of batchData.songs) {
              if (!currentLoadedIds.has(s.id)) {
                loadedSongs.push(s);
                currentLoadedIds.add(s.id);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error syncing local liked songs:', err);
    }

    setSongs(loadedSongs);
    setLoading(false);
  };

  useEffect(() => {
    fetchLikedSongs();
  }, [token, likedSongIds.size]);

  const handleUnlike = async (songId: string) => {
    await toggleLike(songId);
    setSongs((prev) => prev.filter((s) => s.id !== songId));
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

  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-28 pt-2 px-4 sm:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 pt-4">
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shrink-0 shadow-2xl shadow-rose-600/30 border border-white/10">
          <Heart className="w-20 h-20 text-white fill-white drop-shadow-md" />
        </div>

        <div className="text-center sm:text-start space-y-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-rose-400">
            {t('tabPlaylists')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {t('likedSongsTitle')}
          </h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-zinc-400">
            <span>{songs.length} {t('tracksCount')}</span>
            <span>•</span>
            <span className="font-mono">{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
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
      </div>

      {/* List */}
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
                  onClick={() => handleUnlike(song.id)}
                  className="p-2 rounded-full text-rose-500 hover:text-rose-400 transition"
                  aria-label="Remove from liked"
                  title={t('remove')}
                >
                  <Heart className="w-4 h-4 fill-rose-500" />
                </button>

                <button
                  onClick={() => addToQueue(song)}
                  className="p-2 text-zinc-500 hover:text-white transition opacity-0 group-hover:opacity-100"
                  title={t('addToQueue')}
                >
                  <Plus className="w-4 h-4" />
                </button>

                <span className="text-xs text-zinc-500 font-mono px-2">
                  {formatTime(song.duration)}
                </span>
              </div>
            </div>
          );
        })}

        {songs.length === 0 && (
          <div className="text-center py-16 text-zinc-500 text-sm">
            {t('noLikedSongs')}
          </div>
        )}
      </div>
    </div>
  );
};
