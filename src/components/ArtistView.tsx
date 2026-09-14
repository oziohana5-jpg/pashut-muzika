import React, { useEffect, useState } from 'react';
import { Play, Shuffle, CheckCircle, Heart, Plus, Headphones, Disc3, Sparkles, Users, ArrowUpLeft, SearchX } from 'lucide-react';
import { Artist, Song, Album } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime, formatNumber } from '../utils/formatters';
import { DEFAULT_ARTIST_IMAGE, handleImageError } from '../utils/imageFallback';

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
  const [showVerifiedInfo, setShowVerifiedInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setProfileError(false);
    let cachedArtist: Artist | null = null;
    try {
      cachedArtist = JSON.parse(sessionStorage.getItem(`simply_music_artist_${artistId}`) || 'null');
    } catch {}
    const query = cachedArtist
      ? `?name=${encodeURIComponent(cachedArtist.nameHe || cachedArtist.name)}&imageUrl=${encodeURIComponent(cachedArtist.imageUrl || '')}&genre=${encodeURIComponent(cachedArtist.genres?.[0] || '')}`
      : '';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    fetch(`/api/music/artist/${artistId}${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Artist request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setArtist(data.artist);
        setSongs(data.topTracks || data.popularSongs || []);
        setAlbums(data.albums || []);
        setIsFollowing(data.isFollowing || false);
        setFollowerCount(data.artist?.followerCount || 0);
        if (!data.artist) setProfileError(true);
      })
      .catch((err) => {
        console.error('Failed to load artist:', err);
        setProfileError(true);
        if (cachedArtist) {
          setArtist(cachedArtist);
          setSongs([]);
          setAlbums([]);
          setProfileError(false);
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
        setLoading(false);
      });
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
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

  if (!artist || profileError) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-5 text-center">
        <div className="w-full rounded-3xl border border-white/10 bg-[#13151d] px-6 py-12 shadow-2xl shadow-black/20">
          <SearchX className="mx-auto mb-4 h-12 w-12 text-zinc-500" />
          <h1 className="text-xl font-black text-white">אממ...</h1>
          <p className="mt-2 text-sm text-zinc-400">לא הצלחנו למצוא את הפרופיל הזה</p>
          <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500">נסה שוב</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 text-right">
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#0e1118]">
        <div className="absolute inset-0 -z-20">
            <img src={artist.bannerUrl || artist.imageUrl || DEFAULT_ARTIST_IMAGE} alt="" onError={(event) => handleImageError(event, DEFAULT_ARTIST_IMAGE)} className="h-full w-full object-cover opacity-20 blur-2xl" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#080a0f_8%,rgba(8,10,15,.9)_58%,rgba(8,10,15,.55)),linear-gradient(0deg,#0a0b0e_0%,transparent_70%)]" />
        </div>
        <div className="mx-auto grid min-h-[430px] max-w-6xl items-end gap-7 px-5 pb-9 pt-16 sm:grid-cols-[240px_1fr] sm:gap-10 sm:px-10 sm:pb-12">
          <div className="group relative aspect-[4/5] w-40 overflow-hidden rounded-[26px] border border-white/20 bg-zinc-900 shadow-2xl shadow-black/50 sm:w-60">
            <img src={artist.imageUrl || DEFAULT_ARTIST_IMAGE} alt={artist.name} onError={(event) => handleImageError(event, DEFAULT_ARTIST_IMAGE)} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <div className="absolute bottom-3 start-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">Simply Music Artist</div>
          </div>
          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-300">
              {artist.verified && <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1.5"><CheckCircle className="h-3.5 w-3.5 fill-blue-500 text-white" /> {t('verifiedArtist')}</span>}
              {artist.genres.slice(0, 2).map((genre) => <span key={genre} className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5">{genre}</span>)}
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-zinc-500">Artist profile</p>
              <div className="relative flex items-center gap-2">
                <h1 className="min-w-0 text-4xl font-black tracking-tight text-white sm:text-7xl">{artist.nameHe || artist.name}</h1>
                {artist.verified && (
                  <button
                    type="button"
                    onClick={() => setShowVerifiedInfo((current) => !current)}
                    className="relative shrink-0 rounded-full p-0.5 text-white transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label={language === 'he' ? 'אמן מאומת' : 'Verified artist'}
                    title={language === 'he' ? 'אמן מאומת' : 'Verified artist'}
                  >
                    <CheckCircle className="h-7 w-7 fill-blue-500 text-white drop-shadow-lg sm:h-9 sm:w-9" />
                    {showVerifiedInfo && (
                      <span className="absolute start-1/2 top-full z-20 mt-2 w-max -translate-x-1/2 rounded-lg border border-blue-400/30 bg-[#111827] px-3 py-2 text-[11px] font-semibold text-blue-100 shadow-xl">
                        {language === 'he' ? 'אמן/ית מאומת/ת' : 'Verified artist'}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">{artist.bioHe || artist.bio}</p>
            <div className="grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[.05] p-3"><Users className="mb-2 h-4 w-4 text-blue-400" /><strong className="block text-lg text-white">{formatNumber(followerCount)}</strong><span className="text-[11px] text-zinc-500">{language === 'he' ? 'עוקבים אמיתיים' : 'real followers'}</span></div>
              <div className="rounded-2xl border border-white/10 bg-white/[.05] p-3"><Headphones className="mb-2 h-4 w-4 text-blue-400" /><strong className="block text-lg text-white">{songs.length}</strong><span className="text-[11px] text-zinc-500">{language === 'he' ? 'שירים' : 'tracks'}</span></div>
              <div className="hidden rounded-2xl border border-white/10 bg-white/[.05] p-3 sm:block"><Disc3 className="mb-2 h-4 w-4 text-blue-400" /><strong className="block text-lg text-white">{albums.length}</strong><span className="text-[11px] text-zinc-500">{language === 'he' ? 'אלבומים' : 'albums'}</span></div>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 border-b border-white/10 px-5 py-6 sm:px-10">
        <button id="btn-play-all-artist" onClick={playAll} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 active:scale-95"><Play className="h-4 w-4 fill-current" /> {t('playAll')}</button>
        <button id="btn-shuffle-artist" onClick={shuffleAll} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"><Shuffle className="h-4 w-4" /> {t('shuffle')}</button>
        <button id="btn-follow-artist" onClick={toggleFollow} className={`rounded-full px-5 py-3 text-sm font-semibold transition active:scale-95 ${isFollowing ? 'border border-blue-400/40 bg-blue-500/15 text-blue-300' : 'border border-white/15 bg-transparent text-white hover:bg-white/10'}`}>{isFollowing ? t('unfollow') : t('follow')}</button>
        <span className="ms-auto hidden items-center gap-1 text-xs text-zinc-500 sm:inline-flex"><ArrowUpLeft className="h-4 w-4" /> {artist.nameHe || artist.name}</span>
      </div>

      {/* Popular Tracks Section */}
      <section className="mx-auto max-w-6xl space-y-3 px-5 sm:px-10">
        <h2 className="text-xl font-bold text-white tracking-tight">
            {language === 'he' ? 'כל השירים' : 'All songs'}
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
