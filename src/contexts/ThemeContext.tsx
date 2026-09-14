import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeId = 'aurora' | 'sunset' | 'ocean' | 'forest' | 'rose' | 'custom';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  background: string;
  surface: string;
  surfaceStrong: string;
  accent: string;
  accentSoft: string;
  glow: string;
  preview: string[];
}

export const themes: ThemeDefinition[] = [
  { id: 'aurora', name: 'Aurora', description: 'כחול חשמלי עם זוהר סגול', background: '#090b14', surface: '#111526', surfaceStrong: '#181d32', accent: '#6d8cff', accentSoft: '#3f58c9', glow: '#8a5cff', preview: ['#6d8cff', '#8a5cff', '#10152a'] },
  { id: 'sunset', name: 'Sunset', description: 'כתום ורוד כמו שקיעה', background: '#160d12', surface: '#24141d', surfaceStrong: '#321a25', accent: '#ff7b6b', accentSoft: '#d74661', glow: '#ffb35c', preview: ['#ff7b6b', '#ffb35c', '#26121d'] },
  { id: 'ocean', name: 'Ocean', description: 'טורקיז עמוק ורגוע', background: '#071318', surface: '#0d2027', surfaceStrong: '#12313a', accent: '#2dd4bf', accentSoft: '#159d9c', glow: '#38bdf8', preview: ['#2dd4bf', '#38bdf8', '#0a2229'] },
  { id: 'forest', name: 'Forest', description: 'ירוק חי עם נגיעות זהב', background: '#0c130f', surface: '#142019', surfaceStrong: '#1c2b20', accent: '#9be15d', accentSoft: '#4f9d55', glow: '#f5c45e', preview: ['#9be15d', '#f5c45e', '#132319'] },
  { id: 'rose', name: 'Rose', description: 'ורוד עמוק ואלגנטי', background: '#160c18', surface: '#241323', surfaceStrong: '#321a31', accent: '#f08bd8', accentSoft: '#b54eaa', glow: '#ff9fba', preview: ['#f08bd8', '#ff9fba', '#29152b'] },
  { id: 'custom', name: 'Custom', description: 'הצבע שלך, החוקים שלך', background: '#0f1015', surface: '#181a24', surfaceStrong: '#222534', accent: '#f5b942', accentSoft: '#b87a1a', glow: '#ffdf80', preview: ['#f5b942', '#ffdf80', '#171923'] },
];

interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeDefinition;
  customAccent: string;
  customColors: Pick<ThemeDefinition, 'background' | 'surface' | 'surfaceStrong' | 'accent' | 'glow'>;
  confettiEnabled: boolean;
  setThemeId: (id: ThemeId) => void;
  setCustomAccent: (color: string) => void;
  setCustomColor: (key: keyof ThemeContextValue['customColors'], color: string) => void;
  setConfettiEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(() => (localStorage.getItem('simply_music_theme') as ThemeId) || 'aurora');
  const [customAccent, setCustomAccent] = useState(() => localStorage.getItem('simply_music_custom_accent') || '#f5b942');
  const [customColors, setCustomColors] = useState<Pick<ThemeDefinition, 'background' | 'surface' | 'surfaceStrong' | 'accent' | 'glow'>>(() => {
    try {
      return { ...themes.find((item) => item.id === 'custom')!, ...JSON.parse(localStorage.getItem('simply_music_custom_colors') || '{}') };
    } catch {
      return themes.find((item) => item.id === 'custom')!;
    }
  });
  const [confettiEnabled, setConfettiEnabled] = useState(() => localStorage.getItem('simply_music_confetti') !== 'false');

  const baseTheme = themes.find((item) => item.id === themeId) || themes[0];
  const theme = useMemo(() => themeId === 'custom'
    ? { ...baseTheme, ...customColors, accentSoft: customColors.accent, preview: [customColors.accent, customColors.glow, customColors.surface] }
    : baseTheme, [baseTheme, customColors, themeId]);

  const setCustomColor = (key: keyof typeof customColors, color: string) => {
    setCustomColors((current) => ({ ...current, [key]: color }));
    if (key === 'accent') setCustomAccent(color);
  };

  useEffect(() => {
    localStorage.setItem('simply_music_theme', themeId);
    localStorage.setItem('simply_music_custom_accent', customAccent);
    localStorage.setItem('simply_music_custom_colors', JSON.stringify(customColors));
    localStorage.setItem('simply_music_confetti', String(confettiEnabled));
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    root.style.setProperty('--app-background', theme.background);
    root.style.setProperty('--app-surface', theme.surface);
    root.style.setProperty('--app-surface-strong', theme.surfaceStrong);
    root.style.setProperty('--app-accent', theme.accent);
    root.style.setProperty('--app-accent-soft', theme.accentSoft);
    root.style.setProperty('--app-glow', theme.glow);
  }, [theme, themeId, customAccent, customColors, confettiEnabled]);

  const value = useMemo(() => ({ themeId, theme, customAccent, customColors, confettiEnabled, setThemeId, setCustomAccent, setCustomColor, setConfettiEnabled }), [themeId, theme, customAccent, customColors, confettiEnabled]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
};