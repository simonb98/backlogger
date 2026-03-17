import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <header class="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-50">
        <a routerLink="/" class="text-2xl font-bold text-gray-900 no-underline">🎮 Backlogger</a>
        <nav class="flex gap-2">
          <a routerLink="/library" routerLinkActive="bg-blue-50 text-blue-600"
             class="px-4 py-2 rounded-lg font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors no-underline">
            Library
          </a>
          <a routerLink="/discover" routerLinkActive="bg-blue-50 text-blue-600"
             class="px-4 py-2 rounded-lg font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors no-underline">
            🎲 Play
          </a>
          <a routerLink="/search" routerLinkActive="bg-blue-50 text-blue-600"
             class="px-4 py-2 rounded-lg font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors no-underline">
            Search
          </a>
          <a routerLink="/import" routerLinkActive="bg-blue-50 text-blue-600"
             class="px-4 py-2 rounded-lg font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors no-underline">
            Import
          </a>
        </nav>
      </header>
      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class App {}
