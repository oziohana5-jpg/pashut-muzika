import React, { useEffect, useState } from 'react';
import { Play, Shuffle, CheckCircle, Heart, Plus, Music, Clock } from 'lucide-react';
import { Artist, Song, Album } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime, formatNumber } from '../utils/formatters';

interface ArtistViewProps {
  artistId: string;
  onNavigateAlbum: (id: string) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ artistId, onNavigateAlbum }) => {
  const { playSong, playback, isLiked, toggleLike, addToQueue } = usePlayer();
  const { token } = useAuth();
  const { t } = useLanguage();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/music/artist/${artistId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        setArtist(data.artist);
        setSongs(data.topTracks || data.popularSongs || []);
        setAlbums(data.albums || []);
        setIsFollowing(data.isFollowing || false);
      })
      .catch((err) => console.error('Failed to load artist:', err))
      .finally(() => setLoading(false));
  }, [artistId, token]);

  const toggleFollow = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/user/followed/${artistId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIsFollowing(data.isFollowed ?? data.isFollowing);
      if (artist) {
        setArtist({
          ...artist,
          monthlyListeners: (artist.monthlyListeners || 0) + ((data.isFollowed ?? data.isFollowing) ? 1 : -1),
        });
      }
    } catch (err) {
      console.error('Failed to follow:', err);
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

  if (!artist) return null;

  return (
    <div className="space-y-8 pb-28">
      {/* Artist Hero Header */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden flex items-end p-6 sm:p-10 border-b border-white/5">
        <div className="absolute inset-0 bg-zinc-900">
          <img
            src={artist.imageUrl}
            alt={artist.name}
            className="w-full h-full object-cover object-center filter brightness-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e] via-[#0a0b0e]/50 to-transparent" />
        </div>

        <div className="relative z-10 space-y-2 max-w-2xl">
          {artist.verified && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5 fill-blue-500 text-white" />
              <span>{t('verifiedArtist')}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {artist.nameHe || artist.name}
            </h1>
            {artist.verified && (
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 fill-blue-500 text-white shrink-0 drop-shadow-lg" />
            )}
          </div>

          <p className="text-xs sm:text-sm text-zinc-300">
            {formatNumber(artist.monthlyListeners)} {t('monthlyListeners')} • {artist.genres.join(', ')}
          </p>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="px-4 sm:px-8 flex flex-wrap items-center gap-3">
        <button
          id="btn-play-all-artist"
          onClick={playAll}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 active:scale-95 transition"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{t('playAll')}</span>
        </button>

        <button
          id="btn-shuffle-artist"
          onClick={shuffleAll}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium text-sm border border-white/5 active:scale-95 transition"
        >
          <Shuffle className="w-4 h-4" />
          <span>{t('shuffle')}</span>
        </button>

        <button
          id="btn-follow-artist"
          onClick={toggleFollow}
          className={`px-5 py-3 rounded-full text-sm font-semibold transition active:scale-95 ${
            isFollowing
              ? 'bg-zinc-800 text-zinc-300 border border-white/10'
              : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
          }`}
        >
          {isFollowing ? t('unfollow') : t('follow')}
        </button>      </div>

      {/* Popular Tracks Section */}
      <section className="px-4 sm:px-8 space-y-3">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {t('popularTracks')}
        </h2>
        <div className="space-y-1">
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
                  <span className="text-xs text-zinc-500 w-5 text-center font-mono">
                    {index + 1}
                  </span>

                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-900">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute inset-0 bg-black/50 flex items-center justify-center transition ${
                        isPlayingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-white text-white" />
                    </div>
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
                      {song.albumName}
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
      </section>

      {/* Albums & Singles Section */}
      {albums.length > 0 && (
        <section className="px-4 sm:px-8 space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t('albumsAndSingles')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => onNavigateAlbum(album.id)}
                className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition cursor-pointer group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2.5 shadow-md">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <p className="font-semibold text-sm text-white truncate group-hover:text-blue-400 transition">
                  {album.titleHe || album.title}
                </p>
                <span className="text-xs text-zinc-500 block mt-0.5">
                  {album.releaseYear} • {album.trackCount} {t('tracksCount')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Biography Section */}
      {artist.bio && (
        <section className="px-4 sm:px-8 space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t('biography')}
          </h2>          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 max-w-3xl text-sm leading-relaxed text-zinc-300">
            {artist.bioHe || artist.bio}
          </div>
        </section>
      )}
    </div>
  );
};
