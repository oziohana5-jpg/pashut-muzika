import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Song, RepeatMode, PlaybackState, EqualizerPreset } from '../types';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { EQUALIZER_PRESETS, EqualizerModal } from '../components/EqualizerModal';
import { SleepTimerModal } from '../components/SleepTimerModal';
import { getSongLyrics } from '../data/lyricsData';

declare global {
  interface Window {
    YT: any;
  }
}

interface PlayerContextType {
  playback: PlaybackState;
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setPlaybackRate: (rate: number) => void;
  addToQueue: (song: Song) => void;
  playNextInQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (newQueue: Song[]) => void;
  clearQueue: () => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
  toggleQueueModal: () => void;
  toggleVideoMode: () => void;
  toggleEqualizerModal: () => void;
  toggleSleepTimerModal: () => void;
  setEqualizerPreset: (preset: EqualizerPreset) => void;
  setEqualizerBandGain: (bandIndex: number, gain: number) => void;
  resetEqualizer: () => void;
  setSleepTimer: (minutes: number | null, isEndOfTrack?: boolean) => void;
  cancelSleepTimer: () => void;
  likedSongIds: Set<string>;
  toggleLike: (songId: string, songObj?: Song) => Promise<boolean>;
  isLiked: (songId: string) => boolean;
  audioQuality: 'high' | 'normal' | 'saver';
  setAudioQuality: (q: 'high' | 'normal' | 'saver') => void;
  similarSongs: Song[];
  autoplaySimilar: boolean;
  toggleAutoplaySimilar: () => void;
  addSimilarToQueue: (song: Song) => void;
  getLiveTime: () => number;
  ytPlayerRef: React.MutableRefObject<any>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // YouTube audio/video engine references
  const ytPlayerRef = useRef<any>(null);
  const isYtReadyRef = useRef<boolean>(false);
  const activeEngineRef = useRef<'youtube' | 'audio'>('youtube');
  const pendingVideoIdRef = useRef<string | null>(null);
  const ytStartTimeoutRef = useRef<number | null>(null);

