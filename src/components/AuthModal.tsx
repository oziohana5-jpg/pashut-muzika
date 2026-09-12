import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  promptMessage?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  promptMessage,
}) => {
  const { login, loginWithGoogle, register, resetPassword } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async (customData?: { email?: string; displayName?: string; avatarUrl?: string; credential?: string }) => {
    if (!customData?.email) {
      setShowCustomGoogle(true);
      return;
    }
    setError(null);
    setGoogleLoading(true);
    const res = await loginWithGoogle(customData);
    setGoogleLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'ההתחברות עם גוגל נכשלה. נסה שוב.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === 'login') {
      const res = await login(identifier, password);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Authentication error');
      }
    } else if (mode === 'register') {
      if (password.length < 6) {
        setLoading(false);
        setError('Password must be at least 6 characters');
        return;
      }
      const res = await register(username, email, password, displayName);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Registration failed');
      }
    } else if (mode === 'forgot') {
      const res = await resetPassword(email, newPassword);
      setLoading(false);
      if (res.success) {
        setSuccessMsg(res.message || 'Password updated');
        setTimeout(() => {
          setMode('login');
          setSuccessMsg(null);
        }, 2000);
      } else {
        setError(res.error || 'Reset failed');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md bg-[#12141a] border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 text-white"
      >
        <button
          id="btn-close-auth-modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 mb-3 border border-blue-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === 'login' ? t('login') : mode === 'register' ? t('register') : t('resetPassword')}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {t('appName')} • {t('appTagline')}
          </p>
        </div>

        {promptMessage && (
          <div
            id="auth-guest-prompt"
            className="mb-4 p-3.5 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2.5 leading-relaxed shadow-inner"
          >
            <Lock className="w-4 h-4 shrink-0 text-blue-400" />
            <span>{promptMessage}</span>
          </div>
        )}

        {/* Google Sign-in Section */}
        {mode !== 'forgot' && (
          <div className="mb-5 space-y-3">
            {/* Universal Google Sign-in button */}
            {!showCustomGoogle ? (
              <button
                id="btn-google-auth"
                type="button"
                onClick={() => setShowCustomGoogle(true)}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 active:scale-[0.99] text-zinc-900 font-bold text-xs sm:text-sm transition shadow border border-white/20 disabled:opacity-60 cursor-pointer"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>כניסה מהירה עם Google</span>
              </button>
            ) : (
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>כניסה עם חשבון Google:</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogle(false)}
                    className="text-zinc-400 hover:text-white text-[11px]"
                  >
                    ביטול
                  </button>
                </div>
                <input
                  type="email"
                  placeholder="האימייל שלך (למשל name@gmail.com)"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="שם לתצוגה (אופציונלי)"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!customGoogleEmail) return;
                    handleGoogleSignIn({
                      email: customGoogleEmail,
                      displayName: customGoogleName || customGoogleEmail.split('@')[0],
                      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        customGoogleName || customGoogleEmail
                      )}&background=2563eb&color=fff&size=256&bold=true`,
                    });
                  }}
                  disabled={!customGoogleEmail || googleLoading}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs transition disabled:opacity-50"
                >
                  {googleLoading ? 'מתחבר...' : 'התחבר עכשיו'}
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                או באמצעות אימייל וסיסמה
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {t('usernameOrEmail')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-zinc-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="user@example.com / username"
                    className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2.5 ps-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-300">{t('password')}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2.5 ps-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {t('displayName')}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="יוסי כהן / Alex Smith"
                  className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {t('username')} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-zinc-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="alexsmith"
                    className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2.5 ps-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {t('email')} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2.5 ps-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {t('password')} (6+ {t('tracksCount') ? 'תווים' : 'chars'}) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2.5 ps-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {t('email')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {t('newPassword')}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#181a22] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] font-medium text-sm text-white transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? '...' : mode === 'login' ? t('login') : mode === 'register' ? t('register') : t('resetPassword')}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-zinc-400">
          {mode === 'login' ? (
            <p>
              {t('needAccount')}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-blue-400 hover:underline font-semibold"
              >
                {t('register')}
              </button>
            </p>
          ) : (
            <p>
              {t('alreadyHaveAccount')}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-blue-400 hover:underline font-semibold"
              >
                {t('login')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
