import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'notesforall_theme';
  readonly currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Apply theme on start and whenever signal changes
    effect(() => {
      const isDark = this.currentTheme() === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('light', !isDark);
      localStorage.setItem(this.THEME_KEY, this.currentTheme());
    });
  }

  toggleTheme(): void {
    this.currentTheme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  private getInitialTheme(): Theme {
    const saved = localStorage.getItem(this.THEME_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Default to dark mode matching macmdviewer's dark aesthetic
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }
}