  const [playback, setPlayback] = useState<PlaybackState>(() => {
    let savedVol = 0.85;
    let savedShuffle = false;
    let savedRepeat: RepeatMode = 'off';
    let savedSong: Song | null = null;
    try {
      const v = localStorage.getItem('simply_music_volume');
      if (v !== null) savedVol = parseFloat(v);
      const s = localStorage.getItem('simply_music_shuffle');
      if (s !== null) savedShuffle = s === 'true';
      const r = localStorage.getItem('simply_music_repeat') as RepeatMode;
      if (r === 'off' || r === 'all' || r === 'one') savedRepeat = r;
      const lastSongStr = localStorage.getItem('simply_music_last_song');
      if (lastSongStr) savedSong = JSON.parse(lastSongStr);
    } catch {}

    let savedPreset: EqualizerPreset = 'flat';
    let savedGains = [0, 0, 0, 0, 0];
    try {
      const p = localStorage.getItem('simply_music_eq_preset') as EqualizerPreset;
      if (p) savedPreset = p;
      const g = localStorage.getItem('simply_music_eq_gains');
      if (g) savedGains = JSON.parse(g);
    } catch {}

    return {
      currentSong: savedSong,
      isPlaying: false,
      currentTime: 0,
      duration: savedSong?.duration || 0,
      volume: isNaN(savedVol) ? 0.85 : savedVol,
      isMuted: false,
      shuffle: savedShuffle,
      repeat: savedRepeat,
      playbackRate: 1,
      queue: (() => {
        try {
          const savedQueue = JSON.parse(localStorage.getItem('simply_music_queue') || '[]');
          return Array.isArray(savedQueue) ? savedQueue : [];
        } catch {
          return [];
        }
      })(),
      history: [],
      isBuffering: false,
      error: null,
      isFullPlayerOpen: false,
      isQueueOpen: false,
      isVideoMode: false,
      isEqualizerOpen: false,
      isSleepTimerOpen: false,
      sleepTimerSecondsLeft: null,
      sleepTimerIsEndOfTrack: false,
      equalizerPreset: savedPreset,
      equalizerGains: savedGains,
    };
  });

  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('simply_music_liked_songs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [audioQuality, setAudioQualityState] = useState<'high' | 'normal' | 'saver'>(() => {
    try {
      const q = localStorage.getItem('simply_music_quality') as any;
      if (q === 'high' || q === 'normal' || q === 'saver') return q;
    } catch {}
    return 'high';
  });

  // Spotify-style autoplay of similar songs
  const [similarSongs, setSimilarSongs] = useState<Song[]>([]);
  const [autoplaySimilar, setAutoplaySimilar] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('simply_music_autoplay_similar');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const autoplaySimilarRef = useRef(autoplaySimilar);
  autoplaySimilarRef.current = autoplaySimilar;

  const similarSongsRef = useRef(similarSongs);
  similarSongsRef.current = similarSongs;

  const toggleAutoplaySimilar = () => {
    setAutoplaySimilar(prev => {
      const nextVal = !prev;
      try {
        localStorage.setItem('simply_music_autoplay_similar', String(nextVal));
      } catch {}
      return nextVal;
    });
  };

  const addSimilarToQueue = (song: Song) => {
    addToQueue(song);
    setSimilarSongs(prev => prev.filter(s => s.id !== song.id));
  };

  const getLyricsForRecommendation = (song: Song): string =>
    (song.lyrics || getSongLyrics(song).map(line => line.text).join(' ')).slice(0, 12000);

  const normalizedSongTitle = (song: Song): string => (song.titleHe || song.title || '')
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\b(official|audio|video|lyrics|קליפ|רשמי|אודיו|מילים)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const isSameSong = (left: Song, right: Song): boolean => {
    if (left.id === right.id) return true;
    const leftTitle = normalizedSongTitle(left);
    const rightTitle = normalizedSongTitle(right);
    return Boolean(leftTitle && rightTitle && (
      leftTitle === rightTitle || leftTitle.includes(rightTitle) || rightTitle.includes(leftTitle)
    ));
  };

  // Load and merge liked songs with server
  useEffect(() => {
    if (token) {
      fetch('/api/user/liked', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.songs && Array.isArray(data.songs)) {
            setLikedSongIds(prev => {
              const serverIds = data.songs.map((s: Song) => s.id);
              const combined = new Set([...prev, ...serverIds]);
              try {
                localStorage.setItem('simply_music_liked_songs', JSON.stringify(Array.from(combined)));
              } catch {}
              return combined;
            });
          }
        })
        .catch(err => console.error('Failed to load liked songs:', err));
    }
  }, [token]);

  // Audio element setup
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.autoplay = false;
    audio.setAttribute('playsinline', 'true');
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setPlayback(prev => ({
        ...prev,
        currentTime: audio.currentTime,
        duration: audio.duration && !isNaN(audio.duration) ? audio.duration : (prev.currentSong?.duration || 0),
      }));
    };

    const handleLoadedMetadata = () => {
      setPlayback(prev => ({
        ...prev,
        duration: audio.duration && !isNaN(audio.duration) ? audio.duration : (prev.currentSong?.duration || 0),
        isBuffering: false,
      }));
    };

    const handleWaiting = () => {
      setPlayback(prev => ({ ...prev, isBuffering: true }));
    };

    const handlePlaying = () => {
      setPlayback(prev => ({ ...prev, isPlaying: true, isBuffering: false, error: null }));
    };

    const handlePause = () => {
      setPlayback(prev => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      handleTrackEnd();
    };

    const handleError = () => {
      const current = playbackRef.current.currentSong;
      console.warn('Audio playback error for track:', current?.id);

      // Report error to backend
      if (current) {
        fetch('/api/admin/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songId: current.id,
            message: 'Audio playback failed or stream interrupted',
            userAgent: navigator.userAgent,
          }),
        }).catch(() => {});
      }

      setPlayback(prev => ({
        ...prev,
        isBuffering: false,
        isPlaying: false,
        error: t('songUnavailable'),
      }));

      // Automatic error recovery: skip to next playable track after 1.5s
      setTimeout(() => {
        nextTrack();
      }, 1500);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Ref to always have latest playback state in event handlers
  const playbackRef = useRef(playback);
  playbackRef.current = playback;

  useEffect(() => {
    try {
      localStorage.setItem('simply_music_queue', JSON.stringify(playback.queue));
    } catch {}
  }, [playback.queue]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }

    let isSubscribed = true;
    const checkAndInitYT = () => {
      if (!isSubscribed) return;
      if (window.YT && window.YT.Player) {
        try {
          ytPlayerRef.current = new window.YT.Player('youtube-player-host', {
            height: '100%',
            width: '100%',
            playerVars: {
              autoplay: 1,
              controls: 1,
              disablekb: 0,
              fs: 1,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
              origin: window.location.origin,
            },
            events: {
              onReady: (event: any) => {
                isYtReadyRef.current = true;
                try {
                  event.target.setVolume(Math.round(playbackRef.current.volume * 100));
                  if (playbackRef.current.isMuted) {
                    event.target.mute();
                  }
                } catch {}

                if (pendingVideoIdRef.current) {
                  event.target.loadVideoById(pendingVideoIdRef.current);
                  event.target.playVideo();
                  pendingVideoIdRef.current = null;
                }
              },
              onStateChange: (event: any) => {
                // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 0 = ENDED
                if (event.data === 1) {
                  if (ytStartTimeoutRef.current !== null) {
                    window.clearTimeout(ytStartTimeoutRef.current);
                    ytStartTimeoutRef.current = null;
                  }
                  setPlayback(prev => ({ ...prev, isPlaying: true, isBuffering: false, error: null }));
                } else if (event.data === 2) {
                  setPlayback(prev => ({ ...prev, isPlaying: false }));
                } else if (event.data === 3) {
                  setPlayback(prev => ({ ...prev, isBuffering: true }));
                } else if (event.data === 0) {
                  handleTrackEnd();
                }
              },
              onError: (err: any) => {
                console.warn('YouTube Player playback warning:', err);
                if (ytStartTimeoutRef.current !== null) {
                  window.clearTimeout(ytStartTimeoutRef.current);
                  ytStartTimeoutRef.current = null;
                }
                setPlayback(prev => ({
                  ...prev,
                  isPlaying: false,
                  isBuffering: false,
                  error: t('songUnavailable'),
                }));
              },
            },
          });
        } catch (e) {
          console.warn('YT Player init exception:', e);
        }
      } else {
        setTimeout(checkAndInitYT, 250);
      }
    };

    checkAndInitYT();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Poll YouTube playback time & duration accurately — always running
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeEngineRef.current === 'youtube' && isYtReadyRef.current && ytPlayerRef.current) {
        try {
          const time = ytPlayerRef.current.getCurrentTime?.() ?? 0;
          const dur = ytPlayerRef.current.getDuration?.() ?? 0;
          setPlayback(prev => {
            if (!prev.currentSong) return prev;
            const safeDur = dur > 0 ? dur : (prev.currentSong.duration || 0);
            // Always update time even if 0 — so lyrics sync from second 0
            return {
              ...prev,
              currentTime: time,
              duration: safeDur,
              isBuffering: time > 0 ? false : prev.isBuffering,
            };
          });
        } catch {}
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // MediaSession API Integration for background playback & mobile lock screen
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const current = playback.currentSong;

    if (current) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.titleHe || current.title,
        artist: current.artistName,
        album: current.albumName,
        artwork: [
          { src: current.coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: current.coverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: current.coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: current.coverUrl, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => resume());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => previousTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          seek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skip = details.seekOffset || 10;
        seek(Math.max(0, playbackRef.current.currentTime - skip));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skip = details.seekOffset || 10;
        seek(Math.min(playbackRef.current.duration, playbackRef.current.currentTime + skip));
      });
      navigator.mediaSession.setActionHandler('stop', () => pause());
    }
  }, [playback.currentSong]);

  // Sync MediaSession playback state and timeline for lock screen
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = playback.isPlaying ? 'playing' : 'paused';
      if ('setPositionState' in navigator.mediaSession && playback.duration > 0) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, playback.duration),
          playbackRate: 1,
          position: Math.min(playback.currentTime, playback.duration),
        });
      }
    } catch {}
  }, [playback.isPlaying, playback.currentTime, playback.duration]);

  // Sync volume with engines
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = playback.isMuted ? 0 : playback.volume;
    }
    if (ytPlayerRef.current && isYtReadyRef.current) {
      try {
        if (playback.isMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(Math.round(playback.volume * 100));
        }
      } catch {}
    }
  }, [playback.volume, playback.isMuted]);

  // Sleep timer interval countdown & soft fade out
  useEffect(() => {
    if (playback.sleepTimerSecondsLeft === null) return;
    if (playback.sleepTimerSecondsLeft <= 0) {
      pause();
      setPlayback(prev => ({
        ...prev,
        sleepTimerSecondsLeft: null,
        sleepTimerIsEndOfTrack: false,
      }));
      return;
    }

    const timer = setInterval(() => {
      setPlayback(prev => {
        if (prev.sleepTimerSecondsLeft === null) return prev;
        const nextSec = prev.sleepTimerSecondsLeft - 1;

        // Smooth fade out in the last 15 seconds
        if (nextSec <= 15 && nextSec > 0 && prev.volume > 0.05) {
          const faded = Math.max(0, (nextSec / 15) * prev.volume);
          if (audioRef.current) audioRef.current.volume = faded;
          if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(Math.round(faded * 100));
        }

        if (nextSec <= 0) {
          pause();
          return {
            ...prev,
            isPlaying: false,
            sleepTimerSecondsLeft: null,
            sleepTimerIsEndOfTrack: false,
          };
        }

        return { ...prev, sleepTimerSecondsLeft: nextSec };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [playback.sleepTimerSecondsLeft]);

  // Handle track ending logic (with Spotify-style continuous Autoplay)
  const handleTrackEnd = () => {
    const current = playbackRef.current;
    if (current.sleepTimerIsEndOfTrack) {
      pause();
      setPlayback(prev => ({
        ...prev,
        isPlaying: false,
        sleepTimerSecondsLeft: null,
        sleepTimerIsEndOfTrack: false,
      }));
      return;
    }

    if (current.repeat === 'one') {
      if (activeEngineRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
        ytPlayerRef.current.seekTo(0, true);
        ytPlayerRef.current.playVideo();
        return;
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
        return;
      }
    }

    if (current.queue.length > 0) {
      const nextSong = current.queue[0];
      const remainingQueue = current.queue.slice(1);
      playSong(nextSong, remainingQueue);
    } else if (current.repeat === 'all' && current.history.length > 0) {
      // Loop entire playlist / history
      const allTracks = [...current.history, ...(current.currentSong ? [current.currentSong] : [])];
      if (allTracks.length > 0) {
        playSong(allTracks[0], allTracks.slice(1));
      }
    } else if (autoplaySimilarRef.current && similarSongsRef.current.length > 0) {
      // Spotify Autoplay: seamlessly continue to next similar song!
      const nextSong = similarSongsRef.current[0];
      const remainingSimilar = similarSongsRef.current.slice(1);
      setSimilarSongs(remainingSimilar);
      playSong(nextSong, []);
    } else {
      // No queue, no similar songs — fetch more related songs and keep playing
      const currentSong = current.currentSong;
      if (currentSong) {
        fetch(
          `/api/music/similar/${encodeURIComponent(currentSong.id)}?artist=${encodeURIComponent(currentSong.artistName || '')}&genre=${encodeURIComponent(currentSong.genre || '')}&title=${encodeURIComponent(currentSong.title || '')}`
        )
          .then(res => res.json())
          .then(data => {
            const tracks: Song[] = (data.similarTracks || []).filter((s: Song) => {
              const isPlaceholder = /soundhelix\.com|example\.com/i.test(s.streamUrl || '');
              return s.id !== currentSong.id && (Boolean(s.youtubeId) || Boolean(s.streamUrl && !isPlaceholder));
            });
            if (tracks.length > 0) {
              // Shuffle for variety
              const shuffled = [...tracks].sort(() => Math.random() - 0.5);
              playSong(shuffled[0], shuffled.slice(1));
            } else {
              // Last resort: replay history shuffled
              const history = current.history;
              if (history.length > 0) {
                const shuffledHistory = [...history].sort(() => Math.random() - 0.5);
                playSong(shuffledHistory[0], shuffledHistory.slice(1));
              } else {
                setPlayback(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
              }
            }
          })
          .catch(() => {
            setPlayback(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
          });
      } else {
        setPlayback(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      }
    }
  };

  // Play a song
  const playSong = (song: Song, newQueue?: Song[]) => {
    const targetSong = { ...song };
    const isMobilePlayback = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Pause any legacy audio element to guarantee no sound collision
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setPlayback(prev => {
      const updatedHistory = prev.currentSong
        ? [prev.currentSong, ...prev.history.slice(0, 49)]
        : prev.history;
      const sourceQueue = newQueue !== undefined ? newQueue : prev.queue;
      const cleanQueue = sourceQueue.filter((queuedSong, index, allQueuedSongs) =>
        !isSameSong(queuedSong, targetSong) &&
        allQueuedSongs.findIndex(candidate => isSameSong(candidate, queuedSong)) === index
      );

      return {
        ...prev,
        currentSong: targetSong,
        isPlaying: true,
        currentTime: 0,
        duration: targetSong.duration || 0,
        isBuffering: true,
        error: null,
        history: updatedHistory,
        queue: cleanQueue,
        isFullPlayerOpen: true,
        isVideoMode: isMobilePlayback && Boolean(targetSong.youtubeId) ? true : prev.isVideoMode,
      };
    });

    const startYtPlayback = (ytId: string) => {
      activeEngineRef.current = 'youtube';
      if (ytStartTimeoutRef.current !== null) {
        window.clearTimeout(ytStartTimeoutRef.current);
      }
      ytStartTimeoutRef.current = window.setTimeout(() => {
        ytStartTimeoutRef.current = null;
        if (playbackRef.current.currentSong?.id === targetSong.id && playbackRef.current.isBuffering) {
          setPlayback(prev => ({
            ...prev,
            isPlaying: false,
            isBuffering: false,
            error: t('songUnavailable'),
          }));
        }
      }, 10000);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const host = document.getElementById('youtube-player-host');
      const iframe = host?.querySelector('iframe') as HTMLIFrameElement | null;
      if (iframe) {
        iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(ytId)}?autoplay=1&controls=1&playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}`;
        setPlayback(prev => ({ ...prev, isPlaying: true, isBuffering: false, error: null }));
        return;
      }
      if (isYtReadyRef.current && ytPlayerRef.current?.loadVideoById) {
        ytPlayerRef.current.loadVideoById(ytId);
        ytPlayerRef.current.playVideo();
        if (isMobilePlayback) {
          window.requestAnimationFrame(() => {
            if (playbackRef.current.currentSong?.id !== targetSong.id) return;
            try {
              ytPlayerRef.current?.playVideo();
            } catch {}
          });
        }
      } else {
        pendingVideoIdRef.current = ytId;
      }
    };

    // Spotify Autoplay: automatically fetch similar tracks for this song
    // Pass recently played IDs so server avoids repeating them
    const recentIds = playbackRef.current.history.slice(0, 10).map(s => s.id).join(',');
    fetch(
      `/api/music/similar/${encodeURIComponent(targetSong.id)}?artist=${encodeURIComponent(
        targetSong.artistName || ''
      )}&genre=${encodeURIComponent(targetSong.genre || '')}&title=${encodeURIComponent(
        targetSong.title || ''
      )}&lyrics=${encodeURIComponent(getLyricsForRecommendation(targetSong))}&recent=${encodeURIComponent(recentIds)}`
    )
      .then(res => res.json())
      .then(data => {
        if (data.similarTracks && Array.isArray(data.similarTracks)) {
          // Filter out current song
          const filtered = data.similarTracks.filter((s: Song) => !isSameSong(s, targetSong));
          setSimilarSongs(filtered);
          setPlayback(prev => {
            if (prev.currentSong?.id !== targetSong.id) return prev;
            const existing = [targetSong, ...prev.queue];
            const recommendations = filtered.filter((song: Song) =>
              !existing.some(existingSong => isSameSong(existingSong, song))
            );
            return { ...prev, queue: [...prev.queue, ...recommendations] };
          });
        }
      })
      .catch(() => {});

    const isPlaceholderStream = /soundhelix\.com|example\.com/i.test(targetSong.streamUrl || '');
    const isPreviewOnlyStream = targetSong.id.startsWith('itunes-') || !targetSong.isFullLength;
    const hasDirectAudio = Boolean(
      targetSong.streamUrl &&
      !targetSong.youtubeId &&
      !isPreviewOnlyStream &&
      targetSong.provider !== 'youtube' &&
      !isPlaceholderStream
    );

    if (hasDirectAudio && audioRef.current) {
      activeEngineRef.current = 'audio';
      audioRef.current.src = targetSong.streamUrl;
      audioRef.current.load();
      audioRef.current.play().catch(console.warn);
    } else if (targetSong.youtubeId && !isPlaceholderStream) {
      startYtPlayback(targetSong.youtubeId);
    } else {
      activeEngineRef.current = 'youtube';
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 10000);
      fetch(`/api/music/resolve-youtube?title=${encodeURIComponent(targetSong.title)}&artist=${encodeURIComponent(targetSong.artistName)}`, {
        signal: controller.signal,
      })
        .then(res => res.json())
        .then(data => {
          window.clearTimeout(timeoutId);
          if (data.youtubeId && playbackRef.current.currentSong?.id === targetSong.id) {
            const updated = { ...targetSong, youtubeId: data.youtubeId, duration: data.duration || targetSong.duration };
            const isMobilePlayback = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            setPlayback(prev => ({
              ...prev,
              currentSong: updated,
              duration: data.duration || prev.duration,
              isPlaying: !isMobilePlayback,
              isBuffering: false,
            }));
            if (isMobilePlayback && isYtReadyRef.current && ytPlayerRef.current?.cueVideoById) {
              // Mobile browsers require the final playVideo call to happen
              // inside a user tap, so cue the video and wait for Play.
              ytPlayerRef.current.cueVideoById(data.youtubeId);
            } else {
              startYtPlayback(data.youtubeId);
            }
          } else {
            setPlayback(prev => ({ ...prev, isPlaying: false, isBuffering: false, error: t('songUnavailable') }));
          }
        })
        .catch(() => {
          window.clearTimeout(timeoutId);
          setPlayback(prev => ({
            ...prev,
            isPlaying: false,
            isBuffering: false,
            error: isPreviewOnlyStream ? 'לשיר הזה אין מקור שמע מלא וזמין להפעלה.' : t('songUnavailable'),
          }));
        });
    }

    // Record listening history and save current song state
    try {
      localStorage.setItem('simply_music_last_song', JSON.stringify(targetSong));
      const existingHistory: Song[] = JSON.parse(localStorage.getItem('simply_music_history') || '[]');
      const filtered = existingHistory.filter((s) => s.id !== targetSong.id);
      const updatedHistory = [targetSong, ...filtered].slice(0, 50);
      localStorage.setItem('simply_music_history', JSON.stringify(updatedHistory));
    } catch {}

    if (token) {
      fetch('/api/user/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId: targetSong.id, playbackPosition: 0 }),
      }).catch(() => {});
    }
  };

  const togglePlay = () => {
    if (activeEngineRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
      if (playback.isPlaying) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
    } else if (audioRef.current) {
      if (playback.isPlaying) {
        audioRef.current.pause();
      } else {
        if (!playback.currentSong) return;
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const pause = () => {
    if (activeEngineRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
      ytPlayerRef.current.pauseVideo();
    }
    audioRef.current?.pause();
  };

  const resume = () => {
    if (activeEngineRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
      ytPlayerRef.current.playVideo();
    } else if (playback.currentSong && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const nextTrack = () => {
    const current = playbackRef.current;
    if (current.queue.length > 0) {
      let nextIndex = 0;
      if (current.shuffle && current.queue.length > 1) {
        nextIndex = Math.floor(Math.random() * current.queue.length);
      }
      const nextSong = current.queue[nextIndex];
      const remaining = current.queue.filter((_, idx) => idx !== nextIndex);
      playSong(nextSong, remaining);
    } else if (autoplaySimilarRef.current && similarSongsRef.current.length > 0) {
      // Spotify Autoplay transition when clicking next
      const nextSong = similarSongsRef.current[0];
      const remainingSimilar = similarSongsRef.current.slice(1);
      setSimilarSongs(remainingSimilar);
      playSong(nextSong, []);
    } else if (current.currentSong) {
      // No queue — fetch similar songs and play next
      const currentSong = current.currentSong;
      fetch(
        `/api/music/similar/${encodeURIComponent(currentSong.id)}?artist=${encodeURIComponent(currentSong.artistName || '')}&genre=${encodeURIComponent(currentSong.genre || '')}`
      )
        .then(res => res.json())
        .then(data => {
          const tracks: Song[] = (data.similarTracks || []).filter(
            (s: Song) => s.id !== currentSong.id
          );
          if (tracks.length > 0) {
            const shuffled = [...tracks].sort(() => Math.random() - 0.5);
            playSong(shuffled[0], shuffled.slice(1));
          }
        })
        .catch(() => {});
    }
  };

  const previousTrack = () => {
    const current = playbackRef.current;

    // If played more than 3 seconds, rewind to start
    if (current.currentTime > 3) {
      seek(0);
      return;
    }

    // Otherwise go to previous in history
    if (current.history.length > 0) {
      const prevSong = current.history[0];
      const newHistory = current.history.slice(1);
      const newQueue = current.currentSong
        ? [current.currentSong, ...current.queue]
        : current.queue;

      playSong(prevSong, newQueue);
      setPlayback(prev => ({
        ...prev,
        history: newHistory,
      }));
    } else {
      seek(0);
    }
  };

  const seek = (seconds: number) => {
    const currentPlayback = playbackRef.current;
    const safeTime = Math.max(0, Math.min(seconds, currentPlayback.duration || 3600));
    if (activeEngineRef.current === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
      try {
        ytPlayerRef.current.seekTo(safeTime, true);
      } catch {}
    } else if (audioRef.current) {
      audioRef.current.currentTime = safeTime;
    }
    setPlayback(prev => ({ ...prev, currentTime: safeTime }));
  };

  const setVolume = (vol: number) => {
    const safeVol = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('simply_music_volume', safeVol.toString());
    } catch {}
    if (ytPlayerRef.current && isYtReadyRef.current) {
      try {
        ytPlayerRef.current.setVolume(Math.round(safeVol * 100));
      } catch {}
    }
    if (audioRef.current) {
      audioRef.current.volume = safeVol;
    }
    setPlayback(prev => ({ ...prev, volume: safeVol, isMuted: false }));
  };

  const toggleMute = () => {
    const nextMuted = !playback.isMuted;
    if (ytPlayerRef.current && isYtReadyRef.current) {
      try {
        if (nextMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
        }
      } catch {}
    }
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : playback.volume;
    }
    setPlayback(prev => ({ ...prev, isMuted: nextMuted }));
  };

  const toggleVideoMode = () => {
    setPlayback(prev => ({ ...prev, isVideoMode: !prev.isVideoMode }));
  };

  const toggleShuffle = () => {
    setPlayback(prev => {
      const nextShuffle = !prev.shuffle;
      try {
        localStorage.setItem('simply_music_shuffle', nextShuffle.toString());
      } catch {}
      return { ...prev, shuffle: nextShuffle };
    });
  };

  const cycleRepeat = () => {
    setPlayback(prev => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const nextIdx = (modes.indexOf(prev.repeat) + 1) % modes.length;
      const nextRepeat = modes[nextIdx];
      try {
        localStorage.setItem('simply_music_repeat', nextRepeat);
      } catch {}
      return { ...prev, repeat: nextRepeat };
    });
  };

  const addToQueue = (song: Song) => {
    setPlayback(prev => {
      if (prev.currentSong && isSameSong(prev.currentSong, song)) return prev;
      if (prev.queue.some(queuedSong => isSameSong(queuedSong, song))) return prev;
      return { ...prev, queue: [...prev.queue, song] };
    });
  };

  const playNextInQueue = (song: Song) => {
    setPlayback(prev => {
      if (prev.currentSong && isSameSong(prev.currentSong, song)) return prev;
      if (prev.queue.some(queuedSong => isSameSong(queuedSong, song))) return prev;
      return { ...prev, queue: [song, ...prev.queue] };
    });
  };

  const removeFromQueue = (index: number) => {
    setPlayback(prev => ({
      ...prev,
      queue: prev.queue.filter((_, idx) => idx !== index),
    }));
  };

  const reorderQueue = (newQueue: Song[]) => {
    setPlayback(prev => ({ ...prev, queue: newQueue }));
  };

  const clearQueue = () => {
    setPlayback(prev => ({ ...prev, queue: [] }));
  };

  const openFullPlayer = () => {
    setPlayback(prev => ({ ...prev, isFullPlayerOpen: true }));
  };

  const closeFullPlayer = () => {
    setPlayback(prev => ({ ...prev, isFullPlayerOpen: false }));
  };

  const toggleQueueModal = () => {
    setPlayback(prev => ({ ...prev, isQueueOpen: !prev.isQueueOpen }));
  };

  const toggleLike = async (songId: string, songObj?: Song): Promise<boolean> => {
    let nextLiked = false;

    // 1. Instantly update local state & localStorage so user never loses favorites
    setLikedSongIds(prev => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
        nextLiked = false;
      } else {
        next.add(songId);
        nextLiked = true;
      }
      try {
        localStorage.setItem('simply_music_liked_songs', JSON.stringify(Array.from(next)));
        // Also cache full song info in localStorage for offline / instant load
        const cached = JSON.parse(localStorage.getItem('simply_music_cached_liked_songs') || '{}');
        if (nextLiked && songObj) {
          cached[songId] = songObj;
        } else if (!nextLiked) {
          delete cached[songId];
        }
        localStorage.setItem('simply_music_cached_liked_songs', JSON.stringify(cached));
      } catch {}
      return next;
    });

    // 2. If logged in, sync with server
    if (token) {
      try {
        const res = await fetch(`/api/user/liked/${songId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (typeof data.isLiked === 'boolean') {
          setLikedSongIds(prev => {
            const next = new Set(prev);
            if (data.isLiked) next.add(songId);
            else next.delete(songId);
            try {
              localStorage.setItem('simply_music_liked_songs', JSON.stringify(Array.from(next)));
            } catch {}
            return next;
          });
          return data.isLiked;
        }
      } catch (err) {
        console.warn('Could not sync like to server:', err);
      }
    }

    return nextLiked;
  };

  const isLiked = (songId: string) => likedSongIds.has(songId);

  const setAudioQuality = (q: 'high' | 'normal' | 'saver') => {
    try {
      localStorage.setItem('simply_music_quality', q);
    } catch {}
    setAudioQualityState(q);
  };

  const setPlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    if (ytPlayerRef.current && isYtReadyRef.current && ytPlayerRef.current.setPlaybackRate) {
      try {
        ytPlayerRef.current.setPlaybackRate(rate);
      } catch {}
    }
    setPlayback(prev => ({ ...prev, playbackRate: rate }));
  };

  const setSleepTimer = (minutes: number | null, isEndOfTrack?: boolean) => {
    if (isEndOfTrack) {
      setPlayback(prev => ({
        ...prev,
        sleepTimerSecondsLeft: null,
        sleepTimerIsEndOfTrack: true,
        isSleepTimerOpen: false,
      }));
      return;
    }

    if (minutes !== null && minutes > 0) {
      setPlayback(prev => ({
        ...prev,
        sleepTimerSecondsLeft: minutes * 60,
        sleepTimerIsEndOfTrack: false,
        isSleepTimerOpen: false,
      }));
    } else {
      cancelSleepTimer();
    }
  };

  const cancelSleepTimer = () => {
    setPlayback(prev => ({
      ...prev,
      sleepTimerSecondsLeft: null,
      sleepTimerIsEndOfTrack: false,
    }));
  };

  const toggleSleepTimerModal = () => {
    setPlayback(prev => ({ ...prev, isSleepTimerOpen: !prev.isSleepTimerOpen }));
  };

  const toggleEqualizerModal = () => {
    setPlayback(prev => ({ ...prev, isEqualizerOpen: !prev.isEqualizerOpen }));
  };

  const setEqualizerPreset = (preset: EqualizerPreset) => {
    const found = EQUALIZER_PRESETS.find(p => p.id === preset);
    const gains = found ? [...found.gains] : [0, 0, 0, 0, 0];
    try {
      localStorage.setItem('simply_music_eq_preset', preset);
      localStorage.setItem('simply_music_eq_gains', JSON.stringify(gains));
    } catch {}
    setPlayback(prev => ({
      ...prev,
      equalizerPreset: preset,
      equalizerGains: gains,
    }));
  };

  const setEqualizerBandGain = (bandIndex: number, gain: number) => {
    const safeGain = Math.max(-12, Math.min(12, gain));
    setPlayback(prev => {
      const nextGains = [...(prev.equalizerGains || [0, 0, 0, 0, 0])];
      nextGains[bandIndex] = safeGain;
      try {
        localStorage.setItem('simply_music_eq_gains', JSON.stringify(nextGains));
      } catch {}
      return {
        ...prev,
        equalizerGains: nextGains,
      };
    });
  };

  const resetEqualizer = () => {
    setEqualizerPreset('flat');
  };

  // Expose live time directly from YT player (bypasses React render cycle)
  const getLiveTime = (): number => {
    if (activeEngineRef.current === 'youtube' && isYtReadyRef.current && ytPlayerRef.current) {
      try {
        const t = ytPlayerRef.current.getCurrentTime?.();
        if (typeof t === 'number' && !isNaN(t)) return t;
      } catch {}
    }
    if (audioRef.current) {
      return audioRef.current.currentTime || 0;
    }
    return playbackRef.current.currentTime || 0;
  };

  return (
    <PlayerContext.Provider
      value={{
        playback,
        playSong,
        togglePlay,
        pause,
        resume,
        nextTrack,
        previousTrack,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        setPlaybackRate,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        openFullPlayer,
        closeFullPlayer,
        toggleQueueModal,
        toggleVideoMode,
        toggleEqualizerModal,
        toggleSleepTimerModal,
        setEqualizerPreset,
        setEqualizerBandGain,
        resetEqualizer,
        setSleepTimer,
        cancelSleepTimer,
        likedSongIds,
        toggleLike,
        isLiked,
        audioQuality,
        setAudioQuality,
        similarSongs,
        autoplaySimilar,
        toggleAutoplaySimilar,
        addSimilarToQueue,
        getLiveTime,
        ytPlayerRef,
      }}
    >
      {children}
      {/* Global Equalizer & Sleep Timer Modals */}
      <EqualizerModal />
      <SleepTimerModal />

      {/* Global Persistent YouTube Player Host - in-viewport so mobile browsers keep background audio playing */}
      <div
        id="youtube-player-wrapper"
        className={
          playback.isFullPlayerOpen && playback.isVideoMode && playback.currentSong?.youtubeId
            ? 'fixed z-[60] top-[140px] sm:top-[160px] inset-x-0 mx-auto w-[92%] max-w-[460px] aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black pointer-events-auto transition-all duration-300'
            : 'fixed bottom-0 end-0 w-[2px] h-[2px] opacity-[0.01] pointer-events-none'
        }
      >
        <div id="youtube-player-host" className="w-full h-full" />
      </div>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
