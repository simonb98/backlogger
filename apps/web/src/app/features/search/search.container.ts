import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { IgdbService, PlatformsService, GamesService } from '../../core/services';
import { IgdbSearchResult } from '../../core/models';

@Component({
  selector: 'app-search-container',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto p-6">
      <header class="text-center mb-8">
        <h1 class="text-3xl font-bold mb-2">Search Games</h1>
        <p class="text-gray-500">Find games to add to your library</p>
      </header>

      <div class="flex items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Search for a game..."
          [value]="searchQuery()"
          (input)="onSearchInput($event)"
          class="flex-1 px-6 py-4 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          autofocus
        />
        @if (loading()) {
          <span class="text-gray-500 text-sm">Searching...</span>
        }
      </div>

      @if (error()) {
        <div class="p-4 bg-red-50 text-red-600 rounded-lg mb-4">{{ error() }}</div>
      }

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        @for (game of results(); track game.id) {
          <div class="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
            <div class="aspect-[3/4] bg-gray-100">
              @if (game.coverUrl) {
                <img [src]="game.coverUrl" [alt]="game.name" class="w-full h-full object-cover" />
              } @else {
                <div class="flex items-center justify-center h-full text-gray-400 text-sm">No Image</div>
              }
            </div>
            <div class="p-4">
              <h3 class="font-semibold line-clamp-2 mb-1">{{ game.name }}</h3>
              @if (game.releaseYear) {
                <span class="text-sm text-gray-500">{{ game.releaseYear }}</span>
              }
              @if (game.platforms?.length) {
                <div class="text-xs text-gray-400 mt-1">{{ getPlatformNames(game) }}</div>
              }
              @if (game.rating) {
                <div class="text-sm mt-2">⭐ {{ game.rating | number:'1.0-0' }}</div>
              }
            </div>
            <div class="flex">
              <button
                class="flex-1 py-3 bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                (click)="openAddDialog(game, 'backlog')">
                + Library
              </button>
              <button
                class="flex-1 py-3 bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors border-l border-purple-400"
                (click)="openAddDialog(game, 'wishlist')">
                ♡ Wishlist
              </button>
            </div>
          </div>
        }
      </div>

      @if (searchQuery().length >= 2 && !loading() && results().length === 0) {
        <div class="text-center py-12 text-gray-500">No games found for "{{ searchQuery() }}"</div>
      }
    </div>

    <!-- Add to Library/Wishlist Dialog -->
    @if (selectedGame()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closeAddDialog()">
        <div class="bg-white p-8 rounded-xl w-full max-w-md mx-4" (click)="$event.stopPropagation()">
          <h2 class="text-xl font-bold mb-4">{{ addStatus() === 'wishlist' ? 'Add to Wishlist' : 'Add to Library' }}</h2>
          <p class="mb-4">Adding: <strong>{{ selectedGame()!.name }}</strong></p>

          <label for="platform-select" class="block font-medium mb-2">Select Platform:</label>
          <select
            id="platform-select"
            [value]="selectedPlatformId() ?? ''"
            (change)="selectedPlatformId.set(+$any($event.target).value)"
            class="w-full p-3 border-2 border-gray-200 rounded-lg mb-6">
            <option value="" disabled>Choose a platform...</option>
            @for (platform of availablePlatforms(); track platform.id) {
              <option [value]="platform.id">{{ platform.name }}</option>
            }
          </select>

          <div class="flex gap-4">
            <button class="flex-1 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200" (click)="closeAddDialog()">
              Cancel
            </button>
            <button
              class="flex-1 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              [class.bg-blue-500]="addStatus() === 'backlog'"
              [class.hover:bg-blue-600]="addStatus() === 'backlog'"
              [class.bg-purple-500]="addStatus() === 'wishlist'"
              [class.hover:bg-purple-600]="addStatus() === 'wishlist'"
              [disabled]="!selectedPlatformId() || adding()"
              (click)="addGame()">
              {{ adding() ? 'Adding...' : (addStatus() === 'wishlist' ? 'Add to Wishlist' : 'Add to Library') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class SearchContainer implements OnInit {
  private igdbService = inject(IgdbService);
  private platformsService = inject(PlatformsService);
  private gamesService = inject(GamesService);
  private router = inject(Router);

  searchQuery = signal('');
  results = signal<IgdbSearchResult[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  selectedGame = signal<IgdbSearchResult | null>(null);
  selectedPlatformId = signal<number | null>(null);
  addStatus = signal<'backlog' | 'wishlist'>('backlog');
  adding = signal(false);

  platforms = this.platformsService.platforms;

  // Filter platforms to only show ones available for the selected game
  availablePlatforms = computed(() => {
    const game = this.selectedGame();
    const allPlatforms = this.platforms();
    if (!game?.platforms?.length) return allPlatforms;

    const gamePlatformIds = new Set(game.platforms.map(p => p.id));
    return allPlatforms.filter(p => p.igdbId && gamePlatformIds.has(p.igdbId));
  });

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.platformsService.loadPlatforms();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => {
        if (query.length < 2) return of([]);
        this.loading.set(true);
        this.error.set(null);
        return this.igdbService.search(query);
      })
    ).subscribe({
      next: (results) => {
        this.results.set(results);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to search games. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onSearchInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  getPlatformNames(game: IgdbSearchResult): string {
    return game.platforms?.map(p => p.abbreviation || p.name).join(', ') || '';
  }

  openAddDialog(game: IgdbSearchResult, status: 'backlog' | 'wishlist') {
    // Check if game has only one platform that we support
    const allPlatforms = this.platforms();
    const gamePlatformIds = new Set(game.platforms?.map(p => p.id) || []);
    const matchingPlatforms = allPlatforms.filter(p => p.igdbId && gamePlatformIds.has(p.igdbId));

    if (matchingPlatforms.length === 1) {
      // Auto-add with the single platform
      this.addGameDirectly(game, matchingPlatforms[0].id, status);
    } else {
      // Show dialog to select platform
      this.selectedGame.set(game);
      this.selectedPlatformId.set(null);
      this.addStatus.set(status);
    }
  }

  closeAddDialog() {
    this.selectedGame.set(null);
    this.selectedPlatformId.set(null);
  }

  private addGameDirectly(game: IgdbSearchResult, platformId: number, status: 'backlog' | 'wishlist') {
    this.adding.set(true);
    this.gamesService.addGame({ igdbId: game.id, platformId, status }).subscribe({
      next: () => {
        this.adding.set(false);
        this.router.navigate(['/library']);
      },
      error: (err) => {
        this.adding.set(false);
        alert(err.error?.error?.message || 'Failed to add game');
      }
    });
  }

  addGame() {
    const game = this.selectedGame();
    const platformId = this.selectedPlatformId();
    const status = this.addStatus();
    if (!game || !platformId) return;

    this.adding.set(true);
    this.gamesService.addGame({ igdbId: game.id, platformId, status }).subscribe({
      next: () => {
        this.adding.set(false);
        this.closeAddDialog();
        this.router.navigate(['/library']);
      },
      error: (err) => {
        this.adding.set(false);
        alert(err.error?.error?.message || 'Failed to add game');
      }
    });
  }
}

