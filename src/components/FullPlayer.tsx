import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Share2,
  Mic2,
  ListPlus,
  Disc,
  Loader2,
  Sparkles,
  Plus,
  X,
  Moon,
  Sliders,
  Gauge,
  Video,
  VideoOff,
} from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime } from '../utils/formatters';
import { getSongLyrics, fetchDynamicLyrics, LyricLine } from '../data/lyricsData';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { handleImageError, DEFAULT_ALBUM_COVER } from '../utils/imageFallback';

interface FullPlayerProps {
  onNavigateArtist?: (artistId: string) => void;
  onNavigateAlbum?: (albumId: string) => void;
}

export const FullPlayer: React.FC<FullPlayerProps> = ({ onNavigateArtist, onNavigateAlbum }) => {
  const {
    playback,
    playSong,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    closeFullPlayer,
    toggleQueueModal,
    removeFromQueue,
    isLiked,
    toggleLike,
    toggleEqualizerModal,
    toggleSleepTimerModal,
    setPlaybackRate,
    toggleVideoMode,
    getLiveTime,
  } = usePlayer();

  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'vinyl' | 'lyrics' | 'queue'>('vinyl');
  const [lyricsFontSize, setLyricsFontSize] = useState<number>(() => {
    try {
      const s = localStorage.getItem('simply_music_lyrics_font_size');
      return s ? parseInt(s, 10) : 18;
    } catch {
      return 18;
    }
  });

  const handleLyricsFontSizeChange = (delta: number) => {
    setLyricsFontSize((prev) => {
      const next = Math.max(14, Math.min(26, prev + delta));
      try {
        localStorage.setItem('simply_music_lyrics_font_size', next.toString());
      } catch {}
      return next;
    });
  };

  const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];
  const handleCycleSpeed = () => {
    const currentRate = playback.playbackRate || 1.0;
    const currentIdx = SPEED_OPTIONS.indexOf(currentRate);
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
    setPlaybackRate(SPEED_OPTIONS[nextIdx]);
  };

  // Lyrics state
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const song = playback.currentSong;
  const [lyrics, setLyrics] = useState<LyricLine[]>(() => (song ? getSongLyrics(song) : []));
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  // Dynamically load real synchronized lyrics whenever song changes
  useEffect(() => {
    if (!song) {
      setLyrics([]);
      setIsLoadingLyrics(false);
      return;
    }

    // Check if we have instant verified local lyrics
    const local = getSongLyrics(song);
    if (local && local.length > 0) {
      setLyrics(local);
      setIsLoadingLyrics(false);
      return;
    }

    // Otherwise fetch from LRCLIB API dynamically
    setLyrics([]);
    setIsLoadingLyrics(true);

    let isCancelled = false;
    fetchDynamicLyrics(song)
      .then((fetched) => {
        if (!isCancelled) {
          setIsLoadingLyrics(false);
          if (fetched && fetched.length > 0) {
            setLyrics(fetched);
          }
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsLoadingLyrics(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [song?.id, song?.title, song?.titleHe]);

  // Find active lyric line index based on playback.currentTime
  // High-frequency local time for smooth lyrics sync — calls YT player directly, bypasses React render cycle
  const [localTime, setLocalTime] = useState(0);
  const getLiveTimeRef = useRef(getLiveTime);
  getLiveTimeRef.current = getLiveTime;

  useEffect(() => {
    // 50ms = 20 times per second, smooth enough for lyrics
    const interval = setInterval(() => {
      const t = getLiveTimeRef.current();
      setLocalTime(t);
    }, 50);
    return () => clearInterval(interval);
  }, []); // empty deps = runs forever independently

  // Use the player clock directly so the highlighted line matches the audio position.
  const lyricTime = localTime;
  const activeLyricIndex = lyrics.reduce((acc, line, idx) => {
    if (lyricTime >= line.time) {
      return idx;
    }
    return acc;
  }, -1);

  // Auto-scroll lyrics to keep active line centered
  useEffect(() => {
    if (activeTab === 'lyrics' && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIndex, activeTab]);

  if (!playback.isFullPlayerOpen || !song) return null;

  const liked = isLiked(song.id);
  const duration = playback.duration || song.duration || 1;
  const currentTime = playback.currentTime;
  const remainingTime = Math.max(0, duration - currentTime);

  // Circular progress calculations for the YouTube Music-style ring
  const progressFraction = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const ringRadius = 158;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference * (1 - progressFraction);

  // Calculate indicator knob position along the ring
  const currentAngleDeg = -90 + progressFraction * 360;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;
  const indicatorX = 180 + ringRadius * Math.cos(currentAngleRad);
  const indicatorY = 180 + ringRadius * Math.sin(currentAngleRad);

  // Click on the circular progress line to seek
  const handleRingSeek = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - rect.width / 2;
    const clickY = e.clientY - rect.top - rect.height / 2;
    let angle = Math.atan2(clickY, clickX) * (180 / Math.PI); // -180 to 180
    // Rotate so 12 o'clock (-90 deg) is 0
    angle = (angle + 90 + 360) % 360;
    const targetFraction = angle / 360;
    seek(targetFraction * duration);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: song.title,
          text: `${song.title} - ${song.artistName} על פשוט מוזיקה`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div
        id="full-screen-player-modal"
        className="fixed inset-0 z-50 flex flex-col bg-[#07080b] text-white overflow-y-auto"
      >
        {/* Dynamic Ambient Background Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <img
            src={song.coverUrl}
            alt=""
            onError={(e) => handleImageError(e, DEFAULT_ALBUM_COVER)}
            className="w-full h-full object-cover blur-3xl scale-125 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/65 to-[#07080b]" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
          <button
            id="btn-close-full-player"
            onClick={closeFullPlayer}
            className="p-2 -ms-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Collapse Player"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
              {t('nowPlaying')}
            </p>
            <button
              onClick={() => {
                if (onNavigateAlbum && song.albumId) {
                  closeFullPlayer();
                  onNavigateAlbum(song.albumId);
                }
              }}
              className="text-xs text-zinc-200 hover:text-red-400 truncate max-w-[220px] transition font-medium"
            >
              {song.albumName}
            </button>
          </div>

          <div className="flex items-center gap-1 -me-2">
            <button
              id="btn-share-song"
              onClick={handleShare}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition relative"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
              {copied && (
                <span className="absolute -bottom-7 end-0 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded shadow">
                  הועתק!
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full px-5 py-3 sm:py-6">
          {/* Mode Switcher: [ תקליט ונגן | מילים מסונכרנות | בתור ] */}
          <div className="flex items-center gap-1 p-1 bg-zinc-900/90 border border-white/10 rounded-full mb-5 shadow-lg">
            {/* Vinyl Record Mode with Progress Ring */}
            <button
              id="fullplayer-btn-vinyl-mode"
              onClick={() => setActiveTab('vinyl')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'vinyl'
                  ? 'bg-white/15 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Disc className={`w-3.5 h-3.5 ${activeTab === 'vinyl' && playback.isPlaying ? 'animate-spin' : ''}`} />
              <span>תקליט ומוזיקה</span>
            </button>

            {/* Synced Lyrics Mode */}
            <button
              id="fullplayer-btn-lyrics-mode"
              onClick={() => setActiveTab('lyrics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'lyrics'
                  ? 'bg-white/15 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>מילים מסונכרנות</span>
            </button>

            {/* Queue & Similar Songs Mode ("בתור ושירים דומים") */}
            <button
              id="fullplayer-btn-queue-mode"
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'queue'
                  ? 'bg-white/15 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>בתור ושירים דומים</span>
              {playback.queue.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
                  {playback.queue.length}
                </span>
              )}
            </button>
          </div>

          {/* Central Media Slot: Vinyl with YouTube Progress Ring OR Synced Lyrics */}
          <div className="relative flex w-full max-w-[min(100%,420px)] items-center justify-center overflow-visible mb-6 min-h-[min(84vw,330px)] sm:min-h-[380px]">
            {/* 1. VINYL RECORD VIEW WITH YOUTUBE MUSIC PROGRESS RING */}
            {activeTab === 'vinyl' && (
              <div className="relative aspect-square w-[min(84vw,320px)] sm:w-[min(72vw,360px)] flex items-center justify-center select-none">
                {/* Ambient Acoustic Equalizer Aura Line (YouTube Music style pulse behind circle) */}
                <div
                  className={`absolute inset-0 rounded-full border-2 border-red-500/25 pointer-events-none transition-all duration-1000 ${
                    playback.isPlaying ? 'scale-105 opacity-60 animate-pulse' : 'scale-95 opacity-0'
                  }`}
                />
                <div
                  className={`absolute -inset-2 rounded-full bg-gradient-to-tr from-red-600/10 via-rose-500/15 to-transparent blur-xl pointer-events-none transition-opacity duration-700 ${
                    playback.isPlaying ? 'opacity-80' : 'opacity-0'
                  }`}
                />

                {/* Turntable Tonearm Stylus */}
                <div
                  className={`absolute -top-3 end-2 z-30 transition-transform duration-700 origin-top-right pointer-events-none ${
                    playback.isPlaying ? 'rotate-12' : '-rotate-6'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-zinc-300 border-2 border-zinc-700 shadow-md" />
                  <div className="w-1 h-20 bg-gradient-to-b from-zinc-300 to-zinc-500 rounded shadow-md ms-1" />
                  <div className="w-3 h-5 bg-zinc-800 rounded-sm ms-0.5 border border-zinc-500" />
                </div>

                {/* SVG YouTube-style Circular Progress Ring (Line around the circle) */}
                <svg
                  id="youtube-circular-progress-ring"
                  viewBox="0 0 360 360"
                  onClick={handleRingSeek}
                  className="absolute inset-0 w-full h-full z-20 cursor-pointer overflow-visible pointer-events-auto"
                >
                  <defs>
                    {/* YouTube Signature Red/Coral Progress Gradient */}
                    <linearGradient id="ytRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff0033" />
                      <stop offset="60%" stopColor="#ff2e63" />
                      <stop offset="100%" stopColor="#ff5722" />
                    </linearGradient>
                    <filter id="ytGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Background Track Line */}
                  <circle
                    cx="180"
                    cy="180"
                    r={ringRadius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="5"
                    className="transition-colors hover:stroke-white/20"
                  />

                  {/* Active YouTube Progress Stroke Line */}
                  <circle
                    cx="180"
                    cy="180"
                    r={ringRadius}
                    fill="none"
                    stroke="url(#ytRingGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 180 180)"
                    filter="url(#ytGlow)"
                    style={{
                      transition: 'stroke-dashoffset 0.2s linear',
                    }}
                  />

                  {/* Current Progress Knob Indicator Dot */}
                  {progressFraction > 0.005 && (
                    <g filter="url(#ytGlow)">
                      <circle
                        cx={indicatorX}
                        cy={indicatorY}
                        r="7"
                        fill="#ffffff"
                        stroke="#ff0033"
                        strokeWidth="2.5"
                        className="transition-all duration-150"
                      />
                    </g>
                  )}
                </svg>

                {/* Central Rotating Vinyl Disc inside the ring */}
                <div
                  id="vinyl-record-disc"
                  onClick={togglePlay}
                  style={{
                    animationPlayState: playback.isPlaying ? 'running' : 'paused',
                  }}
                  className="relative z-10 h-[84%] w-[84%] rounded-full bg-[#0d0e12] border-4 border-zinc-800 shadow-2xl shadow-black flex items-center justify-center cursor-pointer animate-[spin_18s_linear_infinite] hover:scale-[1.01] transition-transform duration-300"
                  title={playback.isPlaying ? 'לחץ לעצירה' : 'לחץ להשמעה'}
                >
                  {/* Concentric Grooves */}
                  <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-10 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-14 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-18 rounded-full border border-white/5 pointer-events-none" />

                  {/* Glossy Vinyl Sheen Reflection */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.03] via-transparent to-white/[0.03] pointer-events-none" />

                  {/* Center Record Label with Circular Album Cover */}
                  <div className="relative h-[43%] w-[43%] rounded-full overflow-hidden border-4 border-zinc-900 bg-black shadow-inner flex items-center justify-center">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      onError={(e) => handleImageError(e, DEFAULT_ALBUM_COVER)}
                      className="h-full w-full object-contain"
                    />

                    {/* Spindle Center Hole */}
                    <div className="absolute w-6 h-6 rounded-full bg-[#08090d] border-2 border-zinc-400/80 shadow-inner flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-zinc-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. REAL SYNCHRONIZED LYRICS VIEW */}
            {activeTab === 'lyrics' && (
              <div
                ref={lyricsContainerRef}
                id="synced-lyrics-view"
                className="w-full h-[330px] sm:h-[380px] overflow-y-auto px-4 py-4 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-white/10 scroll-smooth shadow-inner text-center"
              >
                {/* Lyrics Header: Font Controls & Hint */}
                <div className="sticky top-0 z-10 flex items-center justify-between pb-2 mb-3 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xs text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Mic2 className="w-3.5 h-3.5 text-zinc-300" />
                    <span>לחץ על שורה כדי לקפוץ אליה</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleLyricsFontSizeChange(-2)}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 transition"
                      title="הקטן גופן"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => handleLyricsFontSizeChange(2)}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 transition"
                      title="הגדל גופן"
                    >
                      A+
                    </button>
                  </div>
                </div>

                {isLoadingLyrics ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
                    <p className="text-sm font-semibold text-zinc-200">מחפש מילים מסונכרנות באינטרנט...</p>
                    <p className="text-xs text-zinc-500">חיפוש חי מול מאגר המילים המסונכרנות</p>
                  </div>
                ) : lyrics.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-zinc-400">
                    <Mic2 className="w-9 h-9 text-zinc-500 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-zinc-200">לא נמצאו מילים מסונכרנות לשיר זה כרגע</p>
                    <p className="text-xs text-zinc-500 max-w-xs">ניתן להמשיך להאזין לשיר באיכות גבוהה או לעבור לתצוגת התקליט</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    {lyrics.map((line, idx) => {
                      const isActive = idx === activeLyricIndex;
                      const isPast = idx < activeLyricIndex;

                      return (
                        <div
                          key={idx}
                          ref={isActive ? activeLineRef : null}
                          onClick={() => seek(line.time)}
                          className={`cursor-pointer transition-all duration-300 py-2 px-3 rounded-xl ${
                            isActive
                              ? 'text-white font-bold scale-[1.03] bg-white/10 border border-white/15 shadow-sm'
                              : isPast
                              ? 'text-zinc-500 hover:text-zinc-300 font-medium'
                              : 'text-zinc-400 hover:text-white font-medium'
                          }`}
                          style={{ fontSize: `${lyricsFontSize}px` }}
                        >
                          <p className="leading-relaxed">{line.text}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. INTERACTIVE QUEUE & SIMILAR SONGS VIEW */}
            {activeTab === 'queue' && (
              <div
                id="fullplayer-queue-view"
                className="w-full h-[330px] sm:h-[380px] overflow-y-auto px-4 py-4 space-y-4 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 scroll-smooth shadow-inner text-start"
              >

                {/* Up Next in Queue */}
                {playback.queue.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-zinc-400 mb-2">
                      הבאים בתור ({playback.queue.length})
                    </p>
                    <div className="space-y-1.5">
                      {playback.queue.map((qSong, idx) => (
                        <div
                          key={`${qSong.id}-${idx}`}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <img
                              src={qSong.coverUrl}
                              alt={qSong.title}
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-white truncate">
                                {qSong.titleHe || qSong.title}
                              </p>
                              <p className="text-[10px] text-zinc-400 truncate">
                                {qSong.artistName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                const newQueue = playback.queue.filter((_, i) => i !== idx);
                                playSong(qSong, newQueue);
                              }}
                              className="p-1 text-zinc-300 hover:text-white"
                              title="נגן עכשיו"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              onClick={() => removeFromQueue(idx)}
                              className="p-1 text-zinc-400 hover:text-rose-400"
                              title="הסר"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Similar Songs section removed */}
              </div>
            )}

            {/* Buffering Overlay */}
            {playback.isBuffering && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-2xl flex items-center justify-center pointer-events-none z-30">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium text-red-400">{t('buffering')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Track Details, Like & Add to Playlist */}
          <div className="w-full flex items-center justify-between mb-3">
            <div className="min-w-0 flex-1 pe-4">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                {song.titleHe || song.title}
              </h1>
              <button
                onClick={() => {
                  if (onNavigateArtist && song.artistId) {
                    closeFullPlayer();
                    onNavigateArtist(song.artistId);
                  }
                }}
                className="text-sm sm:text-base text-zinc-400 hover:text-white hover:underline truncate block transition text-start mt-0.5 font-medium"
              >
                {song.artistName}
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Add to Playlist Button */}
              <button
                id="btn-add-to-playlist"
                onClick={() => setIsPlaylistModalOpen(true)}
                className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition"
                aria-label="Add to Playlist"
                title="הוספה לפלייליסט"
              >
                <ListPlus className="w-5 h-5" />
              </button>

              {/* Like Button */}
              <button
                id="full-player-like-btn"
                onClick={() => toggleLike(song.id, song)}
                className={`p-2.5 rounded-full transition ${
                  liked
                    ? 'text-rose-500 hover:text-rose-400'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                aria-label="Like track"
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Audio Features Quick Bar: Equalizer, Sleep Timer, Speed, Video Mode */}
          <div className="w-full flex items-center justify-between gap-1.5 mb-4 px-1 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-zinc-300">
            {/* Equalizer Quick Button */}
            <button
              onClick={toggleEqualizerModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition"
              title="איקוולייזר ובס"
            >
              <Sliders className="w-3.5 h-3.5 text-zinc-300" />
              <span>איקוולייזר</span>
              {playback.equalizerPreset && playback.equalizerPreset !== 'flat' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              )}
            </button>

            {/* Sleep Timer Quick Button */}
            <button
              onClick={toggleSleepTimerModal}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                playback.sleepTimerSecondsLeft !== null || playback.sleepTimerIsEndOfTrack
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30'
                  : 'hover:bg-white/10 text-zinc-300 hover:text-white'
              }`}
              title="טיימר שינה"
            >
              <Moon className="w-3.5 h-3.5 text-zinc-300" />
              {playback.sleepTimerSecondsLeft !== null ? (
                <span className="font-mono font-bold text-white">
                  {formatTime(playback.sleepTimerSecondsLeft)}
                </span>
              ) : playback.sleepTimerIsEndOfTrack ? (
                <span className="font-semibold text-indigo-300">בסיום השיר</span>
              ) : (
                <span>טיימר שינה</span>
              )}
            </button>

            {/* Playback Speed Cycle Button */}
            <button
              onClick={handleCycleSpeed}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white font-mono font-bold transition"
              title="מהירות השמעה"
            >
              <Gauge className="w-3.5 h-3.5 text-zinc-300" />
              <span>{playback.playbackRate || 1}x</span>
            </button>

            {/* Video HD Toggle */}
            {song.youtubeId && (
              <button
                onClick={toggleVideoMode}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  playback.isVideoMode
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30 font-medium'
                    : 'hover:bg-white/10 text-zinc-300 hover:text-white'
                }`}
                title={playback.isVideoMode ? 'הסתר וידאו' : 'הצג וידאו קליפ'}
              >
                {playback.isVideoMode ? <Video className="w-3.5 h-3.5 text-rose-400" /> : <Video className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{playback.isVideoMode ? 'וידאו פועל' : 'קליפ'}</span>
              </button>
            )}
          </div>

          {/* YouTube-Style Sleek Scrubber / Progress Bar */}
          <div className="w-full mb-6">
            <div className="relative flex items-center group cursor-pointer py-2">
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-700/70 rounded-lg appearance-none cursor-pointer focus:outline-none accent-red-600 hover:h-2 transition-all"
                aria-label="Playback Progress"
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-400 mt-1 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(remainingTime)}</span>
            </div>
          </div>

          {/* Main Controls Row */}
          <div className="w-full flex items-center justify-between mb-6 max-w-md">
            {/* Shuffle */}
            <button
              id="btn-shuffle"
              onClick={toggleShuffle}
              className={`p-2.5 rounded-full transition ${
                playback.shuffle ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:text-white'
              }`}
              aria-label={t('shuffle')}
              title={t('shuffle')}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Previous Track */}
            <button
              id="btn-prev-track"
              onClick={previousTrack}
              className="p-3 text-zinc-200 hover:text-white active:scale-95 transition"
              aria-label={t('previous')}
            >
              <SkipBack className="w-7 h-7" />
            </button>

            {/* Play / Pause - YouTube Red / Crisp White Button */}
            <button
              id="btn-full-play-pause"
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-2xl shadow-white/20 hover:bg-zinc-100"
              aria-label={playback.isPlaying ? t('pause') : t('play')}
            >
              {playback.isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              id="btn-next-track"
              onClick={nextTrack}
              className="p-3 text-zinc-200 hover:text-white active:scale-95 transition"
              aria-label={t('next')}
            >
              <SkipForward className="w-7 h-7" />
            </button>

            {/* Repeat */}
            <button
              id="btn-repeat"
              onClick={cycleRepeat}
              className={`p-2.5 rounded-full transition ${
                playback.repeat !== 'off' ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:text-white'
              }`}
              aria-label={t('repeat')}
              title={t('repeat')}
            >
              {playback.repeat === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Bottom Secondary Controls: Volume & Queue */}
          <div className="w-full flex items-center justify-between pt-2 border-t border-white/5 max-w-md text-zinc-400">
            {/* Volume Control */}
            <div className="flex items-center gap-2 flex-1 max-w-[180px]">
              <button
                onClick={toggleMute}
                className="p-2 hover:text-white transition"
                aria-label={playback.isMuted ? t('unmute') : t('mute')}
              >
                {playback.isMuted || playback.volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={playback.isMuted ? 0 : playback.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-700/80 rounded appearance-none cursor-pointer accent-red-500"
                aria-label="Volume Slider"
              />
            </div>

            {/* Queue Button */}
            <button
              id="btn-open-queue-from-full"
              onClick={toggleQueueModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 hover:text-white transition text-xs font-medium"
            >
              <ListMusic className="w-4 h-4 text-zinc-400" />
              <span>תור השמעה ({playback.queue.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add To Playlist Modal */}
      {song && (
        <AddToPlaylistModal
          song={song}
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
        />
      )}
    </>
  );
};
