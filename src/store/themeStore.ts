import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

class ThemeStore {
  private theme: Theme;
  private listeners: Set<(theme: Theme) => void> = new Set();

  constructor() {
    const stored = localStorage.getItem('cp_theme') as Theme | null;
    this.theme = stored === 'light' ? 'light' : 'dark';
    this.apply(this.theme);
  }

  get(): Theme {
    return this.theme;
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('cp_theme', this.theme);
    this.apply(this.theme);
    this.notify();
  }

  private apply(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.listeners.forEach(l => l(this.theme));
  }
}

export const themeStore = new ThemeStore();

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(themeStore.get());

  useEffect(() => {
    return themeStore.subscribe(setTheme);
  }, []);

  return { theme, toggleTheme: () => themeStore.toggle() };
}
