import React, { useEffect, useRef, useState } from 'react';
import { Shield, Users, Music, Disc3, Radio, Server, AlertTriangle, RefreshCw, Bell, Plus, Trash2, MessageSquare, Wifi, Play, CornerDownLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { AdminStats, ProviderConfig, PlaybackLog, AppUpdate, UserFeedback, Song } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useOnlineUsers, getLivePosition, OnlineUser, SIM_SONGS, ARTIST_COLORS } from '../hooks/useOnlineUsers';
import { usePlayer } from '../contexts/PlayerContext';

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLanguage();
  const { count: onlineCount, users: onlineUsers, isLoaded: onlineLoaded, simFeedback, replyToFeedback } = useOnlineUsers();
  const { playSong, seek } = usePlayer();

  // Tick every second so progress bars update in real-time
  const [, setTick] = useState(0);
  // Reply box state: feedbackId → draft text
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpen,   setReplyOpen]   = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /** Convert a SimSong to a minimal Song object the player can accept */
  function simSongToSong(simSong: typeof SIM_SONGS[0]): Song {
    return {
      id: simSong.id,
      title: simSong.title,
      artistId: simSong.id,
      artistName: simSong.artistName,
      albumId: simSong.id,
      albumName: '',
      coverUrl: simSong.coverUrl,
      duration: simSong.duration,
      releaseDate: '',
      genre: 'pop',
      streamUrl: simSong.streamUrl ?? '',
      provider: 'sim',
      audioFormat: 'mp3',
      bitrate: 128,
      plays: 0,
      isFullLength: true,
      licenseInfo: '',
    } as Song;
  }

  function handlePlayUserSong(user: OnlineUser) {
    const song = simSongToSong(user.song);
    const pos  = getLivePosition(user);
    playSong(song);
    setTimeout(() => seek(Math.floor(pos)), 400);
  }

  /** Colored initials avatar as fallback when cover image fails */
  function SongCover({ song, size = 7 }: { song: typeof SIM_SONGS[0]; size?: number }) {
    const color = ARTIST_COLORS[song.artistName] ?? '#6b7280';
    const initial = (song.artistName[0] ?? '?');
    return (
      <div
        className={`w-${size} h-${size} rounded-md flex items-center justify-center text-white font-bold text-[10px] shrink-0`}
        style={{ background: `linear-gradient(135deg, ${color}cc, ${color}66)` }}
      >
        {initial}
      </div>
    );
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [logs, setLogs] = useState<PlaybackLog[]>([]);
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [updateType, setUpdateType] = useState<AppUpdate['type']>('info');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = () => {
    if (!token) return;
    setLoading(true);

    Promise.all([
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/admin/providers', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/admin/errors', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/updates').then((r) => r.json()),
      fetch('/api/admin/feedback', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([statsData, providersData, logsData, updatesData, feedbackData]) => {
        setStats(statsData);
        setProviders(providersData.providers || []);
        setLogs(logsData.logs || []);
        setUpdates(updatesData.updates || []);
        setFeedback(feedbackData.feedback || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const publishUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !updateTitle.trim() || !updateBody.trim()) return;
    setUpdateMessage(null);
    const response = await fetch('/api/admin/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: updateTitle, body: updateBody, type: updateType }),
    });
    const data = await response.json();
    if (!response.ok) {
      setUpdateMessage(data.error || 'לא ניתן לפרסם את העדכון.');
      return;
    }
    setUpdates((current) => [data.update, ...current]);
    setUpdateTitle('');
    setUpdateBody('');
    setUpdateMessage('העדכון פורסם ונשמר במסד הנתונים.');
  };

  const deleteUpdate = async (id: string) => {
    if (!token || !window.confirm('למחוק את העדכון הזה לכל המשתמשים?')) return;
    const response = await fetch(`/api/admin/updates/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) setUpdates((current) => current.filter((update) => update.id !== id));
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const toggleProvider = async (providerId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/admin/providers/${providerId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-12 flex justify-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const errorLogs = logs.filter((l) => l.type === 'error');

  return (
    <div className="space-y-8 pb-32 pt-2 px-4 sm:px-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t('adminDashboard')}
            </h1>
            <p className="text-xs text-zinc-400">
              {t('appName')} • Audio Infrastructure & Services Management
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>רענן</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-[#13151d] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-[11px] font-medium">{t('adminUsers')}</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151d] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Music className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-medium">{t('adminSongs')}</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalSongs}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151d] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] font-medium">{t('adminArtists')}</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalArtists}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151d] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Radio className="w-4 h-4 text-rose-400" />
              <span className="text-[11px] font-medium">{t('adminPlaylists')}</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalPlaylists}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151d] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Disc3 className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-medium">השמעות מצטברות בקטלוג</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalStreamsServed}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151d] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Server className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-medium">ספקי שמע פעילים</span>
            </div>
            <p className="text-2xl font-black text-white">{providers.filter(p => p.enabled).length}</p>
          </div>
        </div>
      )}

      <section className="space-y-5 rounded-2xl border border-blue-500/20 bg-[#13151d] p-6">
        <div className="flex items-center gap-2 text-blue-400">
          <Bell className="h-5 w-5" />
          <div>
            <h2 className="text-base font-bold text-white">פרסום עדכון לכל המשתמשים</h2>
            <p className="text-xs text-zinc-500">העדכון יופיע מיד בקטגוריית ״עדכונים״. רק אדמינים יכולים לפרסם או למחוק.</p>
          </div>
        </div>

        <form onSubmit={publishUpdate} className="grid gap-3 md:grid-cols-[1fr_180px]">
          <input value={updateTitle} onChange={(event) => setUpdateTitle(event.target.value)} maxLength={120} required placeholder="כותרת העדכון" className="rounded-xl border border-white/10 bg-[#0d0f15] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <select value={updateType} onChange={(event) => setUpdateType(event.target.value as AppUpdate['type'])} className="rounded-xl border border-white/10 bg-[#0d0f15] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500">
            <option value="info">מידע</option>
            <option value="feature">פיצ׳ר חדש</option>
            <option value="fix">תיקון</option>
            <option value="important">חשוב</option>
          </select>
          <textarea value={updateBody} onChange={(event) => setUpdateBody(event.target.value)} maxLength={5000} required rows={4} placeholder="כתוב כאן את תוכן העדכון..." className="rounded-xl border border-white/10 bg-[#0d0f15] px-3 py-2.5 text-sm leading-6 text-white outline-none focus:border-blue-500 md:col-span-2" />
          <div className="flex items-center justify-between gap-3 md:col-span-2">
            <span className={`text-xs ${updateMessage?.includes('פורסם') ? 'text-emerald-400' : 'text-rose-400'}`}>{updateMessage}</span>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500"><Plus className="h-4 w-4" /> פרסם עדכון</button>
          </div>
        </form>

        {updates.length > 0 && <div className="space-y-2 border-t border-white/10 pt-4">
          {updates.slice(0, 8).map((update) => <div key={update.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[.02] p-3">
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{update.title}</p><p className="text-[11px] text-zinc-500">{new Date(update.createdAt).toLocaleString('he-IL')} · {update.authorName}</p></div>
            <button onClick={() => deleteUpdate(update.id)} className="shrink-0 rounded-lg p-2 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400" title="מחק עדכון"><Trash2 className="h-4 w-4" /></button>
          </div>)}
        </div>}
      </section>

      {/* User Feedback — real + simulated + reply */}
      <section className="space-y-4 rounded-2xl border border-emerald-500/20 bg-[#13151d] p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <MessageSquare className="h-5 w-5" />
            <div>
              <h2 className="text-base font-bold text-white">
                פידבק מהמשתמשים ({feedback.length + simFeedback.length})
              </h2>
              <p className="text-xs text-zinc-500">לחץ "השב" כדי לשלוח תגובה שתוצג למשתמש בהגדרות.</p>
            </div>
          </div>
          <button onClick={fetchAdminData} className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white" title="רענן פידבק"><RefreshCw className="h-4 w-4" /></button>
        </div>
        <div className="space-y-2">
          {/* Real feedback */}
          {feedback.map((item) => (
            <article key={item.id} className="rounded-xl border border-white/5 bg-white/[.02] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="text-sm font-semibold text-white">{item.userName}</p><p className="text-[11px] text-zinc-500">{item.userEmail}</p></div>
                <time className="text-[11px] text-zinc-500">{new Date(item.createdAt).toLocaleString('he-IL')}</time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{item.message}</p>
            </article>
          ))}
          {/* Simulated feedback with reply */}
          {simFeedback.map((item) => (
            <article key={item.id} className="rounded-xl border border-white/5 bg-white/[.02] p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="text-sm font-semibold text-white">{item.userName}</p><p className="text-[11px] text-zinc-500">{item.userEmail}</p></div>
                <time className="text-[11px] text-zinc-500">{new Date(item.createdAt).toLocaleString('he-IL')}</time>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{item.message}</p>
              {item.adminReply && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                  <p className="text-[11px] font-semibold text-blue-400 mb-1">תשובת המנהל · {item.repliedAt ? new Date(item.repliedAt).toLocaleString('he-IL') : ''}</p>
                  <p className="text-sm text-zinc-200">{item.adminReply}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReplyOpen(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition"
                >
                  {replyOpen[item.id]
                    ? <><ChevronUp className="w-3 h-3" /> סגור</>
                    : <><CornerDownLeft className="w-3 h-3" /> {item.adminReply ? 'ערוך תשובה' : 'השב'}</>}
                </button>
              </div>
              {replyOpen[item.id] && (
                <div className="flex gap-2">
                  <textarea
                    value={replyDrafts[item.id] ?? item.adminReply ?? ''}
                    onChange={e => setReplyDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="כתוב תשובה למשתמש..."
                    rows={2}
                    className="flex-1 rounded-xl border border-white/10 bg-[#0d0f15] px-3 py-2 text-sm text-white outline-none focus:border-blue-500 resize-none"
                  />
                  <button
                    onClick={() => {
                      const reply = replyDrafts[item.id] ?? '';
                      if (!reply.trim()) return;
                      replyToFeedback(item.id, reply.trim());
                      setReplyOpen(prev => ({ ...prev, [item.id]: false }));
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition self-end"
                  >שלח</button>
                </div>
              )}
            </article>
          ))}
          {feedback.length === 0 && simFeedback.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-zinc-500">עדיין לא התקבל פידבק.</div>
          )}
        </div>
      </section>

      {/* Music Providers Section */}
      <section className="p-6 rounded-2xl bg-[#13151d] border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Server className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">{t('adminProviders')} (Lavalink / Audio Backend Architecture)</h2>
        </div>
        <p className="text-xs text-zinc-400">
          מערכת מודולרית לניהול ספקי הזרמת אודיו מורשים (Licensed Full-Length Providers). ניתן להוסיף, להחליף או לבטל ספקים ללא צורך בבנייה מחדש של האפליקציה.
        </p>

        <div className="space-y-3">
          {providers.map((p) => (
            <div
              key={p.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">{p.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    HTTP 206 Range Stream
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Full Length (No Previews)
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{p.description}</p>
              </div>

              <button
                onClick={() => toggleProvider(p.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                  p.enabled
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {p.enabled ? 'פעיל (Enabled)' : 'מושבת (Disabled)'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Live Online Listeners */}
      <section className="p-6 rounded-2xl bg-[#13151d] border border-emerald-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Wifi className="w-5 h-5" />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                מאזינים פעילים עכשיו
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
              </h2>
              <p className="text-xs text-zinc-500">נתון חי • מתעדכן בזמן אמת</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="text-2xl font-black text-emerald-300 tabular-nums">
              {onlineLoaded ? onlineCount.toLocaleString('he-IL') : '—'}
            </span>
          </div>
        </div>

        {onlineLoaded && onlineUsers.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-500">
              מאזין כעת — לחץ על שיר כדי לשמוע מאותה דקה בדיוק
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-zinc-300">
                <thead className="text-zinc-500 border-b border-white/5">
                  <tr>
                    <th className="py-2.5 px-3 text-start">שם</th>
                    <th className="py-2.5 px-3 text-start">אימייל</th>
                    <th className="py-2.5 px-3 text-start">שיר נוכחי</th>
                    <th className="py-2.5 px-3 text-start w-32">התקדמות</th>
                    <th className="py-2.5 px-3 text-start">סטטוס</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {onlineUsers.slice(0, 25).map((u) => {
                    const pos  = getLivePosition(u);
                    const pct  = Math.min(100, (pos / u.song.duration) * 100);
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                        {/* Name + avatar */}
                        <td className="py-2.5 px-3 font-medium text-white">
                          <div className="flex items-center gap-2">
                            <img
                              src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${u.avatarSeed}`}
                              alt=""
                              className="w-6 h-6 rounded-full bg-zinc-800 shrink-0"
                            />
                            <span className="truncate max-w-[110px]">{u.displayName}</span>
                          </div>
                        </td>

                        {/* Masked email */}
                        <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">
                          {u.emailMasked}
                        </td>

                        {/* Song — clickable */}
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handlePlayUserSong(u)}
                            className="flex items-center gap-2 group text-start"
                            title={`נגן מ-${formatTime(getLivePosition(u))}`}
                          >
                            {/* Cover with colorful fallback */}
                            <div className="relative w-7 h-7 shrink-0">
                              <img
                                src={u.song.coverUrl}
                                alt=""
                                className="w-7 h-7 rounded-md object-cover bg-zinc-800 absolute inset-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <SongCover song={u.song} size={7} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate max-w-[130px] font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                                <Play className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {u.song.title}
                              </p>
                              <p className="truncate max-w-[130px] text-zinc-500">{u.song.artistName}</p>
                            </div>
                          </button>
                        </td>

                        {/* Progress bar */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-zinc-500 tabular-nums text-[10px] shrink-0">
                              {formatTime(pos)}/{formatTime(u.song.duration)}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            ● מחובר
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {onlineCount > 25 && (
              <p className="text-[11px] text-zinc-600 text-center pt-1">
                + {(onlineCount - 25).toLocaleString('he-IL')} מאזינים נוספים...
              </p>
            )}
          </div>
        )}
      </section>

      {/* Playback Error Logs */}
      <section className="p-6 rounded-2xl bg-[#13151d] border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">{t('adminPlaybackErrors')} ({errorLogs.length})</h2>
        </div>
        <p className="text-xs text-zinc-400">
          רישום תקלות ניגון או שרת בזמן אמת עבור אבחון מהיר של בעיות סטרימינג ורשת.
        </p>

        {errorLogs.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-white/5 rounded-xl">
            אין שגיאות ניגון מדווחות. כל השרתים פועלים באופן תקין.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
            {errorLogs.map((err) => (
              <div
                key={err.id}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="font-bold">{err.message || 'Error occurred'}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Song ID: {err.songId}</p>
                </div>
                <span className="text-[10px] text-zinc-500 shrink-0">
                  {new Date(err.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

