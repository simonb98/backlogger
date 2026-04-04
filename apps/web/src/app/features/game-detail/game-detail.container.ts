import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  GAME_STATUS_COLORS,
  GAME_STATUS_LABELS,
  GameStatus,
  injectAddGameMutation,
  injectDeleteGameMutation,
  injectGameQuery,
  injectUpdateGameMutation,
} from '../../libs/client-games-api';
import { injectPlatforms } from '../../libs/client-platforms-api';
import { injectSyncDatesMutation } from '../../libs/client-steam-api';
import { ScreenshotCarouselComponent, StarRatingComponent, AchievementsComponent } from '../../shared/components';

@Component({
  selector: 'app-game-detail-container',
  imports: [CommonModule, FormsModule, StarRatingComponent, ScreenshotCarouselComponent, AchievementsComponent],
  template: `
    <div class="max-w-6xl mx-auto p-6">
      @if (loading()) {
        <div class="text-center py-12 text-gray-500 dark:text-gray-400">Loading game...</div>
      } @else if (error()) {
        <div class="text-center py-12 text-red-600 dark:text-red-400">{{ error() }}</div>
      } @else if (userGame(); as game) {
        <!-- Header -->
        <header class="flex justify-between items-center mb-8">
          <button
            class="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            (click)="goBack()"
          >
            ← Back
          </button>
          <button
            class="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50"
            (click)="showDeleteConfirm.set(true)"
          >
            🗑️ Remove
          </button>
        </header>

        <div class="grid md:grid-cols-[300px_1fr] gap-8">
          <!-- Left: Cover & Screenshots -->
          <aside>
            <div class="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-[3/4] mb-4">
              @if (game.game?.coverUrl) {
                <img
                  [src]="game.game?.coverUrl"
                  [alt]="game.game?.name"
                  class="w-full h-full object-cover"
                />
              } @else {
                <div class="flex items-center justify-center h-full text-gray-400">No Cover</div>
              }
            </div>

            @if (game.game?.screenshotUrls?.length) {
              <app-screenshot-carousel
                [screenshots]="game.game?.screenshotUrls ?? []"
                [alt]="game.game?.name ?? 'Screenshot'"
              />
            }
          </aside>

          <!-- Right: Details & Edit Form -->
          <main>
            <h1 class="text-3xl font-bold mb-2 dark:text-white">{{ game.game?.name }}</h1>

            <div class="flex flex-wrap gap-3 items-center text-gray-500 dark:text-gray-400 mb-4">
              @if (releaseYear()) {
                <span>{{ releaseYear() }}</span>
              }
              @if (game.game?.developer) {
                <span>by {{ game.game?.developer }}</span>
              }
              <!-- Platform tabs -->
              <div class="flex gap-1 items-center">
                <span
                  class="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium"
                  [title]="'Currently viewing'"
                >
                  {{ game.platform?.abbreviation || game.platform?.name }}
                </span>
                @for (sibling of game.siblingEntries || []; track sibling.id) {
                  <button
                    (click)="switchToEntry(sibling.id)"
                    class="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    [title]="'Switch to ' + sibling.platform?.name"
                  >
                    {{ sibling.platform?.abbreviation || sibling.platform?.name }}
                  </button>
                }
                <button
                  (click)="showAddPlatformDialog.set(true)"
                  class="px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full text-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Add another platform"
                >
                  +
                </button>
              </div>
            </div>

            @if (game.game?.genres?.length) {
              <div class="flex flex-wrap gap-2 mb-4">
                @for (genre of game.game?.genres ?? []; track genre) {
                  <span class="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm">{{
                    genre
                  }}</span>
                }
              </div>
            }

            @if (game.game?.summary) {
              <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{{ game.game?.summary }}</p>
            }

            <!-- Edit Form -->
            <section class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-semibold dark:text-white">Your Progress</h2>
                @if (saving()) {
                  <span class="text-sm text-gray-400">Saving...</span>
                }
              </div>

              <!-- Status -->
              <div class="mb-6">
                <label class="block font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <div class="flex flex-wrap gap-2">
                  @for (status of statuses; track status) {
                    <button
                      class="px-4 py-2 rounded-full font-medium border-2 transition-all"
                      [class]="
                        editedStatus() === status
                          ? 'text-white border-transparent'
                          : 'bg-white dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      "
                      [style.backgroundColor]="
                        editedStatus() === status ? statusColors[status] : ''
                      "
                      (click)="setStatus(status)"
                    >
                      {{ statusLabels[status] }}
                    </button>
                  }
                </div>
              </div>

              <!-- Rating -->
              <div class="mb-6">
                <label class="block font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating</label>
                <app-star-rating
                  [rating]="editedRating()"
                  (ratingChange)="setRating($event)" />
              </div>

              <!-- Playtime -->
              <div class="flex justify-between items-center mb-6">
                <label class="font-medium text-gray-700 dark:text-gray-300">Total Playtime</label>
                <span class="text-lg font-semibold text-blue-600 dark:text-blue-400">{{
                  formatPlaytime(game.totalPlaytimeMins)
                }}</span>
              </div>

              <!-- Notes -->
              <div class="mb-6">
                <label class="block font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  [value]="editedNotes()"
                  (input)="editedNotes.set($any($event.target).value)"
                  (blur)="saveField('notes', editedNotes() || undefined)"
                  placeholder="Personal notes..."
                  rows="3"
                  class="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <!-- Review -->
              <div class="mb-6">
                <label class="block font-medium text-gray-700 dark:text-gray-300 mb-2">Review</label>
                <textarea
                  [value]="editedReview()"
                  (input)="editedReview.set($any($event.target).value)"
                  (blur)="saveField('review', editedReview() || undefined)"
                  placeholder="Write your review..."
                  rows="4"
                  class="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>
            </section>

            <!-- Dates -->
            <div class="flex gap-8 flex-wrap items-end mb-6">
              <div class="text-center">
                <span class="block text-sm text-gray-500 dark:text-gray-400">Added</span
                ><span class="font-semibold dark:text-white">{{ formatDate(game.dateAdded) }}</span>
              </div>
              <div class="text-center">
                <span class="block text-sm text-gray-500 dark:text-gray-400">Started</span
                ><span class="font-semibold dark:text-white">{{ formatDate(game.dateStarted) }}</span>
              </div>
              <div class="text-center">
                <span class="block text-sm text-gray-500 dark:text-gray-400">Completed</span
                ><span class="font-semibold dark:text-white">{{ formatDate(game.dateCompleted) }}</span>
              </div>
              @if (game.steamAppId) {
                <button
                  (click)="syncDates()"
                  [disabled]="syncingDates()"
                  class="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  title="Sync started/completed dates from Steam achievements"
                >
                  {{ syncingDates() ? '⏳' : '🔄' }} Sync from Steam
                </button>
              }
            </div>

            <!-- Achievements -->
            @if (game.steamAppId) {
              <app-achievements
                [userGameId]="game.id"
                [steamAppId]="game.steamAppId"
              />
            }
          </main>
        </div>
      }
    </div>

    <!-- Delete Confirmation Dialog -->
    @if (showDeleteConfirm()) {
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        (click)="showDeleteConfirm.set(false)"
      >
        <div
          class="bg-white dark:bg-gray-800 p-8 rounded-xl max-w-md w-full mx-4"
          (click)="$event.stopPropagation()"
        >
          <h2 class="text-xl font-bold mb-2 dark:text-white">Remove Game?</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            Are you sure you want to remove <strong class="dark:text-white">{{ userGame()?.game?.name }}</strong> from your
            library?
          </p>
          <div class="flex gap-4">
            <button
              class="flex-1 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              (click)="showDeleteConfirm.set(false)"
            >
              Cancel
            </button>
            <button
              class="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              (click)="deleteGame()"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Add Platform Dialog -->
    @if (showAddPlatformDialog()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closeAddPlatformDialog()">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-xl font-bold mb-4 dark:text-white">Add Platform</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Select a platform to add "{{ userGame()?.game?.name }}" to:
          </p>

          <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
            @for (platform of availablePlatforms(); track platform.id) {
              <button
                (click)="selectedPlatformId.set(platform.id)"
                class="px-4 py-2 text-left rounded-lg border transition-colors"
                [class.border-blue-500]="selectedPlatformId() === platform.id"
                [class.bg-blue-50]="selectedPlatformId() === platform.id"
                [class.dark:bg-blue-900/30]="selectedPlatformId() === platform.id"
                [class.border-gray-200]="selectedPlatformId() !== platform.id"
                [class.dark:border-gray-600]="selectedPlatformId() !== platform.id"
                [class.hover:border-gray-300]="selectedPlatformId() !== platform.id"
                [class.dark:hover:border-gray-500]="selectedPlatformId() !== platform.id"
              >
                <span class="font-medium dark:text-white">{{ platform.abbreviation }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400 block">{{ platform.name }}</span>
              </button>
            }
          </div>

          @if (availablePlatforms().length === 0) {
            <p class="text-gray-500 dark:text-gray-400 text-center py-4">
              This game is already added on all available platforms.
            </p>
          }

          <div class="flex gap-3">
            <button
              class="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              (click)="closeAddPlatformDialog()"
            >
              Cancel
            </button>
            <button
              class="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              [disabled]="!selectedPlatformId() || addingPlatform()"
              (click)="addPlatform()"
            >
              {{ addingPlatform() ? 'Adding...' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class GameDetailContainer {
  private router = inject(Router);

  // Route param
  id = input.required<string>();

  // Use client libs
  gameQuery = injectGameQuery(() => {
    const idStr = this.id();
    return idStr ? parseInt(idStr, 10) : null;
  });

  updateMutation = injectUpdateGameMutation();
  deleteMutation = injectDeleteGameMutation({
    onSuccess: () => this.router.navigate(['/library']),
  });
  syncDatesMutation = injectSyncDatesMutation();
  addGameMutation = injectAddGameMutation({
    onSuccess: () => {
      this.closeAddPlatformDialog();
      // Refresh current game to get updated siblingEntries
      this.gameQuery.refetch();
    },
  });

  // All platforms
  allPlatforms = injectPlatforms();

  // Derived state from query
  userGame = computed(() => this.gameQuery.data() ?? null);
  loading = computed(() => this.gameQuery.isPending());
  error = computed(() => (this.gameQuery.error() ? 'Failed to load game' : null));
  saving = computed(() => this.updateMutation.isPending());
  syncingDates = computed(() => this.syncDatesMutation.isPending());
  addingPlatform = computed(() => this.addGameMutation.isPending());

  // Platforms not yet added for this game
  availablePlatforms = computed(() => {
    const game = this.userGame();
    if (!game) return [];

    const existingPlatformIds = new Set<number>();
    if (game.platformId) existingPlatformIds.add(game.platformId);
    game.siblingEntries?.forEach(s => {
      if (s.platformId) existingPlatformIds.add(s.platformId);
    });

    return this.allPlatforms().filter(p => !existingPlatformIds.has(p.id));
  });

  // Edit state
  editedStatus = signal<GameStatus>('backlog');
  editedRating = signal<number | null>(null);
  editedNotes = signal('');
  editedReview = signal('');

  // UI state
  showDeleteConfirm = signal(false);
  showAddPlatformDialog = signal(false);
  selectedPlatformId = signal<number | null>(null);

  readonly statuses: GameStatus[] = [
    'backlog',
    'up_next',
    'playing',
    'completed',
    'finished',
    'on_hold',
    'dropped',
    'wishlist',
  ];
  readonly statusLabels = GAME_STATUS_LABELS;
  readonly statusColors = GAME_STATUS_COLORS;

  releaseYear = computed(() => {
    const date = this.userGame()?.game?.releaseDate;
    return date ? new Date(date).getFullYear() : null;
  });

  constructor() {
    // Sync edit state when game data loads
    effect(() => {
      const game = this.userGame();
      if (game) {
        this.editedStatus.set(game.status);
        this.editedRating.set(game.rating ?? null);
        this.editedNotes.set(game.notes ?? '');
        this.editedReview.set(game.review ?? '');
      }
    });
  }

  saveField(field: string, value: any) {
    const game = this.userGame();
    if (!game) return;
    this.updateMutation.mutate({ id: game.id, updates: { [field]: value } });
  }

  setStatus(status: GameStatus) {
    this.editedStatus.set(status);
    this.saveField('status', status);
  }

  deleteGame() {
    const game = this.userGame();
    if (!game) return;
    this.deleteMutation.mutate(game.id);
  }

  setRating(rating: number) {
    const newRating = this.editedRating() === rating ? null : rating;
    this.editedRating.set(newRating);
    this.saveField('rating', newRating);
  }

  formatPlaytime(mins: number): string {
    if (mins < 60) return `${mins} minutes`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hours`;
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString();
  }

  syncDates() {
    const game = this.userGame();
    if (!game) return;
    this.syncDatesMutation.mutate(game.id);
  }

  switchToEntry(entryId: number) {
    this.router.navigate(['/games', entryId]);
  }

  closeAddPlatformDialog() {
    this.showAddPlatformDialog.set(false);
    this.selectedPlatformId.set(null);
  }

  addPlatform() {
    const game = this.userGame();
    const platformId = this.selectedPlatformId();
    if (!game?.game?.igdbId || !platformId) return;

    this.addGameMutation.mutate({
      igdbId: game.game.igdbId,
      platformId,
      status: 'backlog',
    });
  }

  goBack() {
    this.router.navigate(['/library']);
  }
}
