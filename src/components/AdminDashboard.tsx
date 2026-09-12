import React, { useEffect, useState } from 'react';
import { Shield, Users, Music, Disc3, Radio, Server, AlertTriangle, RefreshCw } from 'lucide-react';
import { AdminStats, User, ProviderConfig, PlaybackLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [logs, setLogs] = useState<PlaybackLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = () => {
    if (!token) return;
    setLoading(true);

    Promise.all([
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/admin/providers', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/admin/errors', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([statsData, usersData, providersData, logsData]) => {
        setStats(statsData);
        setUsers(usersData.users || []);
        setProviders(providersData.providers || []);
        setLogs(logsData.logs || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
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

  const toggleUserStatus = async (userId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/admin/users/${userId}/disable`, {
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
              <span className="text-[11px] font-medium uppercase">{t('adminUsers')}</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151d] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Music className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-medium uppercase">{t('adminSongs')}</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalSongs}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151d] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] font-medium uppercase">{t('adminArtists')}</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalArtists}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151d] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Radio className="w-4 h-4 text-rose-400" />
              <span className="text-[11px] font-medium uppercase">{t('adminPlaylists')}</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalPlaylists}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151d] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Disc3 className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-medium uppercase">הזרמות סה״כ</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalStreamsServed}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151d] border border-white/5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Server className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-medium uppercase">ספקים פעילים</span>
            </div>
            <p className="text-2xl font-black text-white">{providers.filter(p => p.enabled).length}</p>
          </div>
        </div>
      )}

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

      {/* Users Management */}
      <section className="p-6 rounded-2xl bg-[#13151d] border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Users className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">{t('adminUsers')} ({users.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-zinc-300">
            <thead className="text-zinc-500 uppercase border-b border-white/5">
              <tr>
                <th className="py-2.5 px-3 text-start">{t('username')}</th>
                <th className="py-2.5 px-3 text-start">{t('email')}</th>
                <th className="py-2.5 px-3 text-start">תפקיד</th>
                <th className="py-2.5 px-3 text-start">סטטוס</th>
                <th className="py-2.5 px-3 text-start">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover bg-zinc-800"
                    />
                    <span>{u.username}</span>
                  </td>
                  <td className="py-3 px-3 text-zinc-400">{u.email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.disabled ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {u.disabled ? 'מושעה' : 'פעיל'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {u.disabled ? 'הפעל חשבון' : 'השעה חשבון'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

