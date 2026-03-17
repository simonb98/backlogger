import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GamesService, PlatformsService } from '../../core/services';
import { UserGame, GameStatus, Game, Platform, GAME_STATUS_LABELS, GAME_STATUS_COLORS, GameFilterParams } from '../../core/models';

type SortField = 'name' | 'date_added' | 'rating' | 'playtime' | 'release_date';
type SortOrder = 'asc' | 'desc';

interface GroupedGame {
  game: Game;
  entries: UserGame[];
  totalPlaytimeMins: number;
  highestRating: number | null;
  primaryStatus: GameStatus;
  platforms: Platform[];
  isFullyCompleted: boolean;
}

@Component({
  selector: 'app-library-container',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto p-6">
      <header class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">My Library</h1>
        <div class="flex gap-2">
          <a routerLink="/import" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors no-underline">
            Import
          </a>
          <a routerLink="/search" class="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors no-underline">
            + Add
          </a>
        </div>
      </header>

      <!-- Filters Bar -->
      <div class="bg-white p-4 rounded-xl shadow-sm mb-6 space-y-4">
        <!-- Search -->
        <div class="flex gap-4">
          <input
            type="text"
            placeholder="Search games..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event); debouncedSearch()"
            class="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <!-- Sort -->
          <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event); loadGames()"
                  class="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500">
            <option value="date_added">Date Added</option>
            <option value="name">Name</option>
            <option value="rating">Rating</option>
            <option value="playtime">Playtime</option>
            <option value="release_date">Release Date</option>
          </select>
          <button (click)="toggleSortOrder()"
                  class="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  [title]="sortOrder() === 'asc' ? 'Ascending' : 'Descending'">
            {{ sortOrder() === 'asc' ? '↑' : '↓' }}
          </button>
        </div>

        <!-- Status + Platform Filters -->
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-sm text-gray-500 mr-2">Status:</span>
          <button
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            [class]="selectedStatus() === null ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'"
            (click)="setStatus(null)">
            All
          </button>
          @for (status of statuses; track status) {
            <button
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              [class]="selectedStatus() === status ? 'text-white' : 'bg-gray-100 hover:bg-gray-200'"
              [style.backgroundColor]="selectedStatus() === status ? getStatusColor(status) : ''"
              (click)="setStatus(status)">
              {{ statusLabels[status] }}
            </button>
          }

          <span class="text-gray-300 mx-2">|</span>

          <span class="text-sm text-gray-500 mr-2">Platform:</span>
          <select [ngModel]="selectedPlatform()" (ngModelChange)="selectedPlatform.set($event); loadGames()"
                  class="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none">
            <option [ngValue]="null">All Platforms</option>
            @for (platform of platforms(); track platform.id) {
              <option [ngValue]="platform.id">{{ platform.name }}</option>
            }
          </select>

          @if (hasActiveFilters()) {
            <button (click)="clearFilters()" class="ml-2 text-sm text-blue-500 hover:underline">
              Clear filters
            </button>
          }
        </div>
      </div>

      <!-- Results count -->
      @if (!loading() && groupedGames().length > 0) {
        <p class="text-sm text-gray-500 mb-4">{{ groupedGames().length }} games</p>
      }

      @if (loading()) {
        <div class="text-center py-12 text-gray-500">Loading your games...</div>
      }

      @if (error()) {
        <div class="text-center py-8 px-4 bg-red-50 text-red-600 rounded-lg">{{ error() }}</div>
      }

      @if (!loading() && groupedGames().length === 0 && !hasActiveFilters()) {
        <div class="text-center py-16 bg-gray-100 rounded-xl">
          <h2 class="text-xl font-semibold mb-2">No games yet!</h2>
          <p class="text-gray-500 mb-6">Search for games or import from Steam.</p>
          <a routerLink="/search" class="inline-block px-8 py-3 bg-blue-500 text-white rounded-lg font-medium no-underline hover:bg-blue-600">
            Search Games
          </a>
        </div>
      }

      @if (!loading() && groupedGames().length === 0 && hasActiveFilters()) {
        <div class="text-center py-12 text-gray-500">
          No games match your filters.
          <button (click)="clearFilters()" class="text-blue-500 hover:underline ml-1">Clear filters</button>
        </div>
      }

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        @for (grouped of groupedGames(); track grouped.game.id) {
          <a [routerLink]="['/games', grouped.entries[0].id]"
             class="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all no-underline text-inherit">
            <div class="relative aspect-[3/4] bg-gray-100">
              @if (grouped.game.coverUrl) {
                <img [src]="grouped.game.coverUrl" [alt]="grouped.game.name" class="w-full h-full object-cover" />
              } @else {
                <div class="flex items-center justify-center h-full text-gray-400 text-sm">No Image</div>
              }
              @if (grouped.isFullyCompleted) {
                <span class="absolute top-2 right-2 text-2xl" title="100% Completed">🏆</span>
              } @else {
                <span class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold text-white uppercase"
                      [style.backgroundColor]="getStatusColor(grouped.primaryStatus)">
                  {{ statusLabels[grouped.primaryStatus] }}
                </span>
              }
            </div>
            <div class="p-3">
              <h3 class="font-semibold text-sm line-clamp-2 mb-1">{{ grouped.game.name }}</h3>
              <div class="flex flex-wrap gap-1 mb-1">
                @for (platform of grouped.platforms; track platform.id) {
                  <span class="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-600">
                    {{ platform.abbreviation }}
                  </span>
                }
              </div>
              <div class="flex gap-2 text-xs text-gray-500">
                @if (grouped.highestRating) {
                  <span>⭐ {{ grouped.highestRating }}</span>
                }
                @if (grouped.totalPlaytimeMins > 0) {
                  <span>🕐 {{ formatPlaytime(grouped.totalPlaytimeMins) }}</span>
                }
              </div>
            </div>
          </a>
        }
      </div>
    </div>
  `,
})
export class LibraryContainer implements OnInit {
  private gamesService = inject(GamesService);
  private platformsService = inject(PlatformsService);

  games = signal<UserGame[]>([]);
  totalGames = signal(0);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filters
  selectedStatus = signal<GameStatus | null>(null);
  selectedPlatform = signal<number | null>(null);
  searchQuery = signal('');
  sortBy = signal<SortField>('date_added');
  sortOrder = signal<SortOrder>('desc');

  platforms = this.platformsService.platforms;

  readonly statusLabels = GAME_STATUS_LABELS;
  readonly statusColors = GAME_STATUS_COLORS;
  readonly statuses: GameStatus[] = ['playing', 'up_next', 'backlog', 'completed', 'on_hold', 'dropped', 'wishlist'];
  readonly statusPriority: GameStatus[] = ['playing', 'up_next', 'backlog', 'on_hold', 'wishlist', 'completed', 'dropped'];

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  hasActiveFilters = computed(() =>
    this.selectedStatus() !== null ||
    this.selectedPlatform() !== null ||
    this.searchQuery().length > 0
  );

  groupedGames = computed(() => {
    const games = this.games();
    const groups = new Map<number, GroupedGame>();

    for (const userGame of games) {
      if (!userGame.game) continue;

      const gameId = userGame.game.id;
      const existing = groups.get(gameId);

      if (existing) {
        existing.entries.push(userGame);
        existing.totalPlaytimeMins += userGame.totalPlaytimeMins;
        if (userGame.rating && (!existing.highestRating || userGame.rating > existing.highestRating)) {
          existing.highestRating = userGame.rating;
        }
        if (userGame.platform) {
          existing.platforms.push(userGame.platform);
        }
        if (userGame.completionPercent === 100) {
          existing.isFullyCompleted = true;
        }
        // Update primary status based on priority
        const currentPriority = this.statusPriority.indexOf(existing.primaryStatus);
        const newPriority = this.statusPriority.indexOf(userGame.status);
        if (newPriority < currentPriority) {
          existing.primaryStatus = userGame.status;
        }
      } else {
        groups.set(gameId, {
          game: userGame.game,
          entries: [userGame],
          totalPlaytimeMins: userGame.totalPlaytimeMins,
          highestRating: userGame.rating ?? null,
          primaryStatus: userGame.status,
          platforms: userGame.platform ? [userGame.platform] : [],
          isFullyCompleted: userGame.completionPercent === 100,
        });
      }
    }

    return Array.from(groups.values());
  });

  ngOnInit() {
    this.platformsService.loadPlatforms();
    this.loadGames();
  }

  loadGames() {
    this.loading.set(true);
    this.error.set(null);

    const filters: GameFilterParams = {
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
      limit: 100,
    };

    if (this.selectedStatus()) filters.status = this.selectedStatus()!;
    if (this.selectedPlatform()) filters.platform = this.selectedPlatform()!;
    if (this.searchQuery()) filters.search = this.searchQuery();

    this.gamesService.getGames(filters).subscribe({
      next: (response) => {
        this.games.set(response.data || []);
        this.totalGames.set(response.meta?.total || response.data?.length || 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load games');
        this.loading.set(false);
      },
    });
  }

  setStatus(status: GameStatus | null) {
    this.selectedStatus.set(status);
    this.loadGames();
  }

  toggleSortOrder() {
    this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    this.loadGames();
  }

  debouncedSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadGames(), 300);
  }

  clearFilters() {
    this.selectedStatus.set(null);
    this.selectedPlatform.set(null);
    this.searchQuery.set('');
    this.loadGames();
  }

  formatPlaytime(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }

  getStatusColor(status: GameStatus): string {
    return this.statusColors[status];
  }
}

