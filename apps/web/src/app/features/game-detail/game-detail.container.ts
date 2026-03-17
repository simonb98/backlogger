import { Component, inject, signal, OnInit, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GamesService } from '../../core/services';
import { UserGame, GameStatus, GAME_STATUS_LABELS, GAME_STATUS_COLORS } from '../../core/models';

@Component({
  selector: 'app-game-detail-container',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto p-6">
      @if (loading()) {
        <div class="text-center py-12 text-gray-500">Loading game...</div>
      } @else if (error()) {
        <div class="text-center py-12 text-red-600">{{ error() }}</div>
      } @else if (userGame(); as game) {
        <!-- Header -->
        <header class="flex justify-between items-center mb-8">
          <button class="px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg" (click)="goBack()">← Back</button>
          <button class="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" (click)="showDeleteConfirm.set(true)">🗑️ Remove</button>
        </header>

        <div class="grid md:grid-cols-[300px_1fr] gap-8">
          <!-- Left: Cover & Screenshots -->
          <aside>
            <div class="rounded-xl overflow-hidden bg-gray-100 aspect-[3/4] mb-4">
              @if (game.game?.coverUrl) {
                <img [src]="game.game?.coverUrl" [alt]="game.game?.name" class="w-full h-full object-cover" />
              } @else {
                <div class="flex items-center justify-center h-full text-gray-400">No Cover</div>
              }
            </div>

            @if (game.game?.screenshotUrls?.length) {
              <div class="relative rounded-lg overflow-hidden">
                <img [src]="game.game?.screenshotUrls?.[activeScreenshot()]" alt="Screenshot" class="w-full aspect-video object-cover" />
                <button class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full hover:bg-black/70" (click)="prevScreenshot()">‹</button>
                <button class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full hover:bg-black/70" (click)="nextScreenshot()">›</button>
              </div>
              <div class="flex justify-center gap-2 mt-2">
                @for (ss of game.game?.screenshotUrls ?? []; track $index) {
                  <span class="w-2 h-2 rounded-full" [class]="$index === activeScreenshot() ? 'bg-blue-500' : 'bg-gray-300'"></span>
                }
              </div>
            }
          </aside>

          <!-- Right: Details & Edit Form -->
          <main>
            <h1 class="text-3xl font-bold mb-2">{{ game.game?.name }}</h1>

            <div class="flex flex-wrap gap-3 items-center text-gray-500 mb-4">
              @if (releaseYear()) { <span>{{ releaseYear() }}</span> }
              @if (game.game?.developer) { <span>by {{ game.game?.developer }}</span> }
              <span class="px-3 py-1 bg-gray-200 rounded-full text-sm">{{ game.platform?.name }}</span>
            </div>

            @if (game.game?.genres?.length) {
              <div class="flex flex-wrap gap-2 mb-4">
                @for (genre of game.game?.genres ?? []; track genre) {
                  <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">{{ genre }}</span>
                }
              </div>
            }

            @if (game.game?.summary) {
              <p class="text-gray-600 leading-relaxed mb-6">{{ game.game?.summary }}</p>
            }

            <!-- Edit Form -->
            <section class="bg-white p-6 rounded-xl shadow-sm mb-6">
              <h2 class="text-xl font-semibold mb-6">Your Progress</h2>

              <!-- Status -->
              <div class="mb-6">
                <label class="block font-medium text-gray-700 mb-2">Status</label>
                <div class="flex flex-wrap gap-2">
                  @for (status of statuses; track status) {
                    <button
                      class="px-4 py-2 rounded-full font-medium border-2 transition-all"
                      [class]="editedStatus() === status ? 'text-white border-transparent' : 'bg-white border-gray-200 hover:border-gray-300'"
                      [style.backgroundColor]="editedStatus() === status ? statusColors[status] : ''"
                      (click)="editedStatus.set(status)">
                      {{ statusLabels[status] }}
                    </button>
                  }
                </div>
              </div>

              <!-- Rating -->
              <div class="mb-6">
                <label class="block font-medium text-gray-700 mb-2">Your Rating</label>
                <div class="flex items-center gap-1">
                  @for (star of [1,2,3,4,5,6,7,8,9,10]; track star) {
                    <button
                      class="text-2xl transition-colors"
                      [class]="editedRating() !== null && star <= editedRating()! ? 'text-yellow-400' : 'text-gray-300'"
                      (click)="setRating(star)">★</button>
                  }
                  @if (editedRating()) {
                    <span class="ml-2 font-semibold text-gray-700">{{ editedRating() }}/10</span>
                  }
                </div>
              </div>

              <!-- Completion -->
              <div class="mb-6">
                <label class="block font-medium text-gray-700 mb-2">Completion: {{ editedCompletionPercent() }}%</label>
                <input type="range" min="0" max="100" [value]="editedCompletionPercent()"
                  (input)="editedCompletionPercent.set(+$any($event.target).value)"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>

              <!-- Playtime -->
              <div class="flex justify-between items-center mb-6">
                <label class="font-medium text-gray-700">Total Playtime</label>
                <span class="text-lg font-semibold text-blue-600">{{ formatPlaytime(game.totalPlaytimeMins) }}</span>
              </div>

              <!-- Notes -->
              <div class="mb-6">
                <label class="block font-medium text-gray-700 mb-2">Notes</label>
                <textarea [value]="editedNotes()" (input)="editedNotes.set($any($event.target).value)"
                  placeholder="Personal notes..." rows="3"
                  class="w-full p-3 border-2 border-gray-200 rounded-lg resize-y focus:outline-none focus:border-blue-500"></textarea>
              </div>

              <!-- Review -->
              <div class="mb-6">
                <label class="block font-medium text-gray-700 mb-2">Review</label>
                <textarea [value]="editedReview()" (input)="editedReview.set($any($event.target).value)"
                  placeholder="Write your review..." rows="4"
                  class="w-full p-3 border-2 border-gray-200 rounded-lg resize-y focus:outline-none focus:border-blue-500"></textarea>
              </div>

              <button class="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50"
                (click)="saveChanges()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </section>

            <!-- Dates -->
            <div class="flex gap-8 flex-wrap text-center">
              <div><span class="block text-sm text-gray-500">Added</span><span class="font-semibold">{{ formatDate(game.dateAdded) }}</span></div>
              <div><span class="block text-sm text-gray-500">Started</span><span class="font-semibold">{{ formatDate(game.dateStarted) }}</span></div>
              <div><span class="block text-sm text-gray-500">Completed</span><span class="font-semibold">{{ formatDate(game.dateCompleted) }}</span></div>
            </div>
          </main>
        </div>
      }
    </div>

    <!-- Delete Confirmation Dialog -->
    @if (showDeleteConfirm()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="showDeleteConfirm.set(false)">
        <div class="bg-white p-8 rounded-xl max-w-md w-full mx-4" (click)="$event.stopPropagation()">
          <h2 class="text-xl font-bold mb-2">Remove Game?</h2>
          <p class="text-gray-500 mb-6">Are you sure you want to remove <strong>{{ userGame()?.game?.name }}</strong> from your library?</p>
          <div class="flex gap-4">
            <button class="flex-1 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200" (click)="showDeleteConfirm.set(false)">Cancel</button>
            <button class="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700" (click)="deleteGame()">Remove</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class GameDetailContainer implements OnInit {
  private gamesService = inject(GamesService);
  private router = inject(Router);

  // Route param
  id = input.required<string>();

  userGame = signal<UserGame | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  
  // Edit state
  editedStatus = signal<GameStatus>('backlog');
  editedRating = signal<number | null>(null);
  editedNotes = signal('');
  editedReview = signal('');
  editedCompletionPercent = signal(0);
  
  // UI state
  showDeleteConfirm = signal(false);
  activeScreenshot = signal(0);

  readonly statuses: GameStatus[] = ['backlog', 'playing', 'completed', 'on_hold', 'dropped', 'wishlist'];
  readonly statusLabels = GAME_STATUS_LABELS;
  readonly statusColors = GAME_STATUS_COLORS;

  releaseYear = computed(() => {
    const date = this.userGame()?.game?.releaseDate;
    return date ? new Date(date).getFullYear() : null;
  });

  ngOnInit() {
    this.loadGame();
  }

  loadGame() {
    this.loading.set(true);
    this.error.set(null);

    const gameId = parseInt(this.id(), 10);
    this.gamesService.getGame(gameId).subscribe({
      next: (game) => {
        this.userGame.set(game);
        this.editedStatus.set(game.status);
        this.editedRating.set(game.rating ?? null);
        this.editedNotes.set(game.notes ?? '');
        this.editedReview.set(game.review ?? '');
        this.editedCompletionPercent.set(game.completionPercent);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load game');
        this.loading.set(false);
        console.error('Load game error:', err);
      },
    });
  }

  saveChanges() {
    const game = this.userGame();
    if (!game) return;

    this.saving.set(true);
    this.gamesService.updateGame(game.id, {
      status: this.editedStatus(),
      rating: this.editedRating(),
      notes: this.editedNotes() || undefined,
      review: this.editedReview() || undefined,
      completionPercent: this.editedCompletionPercent(),
    }).subscribe({
      next: (updated) => {
        this.userGame.set(updated);
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Save error:', err);
        this.saving.set(false);
        alert('Failed to save changes');
      },
    });
  }

  deleteGame() {
    const game = this.userGame();
    if (!game) return;

    this.gamesService.deleteGame(game.id).subscribe({
      next: () => {
        this.router.navigate(['/library']);
      },
      error: (err) => {
        console.error('Delete error:', err);
        alert('Failed to delete game');
      },
    });
  }

  setRating(rating: number) {
    this.editedRating.set(this.editedRating() === rating ? null : rating);
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

  prevScreenshot() {
    const screenshots = this.userGame()?.game?.screenshotUrls ?? [];
    const current = this.activeScreenshot();
    this.activeScreenshot.set(current > 0 ? current - 1 : screenshots.length - 1);
  }

  nextScreenshot() {
    const screenshots = this.userGame()?.game?.screenshotUrls ?? [];
    const current = this.activeScreenshot();
    this.activeScreenshot.set(current < screenshots.length - 1 ? current + 1 : 0);
  }

  goBack() {
    this.router.navigate(['/library']);
  }
}

