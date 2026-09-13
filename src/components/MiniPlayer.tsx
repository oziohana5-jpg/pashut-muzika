import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, ChevronUp, ListMusic, Video } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { formatTime } from '../utils/formatters';

export const MiniPlayer: React.FC = () => {
  const {
    playback,
    togglePlay,
    nextTrack,
    previousTrack,
    openFullPlayer,
    toggleVideoMode,
    toggleQueueModal,
    isLiked,
    toggleLike,
  } = usePlayer();

  if (!playback.currentSong) return null;

  const current = playback.currentSong;
  const liked = isLiked(current.id);
  const progressPercent = playback.duration > 0 ? (playback.currentTime / playback.duration) * 100 : 0;

  return (
    <div
      id="mini-player-container"
      className="fixed z-40 start-2 end-2 md:start-64 md:end-4 bottom-[68px] md:bottom-3"
    >
      <div className="relative bg-[#13151d]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Progress Micro Bar */}
        <div className="absolute top-0 start-0 end-0 h-[3px] bg-white/10">
          <div
            className="h-full bg-blue-500 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between p-2.5 sm:px-4">
          {/* Track Info (clickable to open full player) */}
          <div
            id="mini-player-track-info"
            onClick={openFullPlayer}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/5 shadow-md">
              <img
                src={current.coverUrl}
                alt={current.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
              />
              {playback.isBuffering && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pe-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition">
                  {current.titleHe || current.title}
                </p>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  שיר מלא
                </span>
                {current.youtubeId && (
                  <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    HD
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {current.artistName}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              id="mini-player-like-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(current.id, current);
              }}
              className={`p-2 rounded-full transition ${
                liked ? 'text-rose-500 hover:text-rose-400' : 'text-zinc-400 hover:text-white'
              }`}
              aria-label="Like"
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
            </button>

            <button
              id="mini-player-prev-btn"
              onClick={(e) => {
                e.stopPropagation();
                previousTrack();
              }}
              className="hidden sm:inline-flex p-2 text-zinc-300 hover:text-white transition"
              aria-label="Previous"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              id="mini-player-play-btn"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg"
              aria-label={playback.isPlaying ? 'Pause' : 'Play'}
            >
              {playback.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </button>

            {current.youtubeId && (
              <button
                id="mini-player-video-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openFullPlayer();
                  toggleVideoMode();
                }}
                className={`p-2 rounded-full transition ${
                  playback.isVideoMode ? 'text-rose-400 bg-rose-500/10' : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
                aria-label="Music video"
                title="קליפ YouTube"
              >
                <Video className="w-4 h-4" />
              </button>
            )}

            <button
              id="mini-player-next-btn"
              onClick={(e) => {
                e.stopPropagation();
                nextTrack();
              }}
              className="p-2 text-zinc-300 hover:text-white transition"
              aria-label="Next"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Queue / Similar Songs button ("כפתור של בתור") */}
            <button
              id="mini-player-queue-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleQueueModal();
              }}
              className="relative p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition flex items-center justify-center"
              title="תור השמעה ושירים דומים"
              aria-label="תור השמעה"
            >
              <ListMusic className="w-4 h-4 text-zinc-300" />
              {playback.queue.length > 0 && (
                <span className="absolute -top-0.5 -end-0.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border border-black shadow">
                  {playback.queue.length}
                </span>
              )}
            </button>

            <button
              id="mini-player-expand-btn"
              onClick={openFullPlayer}
              className="p-2 text-zinc-400 hover:text-white transition hidden md:inline-flex"
              aria-label="Expand"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
