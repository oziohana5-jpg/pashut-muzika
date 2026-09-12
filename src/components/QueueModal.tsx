import React from 'react';
import { X, Trash2, Play, Music, Radio, ArrowUp, ArrowDown } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime } from '../utils/formatters';

export const QueueModal: React.FC = () => {
  const {
    playback,
    toggleQueueModal,
    playSong,
    removeFromQueue,
    reorderQueue,
    clearQueue,
  } = usePlayer();

  const { t } = useLanguage();

  if (!playback.isQueueOpen) return null;

  const current = playback.currentSong;
  const queue = playback.queue;

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newQueue = [...queue];
    const temp = newQueue[index - 1];
    newQueue[index - 1] = newQueue[index];
    newQueue[index] = temp;
    reorderQueue(newQueue);
  };

  const moveDown = (index: number) => {
    if (index === queue.length - 1) return;
    const newQueue = [...queue];
    const temp = newQueue[index + 1];
    newQueue[index + 1] = newQueue[index];
    newQueue[index] = temp;
    reorderQueue(newQueue);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        id="queue-modal-card"
        className="relative w-full max-w-lg bg-[#12141a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] text-white overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              <span>{t('queue')}</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
              {queue.length} {t('tracksCount')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                id="btn-clear-queue"
                onClick={clearQueue}
                className="text-xs text-zinc-400 hover:text-rose-400 transition flex items-center gap-1 px-2.5 py-1 rounded hover:bg-white/5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('clearQueue')}</span>
              </button>
            )}

            <button
              id="btn-close-queue-modal"
              onClick={toggleQueueModal}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Currently Playing */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              {t('nowPlaying')}
            </p>
            {current ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-600/10 border border-red-500/20">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-900">
                    <img
                      src={current.coverUrl}
                      alt={current.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Music className="w-4 h-4 text-red-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {current.titleHe || current.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {current.artistName}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-red-400 font-mono shrink-0 ps-3">
                  {formatTime(current.duration)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">{t('emptyQueue')}</p>
            )}
          </div>

          {/* Up Next List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t('upNext')}
              </p>
              {queue.length > 0 && (
                <span className="text-[11px] text-zinc-500">
                  {queue.length} שירים
                </span>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/10 rounded-xl text-zinc-400 text-xs bg-white/[0.02]">
                <p>אין שירים ממתינים בתור ידני.</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  השירים הדומים למטה יתנגנו אוטומטית בסיום השיר כמו בספוטיפיי!
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {queue.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs text-zinc-500 w-4 text-center">
                        {index + 1}
                      </span>
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-900">
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => {
                            const newQueue = queue.filter((_, i) => i !== index);
                            playSong(song, newQueue);
                          }}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      <div className="min-w-0 flex-1 pe-2">
                        <p className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                          {song.titleHe || song.title}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {song.artistName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === queue.length - 1}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-xs text-zinc-500 font-mono px-2">
                        {formatTime(song.duration)}
                      </span>

                      <button
                        onClick={() => removeFromQueue(index)}
                        className="p-1 text-zinc-500 hover:text-rose-400 transition"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* end queue list */}
        </div>
      </div>
    </div>
  );
};
