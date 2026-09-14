import React, { useEffect, useState } from 'react';
import { Play, Shuffle, Heart, Plus, Clock, Disc3 } from 'lucide-react';
import { Album, Song } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime } from '../utils/formatters';

interface AlbumViewProps {
  albumId: string;
  onNavigateArtist: (id: string) => void;
}

export const AlbumView: React.FC<AlbumViewProps> = ({ albumId, onNavigateArtist }) => {
  const { playSong, playback, isLiked, toggleLike, addToQueue } = usePlayer();
  const { t } = useLanguage();

  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/music/albums/${albumId}`)
      .then((res) => res.json())
      .then((data) => {
        setAlbum(data.album);
        setSongs(data.tracks || data.songs || []);
      })
      .catch((err) => console.error('Failed to load album:', err))
      .finally(() => setLoading(false));
  }, [albumId]);

  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

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

  if (!album) return null;

  return (
    <div className="space-y-8 pb-28 pt-2 px-4 sm:px-8">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 pt-4">
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden bg-zinc-900 shrink-0 shadow-2xl border border-white/10">
          <img
            src={album.coverUrl}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="text-center sm:text-start space-y-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">
            {t('tabAlbums')}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {album.titleHe || album.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-zinc-300">
            <button
              onClick={() => onNavigateArtist(album.artistId)}
              className="font-semibold text-white hover:text-blue-400 hover:underline transition"
            >
              {album.artistName}
            </button>
            <span>•</span>
            <span>{album.releaseYear}</span>
            <span>•</span>
            <span>{songs.length} {t('tracksCount')}</span>
            <span>•</span>
            <span className="font-mono text-zinc-400">{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Play / Shuffle Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={playAll}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 active:scale-95 transition"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{t('playAll')}</span>
        </button>

        <button
          onClick={shuffleAll}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium text-sm border border-white/5 active:scale-95 transition"
        >
          <Shuffle className="w-4 h-4" />
          <span>{t('shuffle')}</span>
        </button>
      </div>

      {/* Tracklist */}
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

                <span className="text-xs text-zinc-500 font-mono px-2">
                  {formatTime(song.duration)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
