import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  computed,
  signal,
  inject,
  HostListener,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Game,
  GAME_STATUS_COLORS,
  GAME_STATUS_LABELS,
  GameStatus,
  injectBulkUpdateGamesMutation,
  injectGamesQuery,
  UserGame,
} from '../../libs/client-games-api';
import { injectPlatforms, Platform } from '../../libs/client-platforms-api';

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
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto p-6">
      <header class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">My Library</h1>
        <div class="flex gap-2">
          @if (!selectMode()) {
            <button
              (click)="selectMode.set(true)"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Select
            </button>
          } @else {
            <button
              (click)="selectAll()"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Select All
            </button>
            <button
              (click)="exitSelectMode()"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          }
          <a
            routerLink="/import"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors no-underline"
          >
            Import
          </a>
          <a
            routerLink="/search"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors no-underline"
          >
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
          <select
            [ngModel]="sortBy()"
            (ngModelChange)="sortBy.set($event); resetDisplayCount()"
            class="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="date_added">Date Added</option>
            <option value="name">Name</option>
            <option value="rating">Rating</option>
            <option value="playtime">Playtime</option>
            <option value="release_date">Release Date</option>
          </select>
          <button
            (click)="toggleSortOrder()"
            class="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            [title]="sortOrder() === 'asc' ? 'Ascending' : 'Descending'"
          >
            {{ sortOrder() === 'asc' ? '↑' : '↓' }}
          </button>
        </div>

        <!-- Status + Platform Filters -->
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-sm text-gray-500 mr-2">Status:</span>
          <button
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            [class]="
              selectedStatus() === null ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            "
            (click)="setStatus(null)"
          >
            All
          </button>
          @for (status of statuses; track status) {
            <button
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              [class]="selectedStatus() === status ? 'text-white' : 'bg-gray-100 hover:bg-gray-200'"
              [style.backgroundColor]="selectedStatus() === status ? getStatusColor(status) : ''"
              (click)="setStatus(status)"
            >
              {{ statusLabels[status] }}
            </button>
          }

          <span class="text-gray-300 mx-2">|</span>

          <span class="text-sm text-gray-500 mr-2">Platform:</span>
          <select
            [ngModel]="selectedPlatform()"
            (ngModelChange)="selectedPlatform.set($event); resetDisplayCount()"
            class="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none"
          >
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

      <!-- Bulk Edit Bar -->
      @if (selectedIds().size > 0) {
        <div
          class="bg-blue-600 text-white py-3 px-6 rounded-xl shadow-sm mb-4 flex items-center justify-between"
        >
          <div class="flex items-center gap-4">
            <button
              (click)="clearSelection()"
              class="w-8 h-8 flex items-center justify-center bg-blue-700 hover:bg-blue-800 rounded"
            >
              ✕
            </button>
            <span class="font-medium">{{ selectedIds().size }} game(s) selected</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-blue-200 mr-2">Set status:</span>
            @for (status of statuses; track status) {
              <button
                (click)="bulkSetStatus(status)"
                class="px-3 py-1.5 rounded text-sm font-medium transition-colors hover:opacity-90"
                [style.backgroundColor]="statusColors[status]"
              >
                {{ statusLabels[status] }}
              </button>
            }
          </div>
        </div>
      }

      <!-- Results count -->
      @if (!loading() && groupedGames().length > 0) {
        <p class="text-sm text-gray-500 mb-4">
          Showing {{ groupedGames().length }} of {{ totalGames() }} games
        </p>
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
          <a
            routerLink="/search"
            class="inline-block px-8 py-3 bg-blue-500 text-white rounded-lg font-medium no-underline hover:bg-blue-600"
          >
            Search Games
          </a>
        </div>
      }

      @if (!loading() && groupedGames().length === 0 && hasActiveFilters()) {
        <div class="text-center py-12 text-gray-500">
          No games match your filters.
          <button (click)="clearFilters()" class="text-blue-500 hover:underline ml-1">
            Clear filters
          </button>
        </div>
      }

      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        [class.select-none]="selectMode()"
      >
        @for (grouped of groupedGames(); track grouped.game.id; let idx = $index) {
          <div
            class="relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            [class.ring-2]="isSelected(grouped.entries[0].id)"
            [class.ring-blue-500]="isSelected(grouped.entries[0].id)"
            [class.cursor-pointer]="selectMode()"
            (click)="selectMode() ? handleSelect($event, grouped.entries[0].id, idx) : null"
          >
            @if (selectMode()) {
              <div class="absolute top-2 left-2 z-10">
                <div
                  class="w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer"
                  [class]="
                    isSelected(grouped.entries[0].id)
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300'
                  "
                >
                  @if (isSelected(grouped.entries[0].id)) {
                    <span class="text-sm">✓</span>
                  }
                </div>
              </div>
            }

            <a
              [routerLink]="selectMode() ? null : ['/games', grouped.entries[0].id]"
              [class.pointer-events-none]="selectMode()"
              class="block no-underline text-inherit"
            >
              <div class="relative aspect-[3/4] bg-gray-100">
                @if (grouped.game.coverUrl) {
                  <img
                    [src]="grouped.game.coverUrl"
                    [alt]="grouped.game.name"
                    class="w-full h-full object-cover"
                  />
                } @else {
                  <div class="flex items-center justify-center h-full text-gray-400 text-sm">
                    No Image
                  </div>
                }
                @if (grouped.isFullyCompleted) {
                  <span class="absolute top-2 right-2 text-2xl" title="100% Completed">🏆</span>
                } @else {
                  <span
                    class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold text-white uppercase"
                    [style.backgroundColor]="getStatusColor(grouped.primaryStatus)"
                  >
                    {{ statusLabels[grouped.primaryStatus] }}
                  </span>
                }
              </div>
              <div class="p-3">
                <h3 class="font-semibold text-sm line-clamp-2 mb-1">{{ grouped.game.name }}</h3>
                <div class="flex flex-wrap gap-1 mb-1">
                  @for (platform of grouped.platforms; track platform.id) {
                    <span
                      class="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-600"
                    >
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
          </div>
        }
      </div>

      <!-- Infinite scroll sentinel -->
      @if (hasMoreGames()) {
        <div #scrollSentinel class="py-8 text-center">
          <div class="text-gray-400">Loading more...</div>
        </div>
      }
    </div>

    <!-- Back to top button -->
    @if (showBackToTop()) {
      <button
        (click)="scrollToTop()"
        class="fixed bottom-6 right-6 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center text-xl z-50"
        title="Back to top"
      >
        ↑
      </button>
    }
  `,
})
export class LibraryContainer implements AfterViewInit, OnDestroy {
  private document = inject(DOCUMENT);

  @ViewChild('scrollSentinel') scrollSentinel?: ElementRef<HTMLDivElement>;
  private intersectionObserver?: IntersectionObserver;

  // Filters
  selectedStatus = signal<GameStatus | null>(null);
  selectedPlatform = signal<number | null>(null);
  searchQuery = signal('');
  sortBy = signal<SortField>('date_added');
  sortOrder = signal<SortOrder>('desc');

  // Infinite scroll - 5 rows * 6 columns = 30 games per page
  private readonly ITEMS_PER_PAGE = 30;
  displayedCount = signal(30);
  showBackToTop = signal(false);

  // Selection
  selectMode = signal(false);
  selectedIds = signal<Set<number>>(new Set());
  private lastSelectedIndex: number | null = null;

  // Use client libs
  platforms = injectPlatforms();

  // Fetch all games at once, display is controlled by displayedCount
  gamesQuery = injectGamesQuery(() => ({
    status: this.selectedStatus() ?? undefined,
    platform: this.selectedPlatform() ?? undefined,
    search: this.searchQuery() || undefined,
    sortBy: this.sortBy(),
    sortOrder: this.sortOrder(),
    limit: 0, // Fetch all
  }));

  bulkUpdateMutation = injectBulkUpdateGamesMutation({
    onSuccess: () => this.exitSelectMode(),
  });

  readonly statusLabels = GAME_STATUS_LABELS;
  readonly statusColors = GAME_STATUS_COLORS;
  readonly statuses: GameStatus[] = [
    'playing',
    'up_next',
    'backlog',
    'completed',
    'on_hold',
    'dropped',
    'wishlist',
  ];
  readonly statusPriority: GameStatus[] = [
    'playing',
    'up_next',
    'backlog',
    'on_hold',
    'wishlist',
    'completed',
    'dropped',
  ];

  Math = Math;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Computed values from query
  allGames = computed(() => this.gamesQuery.data()?.games || []);
  totalGames = computed(() => this.gamesQuery.data()?.total || 0);
  loading = computed(() => this.gamesQuery.isPending());
  error = computed(() => (this.gamesQuery.error() ? 'Failed to load games' : null));

  // Slice games for infinite scroll
  games = computed(() => this.allGames().slice(0, this.displayedCount()));
  hasMoreGames = computed(() => this.displayedCount() < this.allGames().length);

  @HostListener('window:scroll')
  onScroll() {
    const scrollTop = this.document.documentElement.scrollTop || this.document.body.scrollTop;
    this.showBackToTop.set(scrollTop > 400);
  }

  hasActiveFilters = computed(
    () =>
      this.selectedStatus() !== null ||
      this.selectedPlatform() !== null ||
      this.searchQuery().length > 0,
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
        if (
          userGame.rating &&
          (!existing.highestRating || userGame.rating > existing.highestRating)
        ) {
          existing.highestRating = userGame.rating;
        }
        if (userGame.platform) {
          existing.platforms.push(userGame.platform);
        }
        if (userGame.completionPercent === 100) {
          existing.isFullyCompleted = true;
        }
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

  // No constructor needed - platforms are loaded via TanStack Query automatically

  // Filter methods - just update signals, query auto-refetches
  setStatus(status: GameStatus | null) {
    this.selectedStatus.set(status);
    this.resetDisplayCount();
  }

  toggleSortOrder() {
    this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    this.resetDisplayCount();
  }

  debouncedSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.resetDisplayCount();
    }, 300);
  }

  clearFilters() {
    this.selectedStatus.set(null);
    this.selectedPlatform.set(null);
    this.searchQuery.set('');
    this.resetDisplayCount();
  }

  // Infinite scroll methods
  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    this.intersectionObserver?.disconnect();
  }

  private setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && this.hasMoreGames()) {
          this.loadMore();
        }
      },
      { rootMargin: '200px' } // Load 200px before reaching the sentinel
    );

    // Observe after a small delay to let the view render
    setTimeout(() => this.observeSentinel(), 100);
  }

  private observeSentinel() {
    // Disconnect previous observations
    this.intersectionObserver?.disconnect();

    // Re-observe if sentinel exists
    if (this.scrollSentinel?.nativeElement) {
      this.intersectionObserver?.observe(this.scrollSentinel.nativeElement);
    }
  }

  resetDisplayCount() {
    this.displayedCount.set(this.ITEMS_PER_PAGE);
    // Re-observe sentinel after reset
    setTimeout(() => this.observeSentinel(), 100);
  }

  private loadMore() {
    this.displayedCount.update(count => count + this.ITEMS_PER_PAGE);
    // Re-observe sentinel after loading more (element gets recreated)
    setTimeout(() => this.observeSentinel(), 50);
  }

  scrollToTop() {
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Selection methods
  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  handleSelect(event: MouseEvent, id: number, index: number) {
    event.preventDefault();
    const games = this.groupedGames();
    const current = new Set(this.selectedIds());

    if (event.shiftKey && this.lastSelectedIndex !== null) {
      const start = Math.min(this.lastSelectedIndex, index);
      const end = Math.max(this.lastSelectedIndex, index);
      for (let i = start; i <= end; i++) {
        current.add(games[i].entries[0].id);
      }
      this.selectedIds.set(current);
    } else {
      if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }
      this.selectedIds.set(current);
      this.lastSelectedIndex = index;
    }
  }

  selectAll() {
    const allIds = this.groupedGames().map((g) => g.entries[0].id);
    this.selectedIds.set(new Set(allIds));
  }

  clearSelection() {
    this.selectedIds.set(new Set());
    this.lastSelectedIndex = null;
  }

  exitSelectMode() {
    this.selectMode.set(false);
    this.clearSelection();
  }

  bulkSetStatus(status: GameStatus) {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;
    this.bulkUpdateMutation.mutate({ ids, updates: { status } });
  }
}
