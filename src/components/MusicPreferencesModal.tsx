import React, { useState } from 'react';
import { Check, Music2, Sparkles, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MusicPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const artists = [
  ['art-omer-adam', 'עומר אדם'], ['art-hanan-ben-ari', 'חנן בן ארי'], ['art-osher-cohen', 'אושר כהן'],
  ['art-peer-tasi', 'פאר טסי'], ['art-tuna', 'טונה'], ['art-eyal-golan', 'אייל גולן'],
  ['art-coldplay', 'Coldplay'], ['art-the-weeknd', 'The Weeknd'], ['art-shlomo-artzi', 'שלמה ארצי'],
  ['itunes-art-1050474084', 'אפוקליפסה'],
];
const genres = ['פופ', 'מזרחית', 'היפ הופ', 'רוק', 'R&B', 'אלקטרוני', 'אקוסטי', 'מוזיקה ישראלית', 'מוזיקה בינלאומית'];

export const MusicPreferencesModal: React.FC<MusicPreferencesModalProps> = ({ isOpen, onClose }) => {
  const { token, refreshUser } = useAuth();
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  if (!isOpen) return null;

  const toggle = (value: string, values: string[], setValues: React.Dispatch<React.SetStateAction<string[]>>) => {
    setValues(current => current.includes(value) ? current.filter(item => item !== value) : current.length < 5 ? [...current, value] : current);
  };

  const save = async () => {
    if (!token || (!selectedArtists.length && !selectedGenres.length)) return;
    setSaving(true);
    try {
      await fetch('/api/auth/preferences', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ artistIds: selectedArtists, genres: selectedGenres }),
      });
      localStorage.removeItem('simply_music_onboarding_pending');
      await refreshUser();
      onClose();
    } finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
    <div className="w-full max-w-2xl rounded-3xl border border-blue-400/20 bg-[#12141c] p-6 text-white shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4"><div><div className="mb-3 inline-flex rounded-2xl border border-blue-400/20 bg-blue-500/15 p-3 text-blue-300"><Sparkles /></div><h2 className="text-2xl font-black">בוא נבנה לך מוזיקה משלך</h2><p className="mt-2 text-sm text-zinc-400">בחר עד 5 אמנים ועד 5 סגנונות. נשתמש בזה כדי להתחיל להמליץ לך נכון.</p></div><button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white"><X /></button></div>
      <div className="mt-6"><h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Music2 className="h-4 w-4 text-blue-400" /> אמנים שאוהבים</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{artists.map(([id, label]) => <button key={id} onClick={() => toggle(id, selectedArtists, setSelectedArtists)} className={`relative rounded-xl border px-3 py-3 text-xs font-semibold transition ${selectedArtists.includes(id) ? 'border-blue-400 bg-blue-500/20 text-blue-200' : 'border-white/10 bg-white/[.03] text-zinc-300 hover:bg-white/[.08]'}`}>{selectedArtists.includes(id) && <Check className="absolute end-2 top-2 h-3.5 w-3.5" />}{label}</button>)}</div></div>
      <div className="mt-6"><h3 className="mb-3 text-sm font-bold">סגנונות</h3><div className="flex flex-wrap gap-2">{genres.map(genre => <button key={genre} onClick={() => toggle(genre, selectedGenres, setSelectedGenres)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${selectedGenres.includes(genre) ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : 'border-white/10 bg-white/[.03] text-zinc-300 hover:bg-white/[.08]'}`}>{genre}</button>)}</div></div>
      <div className="mt-7 flex items-center justify-between gap-3"><span className="text-xs text-zinc-500">{selectedArtists.length}/5 אמנים · {selectedGenres.length}/5 סגנונות</span><button onClick={save} disabled={saving || (!selectedArtists.length && !selectedGenres.length)} className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-40">{saving ? 'שומר...' : 'בנה לי המלצות'}</button></div>
    </div>
  </div>;
};