import React, { useEffect, useState, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight, Sparkles, Flame, Clock, Disc3, Users, Radio, Heart, Smartphone, ArrowDownToLine, Apple, ExternalLink, Monitor, CheckCircle } from 'lucide-react';
import { HomeData, Song, Album, Artist, Playlist } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { handleImageError, DEFAULT_ARTIST_IMAGE, DEFAULT_ALBUM_COVER } from '../utils/imageFallback';

interface HomeViewProps {
  onNavigateArtist: (id: string) => void;
  onNavigateAlbum: (id: string) => void;
  onNavigatePlaylist: (id: string) => void;
  onOpenApkModal?: (tab?: 'windows' | 'website' | 'android' | 'ios') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateArtist,
  onNavigateAlbum,
  onNavigatePlaylist,
  onOpenApkModal,
}) => {
  const { playSong, playback } = usePlayer();
  const { user, token } = useAuth();
  const { t, direction } = useLanguage();

  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greetingMorning');
    if (hour < 17) return t('greetingAfternoon');
    if (hour < 21) return t('greetingEvening');
    return t('greetingNight');
  };

  useEffect(() => {
    setLoading(true);
    fetch('/api/music/home', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((homeData: HomeData) => {
        setData(homeData);
      })
      .catch((err) => console.error('Failed to load home data:', err))
      .finally(() => setLoading(false));
  }, [token]);

  // Horizontal scroll helper
  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, directionOffset: number) => {
    if (ref.current) {
      const scrollAmount = direction === 'rtl' ? -directionOffset : directionOffset;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-400 font-medium">טוען קטלוג מוזיקה...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-10 pb-28 pt-2">
      {/* Top Greeting Header & Categories */}
      <section className="px-4 sm:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {getGreeting()}
            {user ? `, ${user.displayName || user.username}` : ''}
          </h1>
        </div>

        {/* Recently Played Quick Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.recentlyPlayed.slice(0, 8).map((song) => {
            const isPlayingThis = playback.currentSong?.id === song.id && playback.isPlaying;
            return (
              <div
                key={`recent-${song.id}`}
                onClick={() => playSong(song, data.recentlyPlayed)}
                className="group relative flex items-center bg-zinc-900/60 hover:bg-zinc-800/80 rounded-xl overflow-hidden cursor-pointer transition border border-white/5 shadow-sm pe-3"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-zinc-900 overflow-hidden relative">
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  {isPlayingThis && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 px-3">
                  <p className="text-xs sm:text-sm font-semibold text-white truncate">
                    {song.titleHe || song.title}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {song.artistName}
                  </p>
                </div>
                <button
                  className={`w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition opacity-0 group-hover:opacity-100 group-hover:scale-105 active:scale-95 shrink-0 ${
                    isPlayingThis ? 'opacity-100' : ''
                  }`}
                  aria-label="Play"
                >
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Made For You Carousel */}
      <CarouselSection
        title={t('sectionMadeForYou')}
        subtitle={t('appTagline')}
        icon={<Sparkles className="w-4 h-4 text-blue-400" />}
      >
        {data.madeForYou.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            queue={data.madeForYou}
            onPlay={() => playSong(song, data.madeForYou)}
            onArtistClick={() => onNavigateArtist(song.artistId)}
            onAlbumClick={() => song.albumId && onNavigateAlbum(song.albumId)}
            isPlaying={playback.currentSong?.id === song.id && playback.isPlaying}
          />
        ))}
      </CarouselSection>

      {/* Popular Songs */}
      <CarouselSection
        title={t('sectionPopularSongs')}
        icon={<Flame className="w-4 h-4 text-rose-400" />}
      >
        {data.popularSongs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            queue={data.popularSongs}
            onPlay={() => playSong(song, data.popularSongs)}
            onArtistClick={() => onNavigateArtist(song.artistId)}
            onAlbumClick={() => song.albumId && onNavigateAlbum(song.albumId)}
            isPlaying={playback.currentSong?.id === song.id && playback.isPlaying}
          />
        ))}
      </CarouselSection>

      {/* Popular Albums */}
      <CarouselSection
        title={t('sectionPopularAlbums')}
        icon={<Disc3 className="w-4 h-4 text-amber-400" />}
      >
        {data.popularAlbums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onClick={() => onNavigateAlbum(album.id)}
            onArtistClick={() => onNavigateArtist(album.artistId)}
          />
        ))}
      </CarouselSection>

      {/* Popular Artists */}
      <CarouselSection
        title={t('sectionPopularArtists')}
        icon={<Users className="w-4 h-4 text-emerald-400" />}
      >
        {data.popularArtists.map((artist) => (
          <ArtistCard
            key={artist.id}
            artist={artist}
            onClick={() => onNavigateArtist(artist.id)}
          />
        ))}
      </CarouselSection>

      {/* Recommended Playlists */}
      {data.recommendedPlaylists && data.recommendedPlaylists.length > 0 && (
        <CarouselSection
          title={t('sectionRecommendedPlaylists')}
          icon={<Radio className="w-4 h-4 text-indigo-400" />}
        >
          {data.recommendedPlaylists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onClick={() => onNavigatePlaylist(playlist.id)}
            />
          ))}
        </CarouselSection>
      )}

      {/* New Releases */}
      <CarouselSection
        title={t('sectionNewReleases')}
        icon={<Clock className="w-4 h-4 text-cyan-400" />}
      >
        {data.newReleases.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            queue={data.newReleases}
            onPlay={() => playSong(song, data.newReleases)}
            onArtistClick={() => onNavigateArtist(song.artistId)}
            onAlbumClick={() => song.albumId && onNavigateAlbum(song.albumId)}
            isPlaying={playback.currentSong?.id === song.id && playback.isPlaying}
          />
        ))}
      </CarouselSection>
    </div>
  );
};

