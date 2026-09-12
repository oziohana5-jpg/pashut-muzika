import React, { useState } from 'react';
import { Moon, X, Clock, Check, Plus, AlertCircle, Volume2 } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { formatTime } from '../utils/formatters';

const TIMER_PRESETS = [
  { minutes: 5, label: '5 דקות' },
  { minutes: 15, label: '15 דקות' },
  { minutes: 30, label: '30 דקות' },
  { minutes: 45, label: '45 דקות' },
  { minutes: 60, label: '60 דקות' },
  { minutes: 90, label: 'שעה וחצי' },
];

export const SleepTimerModal: React.FC = () => {
  const {
    playback,
    toggleSleepTimerModal,
    setSleepTimer,
    cancelSleepTimer,
  } = usePlayer();

  const [customMinutes, setCustomMinutes] = useState<string>('20');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!playback.isSleepTimerOpen) return null;

  const isActive = playback.sleepTimerSecondsLeft !== null && playback.sleepTimerSecondsLeft > 0;
  const isEndOfTrack = playback.sleepTimerIsEndOfTrack;

  const handleSetCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      setSleepTimer(mins);
      setShowCustomInput(false);
    }
  };

  const handleAddFiveMinutes = () => {
    if (playback.sleepTimerSecondsLeft !== null) {
      const currentMins = Math.ceil(playback.sleepTimerSecondsLeft / 60);
      setSleepTimer(currentMins + 5);
    }
  };

  return (
    <div
      id="sleep-timer-modal-backdrop"
      onClick={toggleSleepTimerModal}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div
        id="sleep-timer-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#11131a] border border-white/10 rounded-3xl p-6 shadow-2xl text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">טיימר שינה</h2>
              <p className="text-xs text-zinc-400">עצירה אוטומטית ועמעום עדין של המוזיקה</p>
            </div>
          </div>
          <button
            onClick={toggleSleepTimerModal}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition"
            aria-label="סגירה"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Countdown State */}
        {isActive ? (
          <div className="my-6 p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-center">
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-1">
              טיימר שינה פעיל כעת
            </p>
            <div className="text-4xl font-extrabold font-mono tracking-wider text-white my-2">
              {formatTime(playback.sleepTimerSecondsLeft || 0)}
            </div>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-4">
              המוזיקה תנמיך את עוצמת השמע ב-15 השניות האחרונות ותעצור בצורה שקטה
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleAddFiveMinutes}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+5 דקות</span>
              </button>
              <button
                onClick={cancelSleepTimer}
                className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
              >
                בטל טיימר שינה
              </button>
            </div>
          </div>
        ) : isEndOfTrack ? (
          <div className="my-6 p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-center">
            <p className="text-sm font-bold text-white mb-1">המוזיקה תעצור בסיום השיר הנוכחי</p>
            <p className="text-xs text-zinc-400 mb-4">
              {playback.currentSong ? `"${playback.currentSong.titleHe || playback.currentSong.title}"` : ''}
            </p>
            <button
              onClick={cancelSleepTimer}
              className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
            >
              בטל טיימר שינה
            </button>
          </div>
        ) : null}

        {/* Preset Selections */}
        <div className="mt-4 space-y-2">
          {/* End of Current Track Option */}
          <button
            onClick={() => setSleepTimer(null, true)}
            className={`w-full p-3.5 rounded-2xl border transition flex items-center justify-between text-start ${
              isEndOfTrack
                ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                : 'bg-white/[0.03] border-white/5 text-zinc-300 hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-sm font-bold block">בסיום השיר הנוכחי</span>
                <span className="text-[11px] text-zinc-400">הנגן יעצור ברגע שהשיר הנוכחי יסתיים</span>
              </div>
            </div>
            {isEndOfTrack && <Check className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Time Presets Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {TIMER_PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => setSleepTimer(preset.minutes)}
                className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-center transition flex flex-col items-center justify-center gap-1 group"
              >
                <span className="text-sm font-bold text-white group-hover:text-indigo-300">
                  {preset.label}
                </span>
                <span className="text-[10px] text-zinc-500">עצירה אוטומטית</span>
              </button>
            ))}
          </div>

          {/* Custom Time Form */}
          {showCustomInput ? (
            <form onSubmit={handleSetCustom} className="pt-2 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="360"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="דקות"
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                הפעל טיימר
              </button>
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="p-2.5 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full mt-2 py-2.5 rounded-2xl border border-dashed border-white/15 text-zinc-400 hover:text-white hover:border-white/30 text-xs font-semibold transition text-center"
            >
              הגדרת זמן מותאם אישית בדקות...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
