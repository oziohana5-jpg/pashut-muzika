import React from 'react';
import { Sliders, X, RotateCcw, Volume2, Sparkles, Check } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { EqualizerPreset } from '../types';

export const EQUALIZER_PRESETS: {
  id: EqualizerPreset;
  nameHe: string;
  nameEn: string;
  description: string;
  gains: number[];
}[] = [
  {
    id: 'flat',
    nameHe: 'שטוח / טבעי',
    nameEn: 'Flat',
    description: 'ללא שינוי, צליל מקורי ומאוזן מהאולפן',
    gains: [0, 0, 0, 0, 0],
  },
  {
    id: 'bass_boost',
    nameHe: 'בס מוגבר ועמוק',
    nameEn: 'Bass Boost',
    description: 'הדגשת תדרים נמוכים ועומק פעימות',
    gains: [8, 6, 2, 0, -1],
  },
  {
    id: 'vocal',
    nameHe: 'ווקאל וקולות (שירה)',
    nameEn: 'Vocal Clarity',
    description: 'הבלטת שירה ודיבור ברור וחד',
    gains: [-2, 1, 5, 4, 1],
  },
  {
    id: 'treble_boost',
    nameHe: 'טרבל צלול ובהיר',
    nameEn: 'Treble Boost',
    description: 'חידוד תדרים גבוהים, מצילות וצלילים דקים',
    gains: [-1, 0, 2, 6, 8],
  },
  {
    id: 'electronic',
    nameHe: 'אלקטרוני ומועדונים',
    nameEn: 'Electronic / EDM',
    description: 'שילוב בס עמוק וטרבל פריך למוזיקת דאנס',
    gains: [7, 5, -1, 3, 6],
  },
  {
    id: 'rock',
    nameHe: 'רוק וגיטרות',
    nameEn: 'Rock',
    description: 'עוצמה לגיטרות חשמליות ולתופים',
    gains: [6, 3, -1, 3, 5],
  },
  {
    id: 'pop',
    nameHe: 'פופ מודרני',
    nameEn: 'Pop',
    description: 'איזון רחב ודינמי ללהיטי רדיו',
    gains: [3, 4, 2, 3, 3],
  },
  {
    id: 'acoustic',
    nameHe: 'אקוסטי וחם',
    nameEn: 'Acoustic',
    description: 'חום עדין לכלים אקוסטיים ופסנתר',
    gains: [4, 3, 2, 3, 4],
  },
];

const BAND_FREQUENCIES = [
  { freq: '60Hz', label: 'סאב בס' },
  { freq: '230Hz', label: 'בס' },
  { freq: '910Hz', label: 'מיד' },
  { freq: '3.6kHz', label: 'מיד עליון' },
  { freq: '14kHz', label: 'טרבל' },
];

export const EqualizerModal: React.FC = () => {
  const {
    playback,
    toggleEqualizerModal,
    setEqualizerPreset,
    setEqualizerBandGain,
    resetEqualizer,
    audioQuality,
    setAudioQuality,
  } = usePlayer();

  if (!playback.isEqualizerOpen) return null;

  const currentGains = playback.equalizerGains || [0, 0, 0, 0, 0];

  // Generate smooth SVG curve through the 5 points
  // Width: 400, Height: 120, baseline Y = 60 (0 dB), min Y = 10 (+12 dB), max Y = 110 (-12 dB)
  const points = currentGains.map((gain, i) => {
    const x = 40 + i * 80;
    // Map -12..+12 to 110..10
    const clamped = Math.max(-12, Math.min(12, gain));
    const y = 60 - (clamped / 12) * 50;
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (pt.x - prev.x) / 2;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (pt.x - prev.x) / 2;
    const cpy2 = pt.y;
    return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${pt.x} ${pt.y}`;
  }, '');

  return (
    <div
      id="equalizer-modal-backdrop"
      onClick={toggleEqualizerModal}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div
        id="equalizer-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#11131a] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl text-white max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">איקוולייזר אולפני</h2>
              <p className="text-xs text-zinc-400">כיול תדרים והתאמת צליל אישית (5 תדרים)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetEqualizer}
              title="איפוס להגדרות ברירת מחדל"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5 text-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">איפוס</span>
            </button>
            <button
              onClick={toggleEqualizerModal}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition"
              aria-label="סגירה"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual Frequency Response Curve */}
        <div className="mt-5 p-4 rounded-2xl bg-[#090b10] border border-white/5">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-2 font-mono">
            <span>+12 dB</span>
            <span className="text-zinc-400 font-sans text-xs">עקומת תדרים (EQ Curve)</span>
            <span>-12 dB</span>
          </div>
          <div className="relative w-full h-[120px]">
            <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="eqStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="60" x2="380" y2="60" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <line x1="20" y1="35" x2="380" y2="35" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
              <line x1="20" y1="85" x2="380" y2="85" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />

              {/* Shaded Area under curve */}
              <path
                d={`${pathD} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z`}
                fill="url(#eqFill)"
              />

              {/* The Curve */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#eqStroke)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-150"
              />

              {/* Interactive Knots */}
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  className="fill-white stroke-blue-500 stroke-2 transition-all duration-150"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* 5-Band Vertical Frequency Sliders */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4 mt-6 py-2">
          {BAND_FREQUENCIES.map((band, idx) => {
            const gain = currentGains[idx] || 0;
            return (
              <div key={band.freq} className="flex flex-col items-center gap-3">
                <span className="text-xs font-mono font-semibold text-blue-400">
                  {gain > 0 ? `+${gain}` : gain} <span className="text-[10px] text-zinc-500">dB</span>
                </span>

                <div className="relative h-36 flex items-center justify-center">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => setEqualizerBandGain(idx, parseFloat(e.target.value))}
                    className="w-32 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 -rotate-90 origin-center"
                    aria-label={`${band.freq} gain`}
                  />
                </div>

                <div className="text-center">
                  <p className="text-xs font-bold text-zinc-200">{band.freq}</p>
                  <p className="text-[10px] text-zinc-500">{band.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Presets Grid */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            תבניות צליל מוכנות (Presets)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EQUALIZER_PRESETS.map((preset) => {
              const isSelected = playback.equalizerPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setEqualizerPreset(preset.id)}
                  className={`p-2.5 rounded-2xl border text-start transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold truncate text-white">{preset.nameHe}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-zinc-500 truncate">{preset.nameEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Quality Selection */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-300">איכות הזרמת שמע</span>
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/5">
            {(['high', 'normal', 'saver'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setAudioQuality(q)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  audioQuality === q
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {q === 'high' ? 'HQ (320k)' : q === 'normal' ? 'רגיל (192k)' : 'חסכון (128k)'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
