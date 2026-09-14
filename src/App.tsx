import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ActiveView, ActiveTab } from './types';

// Layout & Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MiniPlayer } from './components/MiniPlayer';
import { FullPlayer } from './components/FullPlayer';
import { QueueModal } from './components/QueueModal';
import { AuthModal } from './components/AuthModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { ImportSpotifyPlaylistModal } from './components/ImportSpotifyPlaylistModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';

// Views
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { LibraryView } from './components/LibraryView';
import { SettingsView } from './components/SettingsView';
import { ArtistView } from './components/ArtistView';
import { AlbumView } from './components/AlbumView';
import { PlaylistView } from './components/PlaylistView';
import { LikedSongsView } from './components/LikedSongsView';
import { AdminDashboard } from './components/AdminDashboard';
import { UpdatesView } from './components/UpdatesView';
import { DownloadsView } from './components/DownloadsView';
import { NotificationPermissionPrompt } from './components/NotificationPermissionPrompt';
import { MusicPreferencesModal } from './components/MusicPreferencesModal';
import { EmojiConfetti } from './components/EmojiConfetti';

const MainApp: React.FC = () => {
  const { direction } = useLanguage();
  const {
    user,
    token,
    isAuthModalOpen,
    authModalMode,
    authPromptMessage,
    openAuthModal,
    closeAuthModal,
  } = useAuth();

  // Navigation state & history stack
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'tab', tab: 'home' });
  const [viewHistory, setViewHistory] = useState<ActiveView[]>([]);

  // Captured PWA Install prompt for 1-click Windows/Android install
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);

  useEffect(() => {
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  // Modals
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isSpotifyImportOpen, setIsSpotifyImportOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [apkModalInitialTab, setApkModalInitialTab] = useState<'windows' | 'website' | 'android' | 'ios'>('windows');

  const handleOpenApkModal = (tab: 'windows' | 'website' | 'android' | 'ios' = 'windows') => {
    setApkModalInitialTab(tab);
    setIsApkModalOpen(true);
  };

  // Playlists for sidebar
  const [userPlaylists, setUserPlaylists] = useState<Array<{ id: string; name: string }>>([]);

  const loadUserPlaylists = async () => {
    if (!token) {
      setUserPlaylists([]);
      return;
    }

    try {
      const res = await fetch('/api/user/library', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.playlists) {
        setUserPlaylists(data.playlists.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUserPlaylists();
  }, [token]);

  useEffect(() => {
    if (user && localStorage.getItem('simply_music_onboarding_pending') === 'true') {
      setIsPreferencesOpen(true);
    }
  }, [user]);

  const navigateTo = (newView: ActiveView) => {
    setViewHistory((prev) => [...prev, activeView]);
    setActiveView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (viewHistory.length > 0) {
      const previous = viewHistory[viewHistory.length - 1];
      setViewHistory((prev) => prev.slice(0, prev.length - 1));
      setActiveView(previous);
    }
  };

  const handleNavigateTab = (tab: ActiveTab) => {
    navigateTo({ type: 'tab', tab });
  };

  const handleNavigateArtist = (id: string) => {
    navigateTo({ type: 'artist', id });
  };

  const handleNavigateAlbum = (id: string) => {
    navigateTo({ type: 'album', id });
  };

  const handleNavigatePlaylist = (id: string) => {
    navigateTo({ type: 'playlist', id });
  };

  const handleNavigateLiked = () => {
    navigateTo({ type: 'liked' });
  };

  const handleCreatePlaylistClick = () => {
    if (!user) {
      openAuthModal('כדי ליצור פלייליסט ולשמור אותו בספרייה האישית, יש להתחבר לחשבון.', 'login');
    } else {
      setIsCreatePlaylistOpen(true);
    }
  };

  return (
    <div
      dir={direction}
      className="app-shell flex h-screen text-zinc-100 overflow-hidden font-sans"
    >
      {/* Desktop Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigateTab={handleNavigateTab}
        onNavigateLiked={handleNavigateLiked}
        onCreatePlaylist={handleCreatePlaylistClick}
        userPlaylists={userPlaylists}
        onNavigatePlaylist={handleNavigatePlaylist}
        onOpenApkModal={handleOpenApkModal}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          activeView={activeView}
          onNavigateTab={handleNavigateTab}
          onOpenAuthModal={() => openAuthModal()}
          onOpenApkModal={handleOpenApkModal}
          canGoBack={viewHistory.length > 0}
          onGoBack={handleGoBack}
        />

        {/* Scrollable Viewport */}
        <main
          id="main-scrollable-viewport"
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {activeView.type === 'tab' && activeView.tab === 'home' && (
            <HomeView
              onNavigateArtist={handleNavigateArtist}
              onNavigateAlbum={handleNavigateAlbum}
              onNavigatePlaylist={handleNavigatePlaylist}
              onOpenApkModal={handleOpenApkModal}
            />
          )}

          {activeView.type === 'tab' && activeView.tab === 'search' && (
            <SearchView
              onNavigateArtist={handleNavigateArtist}
              onNavigateAlbum={handleNavigateAlbum}
              onNavigatePlaylist={handleNavigatePlaylist}
            />
          )}

          {activeView.type === 'tab' && activeView.tab === 'library' && (
            <LibraryView
              onNavigatePlaylist={handleNavigatePlaylist}
              onNavigateAlbum={handleNavigateAlbum}
              onNavigateArtist={handleNavigateArtist}
              onNavigateLiked={handleNavigateLiked}
              onCreatePlaylist={handleCreatePlaylistClick}
              onImportSpotifyPlaylist={() => {
                if (!user) {
                  openAuthModal('כדי לייבא פלייליסט ולשמור אותו בספרייה האישית, יש להתחבר לחשבון.', 'login');
                } else {
                  setIsSpotifyImportOpen(true);
                }
              }}
            />
          )}

          {activeView.type === 'tab' && activeView.tab === 'downloads' && (
            <DownloadsView />
          )}

          {activeView.type === 'tab' && activeView.tab === 'updates' && (
            <UpdatesView />
          )}

          {activeView.type === 'tab' && activeView.tab === 'settings' && (
            <SettingsView />
          )}

          {activeView.type === 'tab' && activeView.tab === 'admin' && (
            <AdminDashboard />
          )}

          {activeView.type === 'artist' && (
            <ArtistView
              artistId={activeView.id}
              onNavigateAlbum={handleNavigateAlbum}
            />
          )}

          {activeView.type === 'album' && (
            <AlbumView
              albumId={activeView.id}
              onNavigateArtist={handleNavigateArtist}
            />
          )}

          {activeView.type === 'playlist' && (
            <PlaylistView
              playlistId={activeView.id}
              onDeleted={() => {
                loadUserPlaylists();
                handleNavigateTab('library');
              }}
            />
          )}

          {activeView.type === 'liked' && (
            <LikedSongsView />
          )}
        </main>
      </div>

      {/* Persistent Mini Audio Player */}
      <MiniPlayer />

      {/* Full-Screen Immersive Audio Player */}
      <FullPlayer
        onNavigateArtist={handleNavigateArtist}
        onNavigateAlbum={handleNavigateAlbum}
      />

      {/* Audio Queue Modal */}
      <QueueModal />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeView={activeView}
        onNavigateTab={handleNavigateTab}
      />

      {/* Auth Modal (Login / Register / Reset) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode === 'forgot' ? 'login' : authModalMode}
        promptMessage={authPromptMessage}
      />

      {/* Playlist Creation Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreated={(newId) => {
          loadUserPlaylists();
          handleNavigatePlaylist(newId);
        }}
      />

      <ImportSpotifyPlaylistModal
        isOpen={isSpotifyImportOpen}
        onClose={() => setIsSpotifyImportOpen(false)}
        onImported={(newId) => {
          loadUserPlaylists();
          handleNavigatePlaylist(newId);
        }}
      />

      <MusicPreferencesModal isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)} />

      {/* Multi-Platform (Windows Desktop, APK, iOS, Web) Download Modal */}
      <AndroidApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        initialTab={apkModalInitialTab}
        deferredPrompt={pwaPrompt}
      />

      {/* Persistent PWA & APK Installation Banner */}
      <PWAInstallBanner />
      <NotificationPermissionPrompt />
      <EmojiConfetti />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <PlayerProvider>
            <MainApp />
          </PlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
