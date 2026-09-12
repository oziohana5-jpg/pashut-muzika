import React, { useEffect, useState } from 'react';
import { Plus, Heart, Disc3, Users, Clock, Radio, Play } from 'lucide-react';
import { Playlist, Song, Album, Artist } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime } from '../utils/formatters';

interface LibraryViewProps {
  onNavigatePlaylist: (id: string) => void;
  onNavigateAlbum: (id: string) => void;
  onNavigateArtist: (id: string) => void;
  onNavigateLiked: () => void;
  onCreatePlaylist: () => void;
}

type LibraryTab = 'playlists' | 'albums' | 'artists' | 'history';

export const LibraryView: React.FC<LibraryViewProps> = ({
  onNavigatePlaylist,
  onNavigateAlbum,
  onNavigateArtist,
  onNavigateLiked,
  onCreatePlaylist,
}) => {
  const { playSong, playback } = usePlayer();
  const { user, token, openAuthModal, loginWithGoogle } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<LibraryTab>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [history, setHistory] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    Promise.all([
      fetch('/api/user/playlists', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/user/following', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/user/history', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/music/home').then((r) => r.json()),
    ])
      .then(([playlistsData, followingData, historyData, homeData]) => {
        setPlaylists(playlistsData.playlists || []);
        setArtists(followingData.artists || []);
        setHistory(historyData.history || []);
        setAlbums(homeData.popularAlbums || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token, user]);

  if (!token || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div
          id="library-guest-card"
          className="w-full max-w-md bg-[#13151f] border border-blue-500/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-black/80"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              הספרייה שלך מחכה לך
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
              כדי לראות את כל השירים שאהבת, הפלייליסטים שיצרת והיסטוריית ההאזנה שלך — יש להתחבר לחשבון.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              id="btn-library-google-auth"
              onClick={() => openAuthModal('כדי לגשת לספרייה האישית שלך, יש להתחבר לחשבון.')}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 active:scale-[0.99] text-zinc-900 font-bold text-sm transition shadow-lg shadow-white/10"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>התחברות מהירה עם Google</span>
            </button>

            <button
              id="btn-library-email-auth"
              onClick={() => openAuthModal('כדי לגשת לספרייה האישית שלך, יש להתחבר לחשבון.')}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 transition"
            >
              התחברות באמצעות אימייל וסיסמה
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 pt-2 px-4 sm:px-8">
      {/* Header & Create Playlist button */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {t('libraryTitle')}
        </h1>

        <button
          onClick={onCreatePlaylist}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t('createPlaylist')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['playlists', 'albums', 'artists', 'history'] as LibraryTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium shrink-0 transition ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            {tab === 'playlists' && t('tabPlaylists')}
            {tab === 'albums' && t('tabAlbums')}
            {tab === 'artists' && t('tabArtists')}
            {tab === 'history' && t('tabHistory')}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Playlists Tab Content */}
      {!loading && activeTab === 'playlists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Liked Songs Special Card */}
          <div
            onClick={onNavigateLiked}
            className="p-4 rounded-2xl bg-gradient-to-br from-rose-600 to-indigo-900 border border-white/10 cursor-pointer hover:scale-[1.02] transition shadow-lg flex flex-col justify-between aspect-square"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <p className="font-bold text-base sm:text-lg text-white">
                {t('likedSongsTitle')}
              </p>
              <span className="text-xs text-rose-200">
                {t('tabPlaylists')}
              </span>
            </div>
          </div>

          {/* User & Curated Playlists */}
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onNavigatePlaylist(pl.id)}
              className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2.5 shadow-md">
                <img
                  src={pl.coverUrl}
                  alt={pl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-white truncate group-hover:text-blue-400 transition">
                  {pl.name}
                </p>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {pl.ownerName}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Albums Tab Content */}
      {!loading && activeTab === 'albums' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.map((al) => (
            <div
              key={al.id}
              onClick={() => onNavigateAlbum(al.id)}
              className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2.5 shadow-md">
                <img
                  src={al.coverUrl}
                  alt={al.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-white truncate group-hover:text-blue-400 transition">
                  {al.titleHe || al.title}
                </p>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {al.artistName}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Artists Tab Content */}
      {!loading && activeTab === 'artists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {artists.map((ar) => (
            <div
              key={ar.id}
              onClick={() => onNavigateArtist(ar.id)}
              className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition cursor-pointer text-center group"
            >
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-zinc-900 mb-2.5 shadow-md border border-white/5">
                <img
                  src={ar.imageUrl}
                  alt={ar.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <p className="font-semibold text-sm text-white truncate group-hover:text-blue-400 transition">
                {ar.nameHe || ar.name}
              </p>
              <p className="text-xs text-zinc-400 capitalize mt-0.5">
                {ar.genres[0] || 'Artist'}
              </p>
            </div>
          ))}
          {artists.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 text-sm">
              {t('emptyLibraryText')}
            </div>
          )}
        </div>
      )}

      {/* History Tab Content */}
      {!loading && activeTab === 'history' && (
        <div className="space-y-1">
          {history.map((song, index) => {
            const isPlayingThis = playback.currentSong?.id === song.id && playback.isPlaying;
            return (
              <div
                key={`${song.id}-${index}`}
                onClick={() => playSong(song, history)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-900">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 pe-2">
                    <p className={`text-sm font-semibold truncate ${isPlayingThis ? 'text-blue-400' : 'text-white'}`}>
                      {song.titleHe || song.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {song.artistName} • {song.albumName}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-zinc-500 font-mono">
                  {formatTime(song.duration)}
                </span>
              </div>
            );
          })}
          {history.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-sm">
              {t('emptyLibraryText')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
