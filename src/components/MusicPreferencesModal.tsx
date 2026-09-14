import React, { useEffect, useState } from 'react';
import { Check, Loader2, Music2, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Artist } from '../types';

interface MusicPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const genres = ['פופ', 'מזרחית', 'היפ הופ', 'רוק', 'R&B', 'אלקטרוני', 'אקוסטי', 'מוזיקה ישראלית', 'מוזיקה בינלאומית'];

export const MusicPreferencesModal: React.FC<MusicPreferencesModalProps> = ({ isOpen, onClose }) => {
  const { token, refreshUser } = useAuth();
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [artistQuery, setArtistQuery] = useState('');
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const query = artistQuery.trim();
    if (!query) {
      setArtistResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}&filter=artists`, { signal: controller.signal });
        const data = await response.json();
        if (!controller.signal.aborted) setArtistResults(data.artists || []);
      } catch { /* Ignore cancelled searches. */ }
      finally { if (!controller.signal.aborted) setSearching(false); }
    }, 120);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [artistQuery]);

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

  return <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#080a10] text-white">
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-5xl flex-1">
        <div className="pt-6 text-center sm:pt-12"><div className="mb-5 inline-flex rounded-3xl border border-blue-400/25 bg-blue-500/15 p-4 text-blue-300"><Sparkles className="h-8 w-8" /></div><h2 className="text-3xl font-black tracking-tight sm:text-5xl">בוא נבנה לך מוזיקה משלך</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">בחר לפחות אמן אחד ועד 5 אמנים וסגנונות. נחבר לך המלצות שמתאימות באמת לטעם שלך.</p></div>
        <section className="mt-10"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-lg font-bold"><Music2 className="h-5 w-5 text-blue-400" /> חפש ובחר אמנים מכל העולם</h3><span className="text-xs text-zinc-500">{selectedArtists.length}/5 נבחרו</span></div><div className="relative"><Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" /><input autoFocus value={artistQuery} onChange={event => setArtistQuery(event.target.value)} placeholder="חפש אמן בעברית או באנגלית..." className="w-full rounded-2xl border border-white/10 bg-white/[.05] py-4 ps-12 pe-12 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-400" />{searching && <Loader2 className="absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-blue-400" />}</div>{artistResults.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{artistResults.map(artist => <button key={artist.id} onClick={() => toggle(artist.id, selectedArtists, setSelectedArtists)} className={`group relative overflow-hidden rounded-2xl border text-start transition hover:-translate-y-1 ${selectedArtists.includes(artist.id) ? 'border-blue-400 bg-blue-500/20 ring-2 ring-blue-400/30' : 'border-white/10 bg-white/[.04] hover:border-white/25'}`}><div className="aspect-square bg-zinc-900"><img src={artist.imageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></div><div className="p-3"><p className="truncate text-sm font-bold">{artist.nameHe || artist.name}</p><p className="mt-1 truncate text-[11px] text-zinc-500">{artist.genres?.[0] || 'Artist'}</p></div>{selectedArtists.includes(artist.id) && <span className="absolute end-2 top-2 rounded-full bg-blue-500 p-1.5"><Check className="h-4 w-4" /></span>}</button>)}</div>}{artistQuery && !searching && artistResults.length === 0 && <p className="mt-4 text-center text-sm text-zinc-500">לא נמצאו אמנים. נסה איות אחר.</p>}</section>
        <section className="mt-10"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">סגנונות שאוהבים</h3><span className="text-xs text-zinc-500">{selectedGenres.length}/5 נבחרו</span></div><div className="flex flex-wrap gap-3">{genres.map(genre => <button key={genre} onClick={() => toggle(genre, selectedGenres, setSelectedGenres)} className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${selectedGenres.includes(genre) ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : 'border-white/10 bg-white/[.04] text-zinc-300 hover:bg-white/[.08]'}`}>{genre}</button>)}</div></section>
      </div>
      <div className="sticky bottom-0 mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 bg-[#080a10]/95 py-5 backdrop-blur sm:flex-row"><p className="text-center text-sm text-zinc-500">חובה לבחור לפחות אמן אחד לפני שממשיכים</p><button onClick={save} disabled={saving || selectedArtists.length === 0} className="min-w-52 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'שומר...' : 'בנה לי המלצות'}</button></div>
    </div>
  </div>;
};