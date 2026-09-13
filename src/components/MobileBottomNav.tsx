import React from 'react';
import { Home, Search, Library, ArrowDownToLine, Settings } from 'lucide-react';
import { ActiveTab, ActiveView } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface MobileBottomNavProps {
  activeView: ActiveView;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeView, onNavigateTab }) => {
  const { t } = useLanguage();

  const isCurrentTab = (tab: ActiveTab) => activeView.type === 'tab' && activeView.tab === tab;

  return (
    <nav
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 start-0 end-0 z-40 bg-[#0d0e14]/95 backdrop-blur-xl border-t border-white/5 px-3 py-2 pb-safe"
    >
      <div className="flex items-center justify-around">
        <button
          id="mobile-nav-home"
          onClick={() => onNavigateTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            isCurrentTab('home') ? 'text-blue-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('navHome')}</span>
        </button>

        <button
          id="mobile-nav-search"
          onClick={() => onNavigateTab('search')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            isCurrentTab('search') ? 'text-blue-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('navSearch')}</span>
        </button>

        <button
          id="mobile-nav-library"
          onClick={() => onNavigateTab('library')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            isCurrentTab('library') ? 'text-blue-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('navLibrary')}</span>
        </button>

        <button
          id="mobile-nav-downloads"
          onClick={() => onNavigateTab('downloads')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            isCurrentTab('downloads') ? 'text-blue-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ArrowDownToLine className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('navDownloads')}</span>
        </button>

        <button
          id="mobile-nav-settings"
          onClick={() => onNavigateTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            isCurrentTab('settings') ? 'text-blue-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('navSettings')}</span>
        </button>
      </div>
    </nav>
  );
};
