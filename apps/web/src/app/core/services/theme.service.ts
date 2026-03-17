import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'backlogger-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  
  theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Apply theme changes to DOM
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const theme = this.theme();
        const root = document.documentElement;
        
        if (theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        
        localStorage.setItem(THEME_KEY, theme);
      }
    });
  }

  private getInitialTheme(): Theme {
    if (isPlatformBrowser(this.platformId)) {
      // Check localStorage first
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      
      // Fall back to system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  }

  toggle() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
  }
}

