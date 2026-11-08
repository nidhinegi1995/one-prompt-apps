import { useEffect, useState } from 'react';

export const THEME_KEY = 'kanban-theme';
const THEMES = ['system', 'light', 'dark'];

/** 'system' follows the OS setting; 'light' / 'dark' are set as data-theme on <html>. */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (THEMES.includes(saved)) return saved;
    } catch {
      // Storage unavailable: use the system theme.
    }
    return 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore: the choice just won't be remembered.
    }
  }, [theme]);

  const cycleTheme = () => setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);

  return { theme, cycleTheme };
}
