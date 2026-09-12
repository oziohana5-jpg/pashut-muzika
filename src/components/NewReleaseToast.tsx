import React, { useState, useEffect } from 'react';
import { Sparkles, Play, X, Bell } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { Song } from '../types';

interface NewReleaseToastProps {
  onPlaySong?: (song: Song) => void;
}

const LATEST_RELEASE: Song = {
  id: 'song-latest-hit',
  title: 'משהו אמיתי בעיניים',
  titleHe: 'משהו אמיתי בעיניים',
  artistId: 'art-sasson',
  artistName: 'ששון איפרם שאולוב',
  albumId: 'alb-sasson-1',
  albumName: 'משהו אמיתי בעיניים',
  coverUrl: 'https://i.ytimg.com/vi/bY108u76zlc/hqdefault.jpg',
  duration: 184,
  releaseDate: '2024-05-01',
  genre: 'Mizrahi',
  streamUrl: '',
  youtubeId: 'bY108u76zlc',
  provider: 'licensed_catalog',
  audioFormat: 'mp3',
  bitrate: 320,
  plays: 18500000,
  isFullLength: true,
  licenseInfo: 'Official Full Track Release',
};

export const NewReleaseToast: React.FC<NewReleaseToastProps> = () => {
  const { playSong } = usePlayer();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed this release or disabled releases in settings
    const dismissed = localStorage.getItem('dismissed_release_v2_' + LATEST_RELEASE.id);
    const notificationsDisabled = localStorage.getItem('simply_music_disable_release_notifs') === 'true';

    if (!dismissed && !notificationsDisabled) {
      // Delay slightly so it doesn't pop abruptly on first load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('dismissed_release_v2_' + LATEST_RELEASE.id, 'true');
  };

  const handlePlayNow = () => {
    playSong(LATEST_RELEASE, [LATEST_RELEASE]);
    handleDismiss();
  };

  return (
    <div
      id="new-release-toast"
      className="fixed top-4 start-4 end-4 sm:start-auto sm:end-6 sm:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="relative bg-[#181b26]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-3.5 shadow-2xl shadow-black/80 flex items-center gap-3">
        {/* Release Thumbnail */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10">
          <img
            src={LATEST_RELEASE.coverUrl}
            alt={LATEST_RELEASE.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-0 end-0 bg-red-600 text-white text-[8px] font-bold px-1 rounded-bl">
            חדש
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3 animate-pulse text-amber-400" />
            <span>להיט חדש הושק בפשוט מוזיקה</span>
          </div>
          <p className="text-xs font-bold text-white truncate mt-0.5">
            {LATEST_RELEASE.titleHe}
          </p>
          <p className="text-[11px] text-zinc-400 truncate">
            {LATEST_RELEASE.artistName}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            id="btn-play-new-release"
            onClick={handlePlayNow}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-md shadow-blue-600/30 flex items-center justify-center"
            title="נגן עכשיו שיר מלא"
            aria-label="Play New Release"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
          </button>
          <button
            id="btn-dismiss-new-release"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