// Sub-component: Carousel container with arrows
interface CarouselProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const CarouselSection: React.FC<CarouselProps> = ({ title, subtitle, icon, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { direction } = useLanguage();

  const scroll = (offset: number) => {
    if (containerRef.current) {
      const scrollAmt = direction === 'rtl' ? -offset : offset;
      containerRef.current.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  return (
    <section className="px-4 sm:px-8 space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll(-320)}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
            aria-label="Scroll Prev"
          >
            {direction === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => scroll(320)}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
            aria-label="Scroll Next"
          >
            {direction === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 -mx-4 px-4 sm:-mx-8 sm:px-8"
      >
        {children}
      </div>
    </section>
  );
};

// Song Card
interface SongCardProps {
  song: Song;
  queue: Song[];
  onPlay: () => void;
  onArtistClick: () => void;
  onAlbumClick?: () => void;
  isPlaying: boolean;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  onPlay,
  onArtistClick,
  onAlbumClick,
  isPlaying,
}) => {
  return (
    <div className="w-[150px] sm:w-[170px] shrink-0 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition duration-200 group flex flex-col justify-between">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-3 shadow-md">
        <img
          src={song.coverUrl}
          alt={song.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
        <button
          onClick={onPlay}
          className={`absolute bottom-2 end-2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/30 hover:scale-110 active:scale-95 transition ${
            isPlaying ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2'
          }`}
          aria-label="Play song"
        >
          <Play className="w-4 h-4 fill-current translate-x-0.5" />
        </button>
      </div>

      <div>
        <p
          onClick={onPlay}
          className="font-semibold text-sm text-white truncate cursor-pointer hover:text-blue-400 transition"
          title={song.titleHe || song.title}
        >
          {song.titleHe || song.title}
        </p>

        <button
          onClick={onArtistClick}
          className="text-xs text-zinc-400 hover:text-white truncate block text-start mt-0.5 transition w-full"
        >
          {song.artistName}
        </button>

        {song.albumName && onAlbumClick && (
          <button
            onClick={onAlbumClick}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 truncate block text-start mt-0.5 transition w-full"
          >
            {song.albumName}
          </button>
        )}
      </div>
    </div>
  );
};

// Album Card
interface AlbumCardProps {
  album: Album;
  onClick: () => void;
  onArtistClick: () => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick, onArtistClick }) => {
  return (
    <div
      onClick={onClick}
      className="w-[150px] sm:w-[170px] shrink-0 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition duration-200 group cursor-pointer flex flex-col justify-between"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-3 shadow-md">
        <img
          src={album.coverUrl}
          alt={album.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition" />
      </div>

      <div>
        <p className="font-semibold text-sm text-white truncate group-hover:text-blue-400 transition">
          {album.titleHe || album.title}
        </p>
        <p
          onClick={(e) => {
            e.stopPropagation();
            onArtistClick();
          }}
          className="text-xs text-zinc-400 hover:text-white truncate mt-0.5 transition"
        >
          {album.artistName}
        </p>
        <span className="text-[10px] text-zinc-500 block mt-0.5">
          {album.releaseYear} • {album.trackCount} שירים
        </span>
      </div>
    </div>
  );
};

// Artist Card
interface ArtistCardProps {
  artist: Artist;
  onClick: () => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="w-[140px] sm:w-[160px] shrink-0 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition duration-200 group cursor-pointer text-center"
    >
      <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden bg-zinc-900 mb-3 shadow-md border border-white/5">
        <img
          src={artist.imageUrl}
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
        {artist.verified && (
          <div className="absolute bottom-0.5 end-0.5 w-6 h-6 rounded-full bg-[#0a0b0e] flex items-center justify-center shadow-md">
            <CheckCircle className="w-5 h-5 fill-blue-500 text-white" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1">
        <p className="font-semibold text-sm text-white truncate group-hover:text-blue-400 transition">
          {artist.nameHe || artist.name}
        </p>
        {artist.verified && (
          <CheckCircle className="w-3.5 h-3.5 fill-blue-500 text-white shrink-0" />
        )}
      </div>
      <p className="text-xs text-zinc-400 capitalize mt-0.5">
        {artist.genres[0] || 'Artist'}
      </p>
    </div>
  );
};

// Playlist Card
interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="w-[150px] sm:w-[170px] shrink-0 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition duration-200 group cursor-pointer flex flex-col justify-between"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-3 shadow-md">
        <img
          src={playlist.coverUrl}
          alt={playlist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
      </div>

      <div>
        <p className="font-semibold text-sm text-white truncate group-hover:text-blue-400 transition">
          {playlist.name}
        </p>
        <p className="text-xs text-zinc-400 truncate mt-0.5">
          {playlist.description || playlist.ownerName}
        </p>
      </div>
    </div>
  );
};
