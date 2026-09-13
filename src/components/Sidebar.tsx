import React, { useEffect, useState } from 'react';
import {
  Home,
  Search,
  Library,
  Heart,
  Settings,
  Shield,
  PlusCircle,
  Radio,
  Smartphone,
  ArrowDownToLine,
  Monitor,
  Sliders,
  Moon,
  Bell,
} from 'lucide-react';
import { ActiveTab, ActiveView } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';

interface SidebarProps {
  activeView: ActiveView;
  onNavigateTab: (tab: ActiveTab) => void;
  onNavigateLiked: () => void;
  onCreatePlaylist: () => void;
  userPlaylists: Array<{ id: string; name: string }>;
  onNavigatePlaylist: (id: string) => void;
  onOpenApkModal?: (tab?: 'windows' | 'website' | 'android' | 'ios') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigateTab,
  onNavigateLiked,
  onCreatePlaylist,
  userPlaylists,
  onNavigatePlaylist,
  onOpenApkModal,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toggleEqualizerModal, toggleSleepTimerModal, playback } = usePlayer();
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const loadUpdateCount = () => {
      fetch('/api/updates', { cache: 'no-store' })
        .then((response) => response.json())
        .then((data) => setUpdateCount(Array.isArray(data.updates) ? data.updates.length : 0))
        .catch(() => {});
    };
    loadUpdateCount();
    const timer = window.setInterval(loadUpdateCount, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const isCurrentTab = (tab: ActiveTab) => activeView.type === 'tab' && activeView.tab === tab;
  const isLikedView = activeView.type === 'liked';

  return (
    <aside
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-64 bg-[#0a0b0f] border-e border-white/5 h-screen shrink-0 text-white select-none z-30"
    >
      {/* Brand Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5">
        <div
          onClick={() => onNavigateTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-white/20 transition overflow-hidden p-1 shadow-sm">
            <img src="/logo.png" alt={t('appName')} className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block">
              {t('appName')}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase block">
              נגן מוזיקה
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Links */}
      <div className="p-4 space-y-1">
        <button
          id="nav-home-btn"
          onClick={() => onNavigateTab('home')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
            isCurrentTab('home')
              ? 'bg-white/10 text-white font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>{t('navHome')}</span>
        </button>

        <button
          id="nav-search-btn"
          onClick={() => onNavigateTab('search')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
            isCurrentTab('search')
              ? 'bg-white/10 text-white font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>{t('navSearch')}</span>
        </button>

        <button
          id="nav-library-btn"
          onClick={() => onNavigateTab('library')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
            isCurrentTab('library')
              ? 'bg-white/10 text-white font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Library className="w-4 h-4" />
          <span>{t('navLibrary')}</span>
        </button>

        <button
          id="nav-liked-btn"
          onClick={onNavigateLiked}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
            isLikedView
              ? 'bg-rose-500/15 text-rose-300 font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLikedView ? 'fill-rose-400 text-rose-400' : ''}`} />
          <span>{t('navLiked')}</span>
        </button>

        <button
          id="nav-downloads-btn"
          onClick={() => onNavigateTab('downloads')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
            isCurrentTab('downloads')
              ? 'bg-white/10 text-white font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>{t('navDownloads')}</span>
        </button>

        <button
          id="nav-updates-btn"
          onClick={() => onNavigateTab('updates')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
            isCurrentTab('updates') ? 'bg-blue-500/15 text-blue-300 font-semibold' : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span className="flex-1">{t('navUpdates')}</span>
          {updateCount > 0 && <span className="min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">{updateCount}</span>}
        </button>
      </div>

      {/* Playlists Section */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pt-2 pb-4">
        <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <span>{t('tabPlaylists')}</span>
          <button
            id="btn-create-playlist-sidebar"
            onClick={onCreatePlaylist}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title={t('createPlaylist')}
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pe-1">
          {userPlaylists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onNavigatePlaylist(pl.id)}
              className={`w-full text-start truncate px-3 py-2 rounded-lg text-xs transition ${
                activeView.type === 'playlist' && activeView.id === pl.id
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {pl.name}
            </button>
          ))}
          {userPlaylists.length === 0 && (
            <p className="text-xs text-zinc-600 px-3 py-4 italic">
              {t('emptyLibraryText')}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Footer Actions: Equalizer, Sleep Timer, Admin, Settings */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button
          id="nav-sidebar-eq-btn"
          onClick={toggleEqualizerModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition"
        >
          <span className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <span>איקוולייזר ובס</span>
          </span>
          {playback.equalizerPreset && playback.equalizerPreset !== 'flat' && (
            <span className="w-2 h-2 rounded-full bg-blue-400" />
          )}
        </button>

        <button
          id="nav-sidebar-sleep-btn"
          onClick={toggleSleepTimerModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition"
        >
          <span className="flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-zinc-400" />
            <span>טיימר שינה</span>
          </span>
          {(playback.sleepTimerSecondsLeft !== null || playback.sleepTimerIsEndOfTrack) && (
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
          )}
        </button>

        {user?.role === 'admin' && (
          <button
            id="nav-admin-btn"
            onClick={() => onNavigateTab('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
              isCurrentTab('admin')
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-amber-300 hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{t('navAdmin')}</span>
          </button>
        )}

        <button
          id="nav-settings-btn"
          onClick={() => onNavigateTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
            isCurrentTab('settings')
              ? 'bg-white/10 text-white font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{t('navSettings')}</span>
        </button>
      </div>
    </aside>
  );
};
