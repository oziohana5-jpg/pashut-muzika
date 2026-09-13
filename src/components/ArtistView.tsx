import React, { useEffect, useState } from 'react';
import { Play, Shuffle, CheckCircle, Heart, Plus, Headphones, Disc3, Sparkles } from 'lucide-react';
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
  const { t, language } = useLanguage();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
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
        setFollowerCount(data.artist?.followerCount || 0);
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
      setFollowerCount((current) => current + ((data.isFollowed ?? data.isFollowing) ? 1 : -1));
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
    <div className="pb-28 text-right">
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#11151d]">
        <div className="absolute inset-0 -z-20">
          <img src={artist.bannerUrl || artist.imageUrl} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#0a0b0e_8%,rgba(10,11,14,.74)_48%,rgba(10,11,14,.28)),linear-gradient(0deg,#0a0b0e_0%,transparent_68%)]" />
        </div>
        <div className="mx-auto flex min-h-[390px] max-w-6xl flex-col items-start justify-end gap-5 px-5 pb-8 pt-14 sm:min-h-[420px] sm:flex-row sm:items-end sm:gap-8 sm:px-10 sm:pb-12">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white/20 bg-zinc-900 shadow-2xl shadow-black/50 sm:h-56 sm:w-56">
            <img src={artist.imageUrl} alt={artist.name} className="h-full w-full object-cover" />
          </div>
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-300">
              {artist.verified && <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1.5"><CheckCircle className="h-3.5 w-3.5 fill-blue-500 text-white" /> {t('verifiedArtist')}</span>}
              <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5">{artist.genres[0]}</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">{artist.nameHe || artist.name}</h1>
              {artist.verified && <CheckCircle className="h-7 w-7 shrink-0 fill-blue-500 text-white sm:h-9 sm:w-9" />}
            </div>
            <p className="max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">{artist.bioHe || artist.bio}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-300 sm:text-sm">
              <span className="inline-flex items-center gap-2"><Headphones className="h-4 w-4 text-blue-400" /> {formatNumber(followerCount)} {language === 'he' ? 'עוקבים אמיתיים' : 'real followers'}</span>
              <span className="inline-flex items-center gap-2"><Disc3 className="h-4 w-4 text-blue-400" /> {albums.length} {t('albumsAndSingles')}</span>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-7 sm:px-10">
        <button id="btn-play-all-artist" onClick={playAll} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 active:scale-95"><Play className="h-4 w-4 fill-current" /> {t('playAll')}</button>
        <button id="btn-shuffle-artist" onClick={shuffleAll} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"><Shuffle className="h-4 w-4" /> {t('shuffle')}</button>
        <button id="btn-follow-artist" onClick={toggleFollow} className={`rounded-full px-5 py-3 text-sm font-semibold transition active:scale-95 ${isFollowing ? 'border border-blue-400/40 bg-blue-500/15 text-blue-300' : 'border border-white/15 bg-transparent text-white hover:bg-white/10'}`}>{isFollowing ? t('unfollow') : t('follow')}</button>
      </div>

      {/* Popular Tracks Section */}
      <section className="mx-auto max-w-6xl space-y-3 px-5 sm:px-10">
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
                className={`flex items-center justify-between rounded-xl border-b border-white/[.06] px-2 py-3 transition group ${
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
        <section className="mx-auto mt-12 max-w-6xl space-y-4 px-5 sm:px-10">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t('albumsAndSingles')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => onNavigateAlbum(album.id)}
                className="group cursor-pointer"
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
        <section className="mx-auto mt-12 max-w-6xl space-y-3 px-5 sm:px-10">
          <h2 className="border-b border-white/10 pb-3 text-2xl font-black tracking-tight text-white">{t('biography')}</h2>
          <div className="max-w-3xl text-sm leading-7 text-zinc-300">
            {artist.bioHe || artist.bio}
          </div>
        </section>
      )}
    </div>
  );
};
