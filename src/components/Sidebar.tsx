import React from 'react';
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

  const isCurrentTab = (tab: ActiveTab) => activeView.type === 'tab' && activeView.tab === tab;
  const isLikedView = activeView.type === 'liked';

  return (
    <aside
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-64 bg-white border-e border-slate-200 h-screen shrink-0 text-slate-900 select-none z-30"
    >
      {/* Brand Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-200">
        <div
          onClick={() => onNavigateTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:border-blue-300 transition overflow-hidden p-1.5 shadow-sm">
            <img src="/logo.png" alt={t('appName')} className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 block">
              {t('appName')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase block">
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
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>{t('navDownloads')}</span>
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
      <div className="p-3 border-t border-slate-200 space-y-1">
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
