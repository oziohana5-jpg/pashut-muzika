import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Play, Pause, Music, Users, Disc3, Radio, Heart, Plus, Check, CheckCircle } from 'lucide-react';
import { SearchResults, Song } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime } from '../utils/formatters';

interface SearchViewProps {
  onNavigateArtist: (id: string) => void;
  onNavigateAlbum: (id: string) => void;
  onNavigatePlaylist: (id: string) => void;
}

type SearchFilter = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

export const SearchView: React.FC<SearchViewProps> = ({
  onNavigateArtist,
  onNavigateAlbum,
  onNavigatePlaylist,
}) => {
  const { playSong, playback, toggleLike, isLiked, addToQueue } = usePlayer();
  const { t, language } = useLanguage();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [results, setResults] = useState<SearchResults>({
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
  });
  const [loading, setLoading] = useState(false);
  const [queuedSongId, setQueuedSongId] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef(new Map<string, SearchResults>());

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setLoading(false);
      setResults({ songs: [], artists: [], albums: [], playlists: [] });
      return;
    }

    setLoading(true);
    const handler = setTimeout(() => {
      searchMusic(trimmed, filter);
    }, 180);

    return () => {
      clearTimeout(handler);
      searchAbortRef.current?.abort();
    };
  }, [query, filter]);

  const searchMusic = async (q: string, currentFilter: string) => {
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const cacheKey = `${q.toLocaleLowerCase()}:${currentFilter}`;
    const cached = searchCacheRef.current.get(cacheKey);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}&filter=${currentFilter}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      setResults(data);
      searchCacheRef.current.set(cacheKey, data);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        console.error('Search error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ songs: [], artists: [], albums: [], playlists: [] });
  };

  const handleQueueClick = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    addToQueue(song);
    setQueuedSongId(song.id);
    setTimeout(() => setQueuedSongId(null), 1500);
  };

  const quickPills = [
    { label: 'עומר אדם', query: 'עומר אדם' },
    { label: 'שלמה ארצי', query: 'שלמה ארצי' },
    { label: 'חנן בן ארי', query: 'חנן בן ארי' },
    { label: 'אושר כהן', query: 'אושר כהן' },
    { label: 'ישי ריבו', query: 'ישי ריבו' },
    { label: 'טונה', query: 'טונה' },
    { label: 'Coldplay', query: 'Coldplay' },
    { label: 'The Weeknd', query: 'The Weeknd' },
    { label: 'Taylor Swift', query: 'Taylor Swift' },
    { label: 'Eminem', query: 'Eminem' },
  ];

  const genres = [
    { name: 'אקוסטי ופולק', color: 'from-amber-600 to-amber-900', query: 'Acoustic' },
    { name: 'צ׳ילהופ ולואו-פיי', color: 'from-blue-600 to-indigo-900', query: 'Chillhop' },
    { name: 'פסנתר קלאסי', color: 'from-emerald-600 to-teal-900', query: 'Piano' },
    { name: 'עוד ומוזיקת עולם', color: 'from-rose-600 to-orange-950', query: 'World' },
    { name: 'סינת׳ווייב ואלקטרוני', color: 'from-purple-600 to-pink-950', query: 'Electronic' },
    { name: 'מדיטציה ושקט', color: 'from-cyan-600 to-blue-950', query: 'Ambient' },
  ];

  const openArtistProfile = (artist: SearchResults['artists'][number]) => {
    try {
      sessionStorage.setItem(`simply_music_artist_${artist.id}`, JSON.stringify(artist));
    } catch {}
    onNavigateArtist(artist.id);
  };

  const hasResults =
    results.songs.length > 0 ||
    results.artists.length > 0 ||
    results.albums.length > 0 ||
    results.playlists.length > 0;

  return (
    <div className="space-y-6 pb-28 pt-2 px-4 sm:px-8">
      {/* Search Input Bar */}
      <div className="max-w-3xl space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-zinc-400">
            <SearchIcon className="w-5 h-5" />
          </div>
          <input
            id="global-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === 'he'
                ? 'חפש כל שיר, זמר, להקה או אלבום (לדוגמה: עומר אדם, Coldplay...)'
                : 'Search any song, artist, band or album (e.g. Omer Adam, Coldplay...)'
            }
            className="w-full bg-[#151720] border border-white/10 rounded-2xl py-3.5 ps-12 pe-12 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-lg shadow-black/20"
            autoFocus
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 end-0 flex items-center pe-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs text-zinc-500 shrink-0">
            {language === 'he' ? 'הצעות מהירות:' : 'Quick search:'}
          </span>
          {quickPills.map((p) => (
            <button
              key={p.query}
              onClick={() => setQuery(p.query)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition border ${
                query === p.query
                  ? 'bg-blue-600 border-blue-500 text-white shadow'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
          {(['all', 'songs', 'artists', 'albums', 'playlists'] as SearchFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium shrink-0 transition ${
                filter === tab
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {tab === 'all' && t('searchFilterAll')}
              {tab === 'songs' && t('searchFilterSongs')}
              {tab === 'artists' && t('searchFilterArtists')}
              {tab === 'albums' && t('searchFilterAlbums')}
              {tab === 'playlists' && t('searchFilterPlaylists')}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <div className="w-7 h-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">
            {language === 'he' ? 'מחפש שירים ואמנים...' : 'Searching catalog...'}
          </p>
        </div>
      )}

      {/* Empty Query: Explore Genres & Starter Suggestions */}
      {!query && !loading && (
        <div className="space-y-6 pt-2">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {t('browseGenres')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {genres.map((g) => (
                <div
                  key={g.query}
                  onClick={() => setQuery(g.query)}
                  className={`relative h-28 sm:h-32 rounded-2xl p-4 bg-gradient-to-br ${g.color} cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition shadow-lg overflow-hidden flex items-end`}
                >
                  <span className="font-bold text-base sm:text-lg text-white">
                    {g.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {query && !loading && !hasResults && (
        <div className="text-center py-16 text-zinc-500 space-y-3">
          <p className="text-base text-zinc-300">
            {t('noResultsFound')} עבור "{query}"
          </p>
          <p className="text-xs text-zinc-500">
            {language === 'he'
              ? 'נסה לבדוק את איות המילים או לחץ על אחת מההצעות למעלה'
              : 'Try checking your spelling or select one of the suggestions above'}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {quickPills.slice(0, 5).map((p) => (
              <button
                key={p.query}
                onClick={() => setQuery(p.query)}
                className="px-3 py-1 rounded-full text-xs bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results Display */}
      {query && !loading && hasResults && (
        <div className="space-y-8">
          {/* Songs Results */}
          {(filter === 'all' || filter === 'songs') && results.songs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-400">
                <Music className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  {t('searchFilterSongs')} ({results.songs.length})
                </h3>
              </div>
              <div className="space-y-1">
                {results.songs.map((song) => {
                  const isCurrent = playback.currentSong?.id === song.id;
                  const isPlaying = isCurrent && playback.isPlaying;
                  const liked = isLiked(song.id);
                  const justQueued = queuedSongId === song.id;

                  return (
                    <div
                      key={song.id}
                      onClick={() => playSong(song, results.songs)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition group cursor-pointer border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-900 shadow">
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition ${
                              isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isPlaying ? (
                              <Pause className="w-5 h-5 fill-white text-white" />
                            ) : (
                              <Play className="w-5 h-5 fill-white text-white" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 pe-2">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isCurrent ? 'text-blue-400' : 'text-white'
                            }`}
                          >
                            {song.titleHe || song.title}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">
                            {song.artistName} {song.albumName ? `• ${song.albumName}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Song Action Buttons */}
                      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                        {/* Like button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song.id, song);
                          }}
                          className={`p-2 rounded-full transition ${
                            liked
                              ? 'text-red-500 hover:text-red-400'
                              : 'text-zinc-500 hover:text-zinc-200'
                          }`}
                          title="אהבתי"
                        >
                          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                        </button>

                        {/* Add to Queue button */}
                        <button
                          onClick={(e) => handleQueueClick(e, song)}
                          className={`p-2 rounded-full transition ${
                            justQueued
                              ? 'text-green-400 bg-green-500/10'
                              : 'text-zinc-500 hover:text-zinc-200'
                          }`}
                          title={justQueued ? 'נוסף לתור' : t('addToQueue')}
                        >
                          {justQueued ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>

                        <span className="text-xs text-zinc-500 font-mono hidden sm:inline-block w-10 text-end">
                          {formatTime(song.duration)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Artists Results */}
          {(filter === 'all' || filter === 'artists') && results.artists.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-400">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  {t('searchFilterArtists')} ({results.artists.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {results.artists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => openArtistProfile(artist)}
                    className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition cursor-pointer text-center group"
                  >
                    <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden bg-zinc-900 mb-2.5 border border-white/5 shadow-md">
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {artist.verified && (
                        <div className="absolute bottom-0 end-0 w-5 h-5 rounded-full bg-[#0a0b0e] flex items-center justify-center shadow">
                          <CheckCircle className="w-4 h-4 fill-blue-500 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {artist.nameHe || artist.name}
                      </p>
                      {artist.verified && (
                        <CheckCircle className="w-3 h-3 fill-blue-500 text-white shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {artist.genres?.[0] || 'אמן'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums Results */}
          {(filter === 'all' || filter === 'albums') && results.albums.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-400">
                <Disc3 className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  {t('searchFilterAlbums')} ({results.albums.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {results.albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onNavigateAlbum(album.id)}
                    className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition cursor-pointer group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2.5 shadow-md">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <p className="text-xs font-semibold text-white truncate">
                      {album.titleHe || album.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {album.artistName}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Playlists Results */}
          {(filter === 'all' || filter === 'playlists') && results.playlists.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-400">
                <Radio className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  {t('searchFilterPlaylists')} ({results.playlists.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {results.playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => onNavigatePlaylist(playlist.id)}
                    className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition cursor-pointer group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2.5 shadow-md">
                      <img
                        src={playlist.coverUrl}
                        alt={playlist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <p className="text-xs font-semibold text-white truncate">
                      {playlist.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {playlist.ownerName}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
