import React from 'react';
import { Globe, User as UserIcon, LogIn, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ActiveTab, ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAuthModal: () => void;
  onOpenApkModal?: (tab?: 'windows' | 'website' | 'android' | 'ios') => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigateTab,
  onOpenAuthModal,
  onOpenApkModal,
  canGoBack = false,
  onGoBack,
}) => {
  const { language, setLanguage, direction, t } = useLanguage();
  const { user } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === 'he' ? 'en' : 'he');
  };

  return (
    <header
      id="top-application-header"
      className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200"
    >
      {/* Back / Navigation Controls */}
      <div className="flex items-center gap-2">
        {canGoBack && onGoBack && (
          <button
            onClick={onGoBack}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
            aria-label="Back"
          >
            {direction === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center gap-2 md:hidden">
          <img src="/logo.png" alt="פשוט מוזיקה" className="w-7 h-7 object-contain" />
          <span className="font-bold text-sm tracking-tight text-slate-900">
            {t('appName')}
          </span>
        </div>
      </div>

      {/* Right Controls (Language, User Profile) */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Language Switcher */}
        <button
          id="btn-switch-language"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 transition"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-zinc-400" />
          <span>{language === 'he' ? 'English' : 'עברית'}</span>
        </button>

        {/* User Account / Profile */}
        {user ? (
          <button
            id="btn-user-profile-header"
            onClick={() => onNavigateTab('settings')}
            className="flex items-center gap-2.5 ps-1 pe-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition"
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user.displayName}
              className="w-7 h-7 rounded-full object-cover bg-zinc-800"
            />
            <span className="text-xs font-medium text-zinc-200 hidden sm:inline max-w-[100px] truncate">
              {user.displayName || user.username}
            </span>
            {user.role === 'admin' && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ADMIN
              </span>
            )}
          </button>
        ) : (
          <button
            id="btn-header-login"
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t('login')}</span>
          </button>
        )}
      </div>
    </header>
  );
};
