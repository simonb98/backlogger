import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService, AuthService } from './core/services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      @if (authService.isAuthenticated()) {
        <header class="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
          <a routerLink="/" class="text-2xl font-bold text-gray-900 dark:text-white no-underline">🎮 Backlogger</a>
          <nav class="flex gap-2 items-center">
            <a routerLink="/library" routerLinkActive="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
               class="px-4 py-2 rounded-lg font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors no-underline">
              Library
            </a>
            <a routerLink="/discover" routerLinkActive="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
               class="px-4 py-2 rounded-lg font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors no-underline">
              🎲 Play
            </a>
            <a routerLink="/search" routerLinkActive="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
               class="px-4 py-2 rounded-lg font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors no-underline">
              Search
            </a>
            <a routerLink="/import" routerLinkActive="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
               class="px-4 py-2 rounded-lg font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors no-underline">
              Import
            </a>

            <span class="text-gray-300 dark:text-gray-600 mx-1">|</span>

            <button
              (click)="themeService.toggle()"
              class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              [title]="themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
              {{ themeService.theme() === 'dark' ? '☀️' : '🌙' }}
            </button>

            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ authService.user()?.displayName || authService.user()?.email }}
            </span>

            <button
              (click)="authService.logout()"
              class="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Logout
            </button>
          </nav>
        </header>
      }
      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class App {
  themeService = inject(ThemeService);
  authService = inject(AuthService);
}
