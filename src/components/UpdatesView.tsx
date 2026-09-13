import React, { useEffect, useState } from 'react';
import { Bell, CalendarDays, CheckCircle2, Info, Sparkles, Wrench } from 'lucide-react';
import { AppUpdate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const updateIcons = {
  info: Info,
  feature: Sparkles,
  fix: Wrench,
  important: Bell,
};

const updateColors = {
  info: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
  feature: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
  fix: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  important: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
};

export const UpdatesView: React.FC = () => {
  const { language } = useLanguage();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/updates')
      .then((response) => response.json())
      .then((data) => setUpdates(Array.isArray(data.updates) ? data.updates : []))
      .catch(() => setUpdates([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-5 pb-32 pt-8 sm:px-10">
      <header className="border-b border-white/10 pb-6 text-right">
        <div className="mb-2 flex items-center gap-3 text-blue-400">
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
            <Bell className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[.18em]">Simply Music</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">{language === 'he' ? 'עדכונים' : 'Updates'}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {language === 'he' ? 'כל מה שחדש, חשוב ומתוקן בפשוט מוזיקה.' : 'What is new, important, and improved in Simply Music.'}
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /></div>
      ) : updates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-zinc-500">
          {language === 'he' ? 'אין עדכונים חדשים כרגע.' : 'There are no updates yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => {
            const Icon = updateIcons[update.type];
            return (
              <article key={update.id} className="rounded-2xl border border-white/10 bg-[#13151d] p-5 text-right shadow-xl shadow-black/10 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 rounded-xl border p-2.5 ${updateColors[update.type]}`}><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-white">{update.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(update.createdAt).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}</span>
                      <span>{language === 'he' ? 'פורסם על ידי' : 'Published by'} {update.authorName}</span>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{update.body}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
