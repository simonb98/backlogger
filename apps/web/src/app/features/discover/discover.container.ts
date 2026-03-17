import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  injectGamesQuery,
  injectUpdateGameMutation,
  UserGame,
  GAME_STATUS_LABELS,
} from '../../libs/client-games-api';

@Component({
  selector: 'app-discover-container',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-73px)] flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      @if (loading()) {
        <div class="text-white/70">Loading your games...</div>
      } @else if (backlogGames().length === 0) {
        <div class="text-center">
          <p class="text-white/70 mb-4">No games to discover!</p>
          <a routerLink="/search" class="text-purple-400 hover:underline">Add some games first</a>
        </div>
      } @else if (currentIndex() >= backlogGames().length) {
        <div class="text-center">
          <div class="text-6xl mb-4">🎮</div>
          <p class="text-xl font-semibold mb-2 text-white">You've seen all your games!</p>
          <p class="text-white/60 mb-6">{{ backlogGames().length }} games reviewed</p>
          <button (click)="reset()" class="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">
            Start Over
          </button>
        </div>
      } @else {
        <!-- Card Stack -->
        <div class="relative w-full max-w-5xl h-[600px] mb-6">
          @for (game of visibleCards(); track game.id; let i = $index) {
            <div
              class="absolute inset-0 bg-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 border border-white/10"
              [class]="i === 0 ? cardClass() : ''"
              [style.transform]="'scale(' + (1 - i * 0.03) + ') translateY(' + (i * 8) + 'px)'"
              [style.zIndex]="10 - i"
              [style.opacity]="i < 3 ? 1 : 0">

              @if (i === 0 && game.game) {
                <div class="h-full flex">
                  <!-- Left: Poster Cover (2:3 aspect ratio) -->
                  <div class="w-96 h-full flex-shrink-0 bg-slate-900">
                    @if (game.game.coverUrl) {
                      <img
                        [src]="getCoverUrl(game.game.coverUrl)"
                        [alt]="game.game.name"
                        class="w-full h-full object-cover" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-b from-purple-800 to-slate-900">
                        🎮
                      </div>
                    }
                  </div>

                  <!-- Right: Media + Info -->
                  <div class="flex-1 flex flex-col min-w-0">
                    <!-- Top: Screenshots Carousel -->
                    <div class="h-80 bg-slate-900 relative overflow-hidden">
                      @if (game.game.screenshotUrls && game.game.screenshotUrls.length > 0) {
                        <img
                          [src]="game.game.screenshotUrls[activeScreenshot()]"
                          [alt]="game.game.name"
                          class="w-full h-full object-cover" />

                        <!-- Screenshot Navigation Dots -->
                        @if (game.game.screenshotUrls.length > 1) {
                          <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            @for (ss of game.game.screenshotUrls.slice(0, 5); track $index) {
                              <button
                                (click)="activeScreenshot.set($index)"
                                class="w-2 h-2 rounded-full transition-all"
                                [class]="$index === activeScreenshot() ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'">
                              </button>
                            }
                          </div>
                        }

                        <!-- Arrow Navigation -->
                        @if (game.game.screenshotUrls.length > 1) {
                          <button
                            (click)="prevScreenshot(game.game.screenshotUrls.length)"
                            class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                            ‹
                          </button>
                          <button
                            (click)="nextScreenshot(game.game.screenshotUrls.length)"
                            class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                            ›
                          </button>
                        }
                      } @else if (game.game.coverUrl) {
                        <!-- Fallback to blurred cover -->
                        <img
                          [src]="getCoverUrl(game.game.coverUrl)"
                          [alt]="game.game.name"
                          class="w-full h-full object-cover blur-sm scale-110 opacity-50" />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-white/30 text-lg">
                          No screenshots available
                        </div>
                      }
                    </div>

                    <!-- Bottom: Game Info -->
                    <div class="flex-1 p-5 overflow-y-auto">
                      <h2 class="text-2xl font-bold text-white mb-2 leading-tight">{{ game.game.name }}</h2>

                      <div class="flex flex-wrap items-center gap-2 mb-3 text-sm text-white/60">
                        @if (game.platform) {
                          <span class="px-2 py-0.5 bg-white/10 rounded">{{ game.platform.name }}</span>
                        }
                        @if (game.game.releaseDate) {
                          <span>{{ game.game.releaseDate | date:'yyyy' }}</span>
                        }
                        @if (game.game.igdbRating) {
                          <span class="flex items-center gap-1">
                            <span class="text-yellow-400">★</span>
                            {{ (game.game.igdbRating / 10).toFixed(1) }}
                          </span>
                        }
                        @if (game.totalPlaytimeMins > 0) {
                          <span>🕐 {{ formatPlaytime(game.totalPlaytimeMins) }}</span>
                        }
                      </div>

                      @if (game.game.genres && game.game.genres.length > 0) {
                        <div class="flex flex-wrap gap-1.5 mb-3">
                          @for (genre of game.game.genres.slice(0, 4); track genre) {
                            <span class="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">{{ genre }}</span>
                          }
                          @for (theme of (game.game.themes ?? []).slice(0, 2); track theme) {
                            <span class="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">{{ theme }}</span>
                          }
                        </div>
                      }

                      @if (game.game.summary) {
                        <p class="text-white/70 text-sm line-clamp-3 leading-relaxed">{{ game.game.summary }}</p>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-8">
          <button
            (click)="swipeLeft()"
            class="w-16 h-16 rounded-full bg-white/10 backdrop-blur shadow-lg flex flex-col items-center justify-center hover:bg-red-500/30 hover:scale-110 transition-all border border-white/20"
            title="Not right now (30 days)">
            <span class="text-2xl">👎</span>
            <span class="text-[10px] text-white/60">Later</span>
          </button>
          <button
            (click)="pickRandom()"
            class="w-14 h-14 rounded-full bg-white/10 backdrop-blur shadow-lg flex items-center justify-center text-2xl hover:bg-yellow-500/30 hover:scale-110 transition-all border border-white/20"
            title="Jump to random">
            🎲
          </button>
          <button
            (click)="swipeRight()"
            class="w-16 h-16 rounded-full bg-white/10 backdrop-blur shadow-lg flex flex-col items-center justify-center hover:bg-green-500/30 hover:scale-110 transition-all border border-white/20"
            title="Add to Up Next">
            <span class="text-2xl">👍</span>
            <span class="text-[10px] text-white/60">Up Next</span>
          </button>
        </div>

        <p class="text-white/40 text-sm mt-4">
          {{ currentIndex() + 1 }} / {{ backlogGames().length }}
        </p>
      }
    </div>
  `,
})
export class DiscoverContainer {
  private router = inject(Router);

  // Use client libs - fetch all games with limit 0
  gamesQuery = injectGamesQuery(() => ({ limit: 0 }));
  updateMutation = injectUpdateGameMutation();

  allGames = computed(() => this.gamesQuery.data()?.games || []);
  loading = computed(() => this.gamesQuery.isPending());

  currentIndex = signal(0);
  cardClass = signal('');
  activeScreenshot = signal(0);

  backlogGames = computed(() => {
    const validStatuses = ['backlog', 'wishlist', 'playing', 'on_hold'];
    const now = new Date();
    return this.shuffled(
      this.allGames().filter(g => {
        if (!validStatuses.includes(g.status)) return false;
        if (g.skippedUntil && new Date(g.skippedUntil) > now) return false;
        return true;
      })
    );
  });

  visibleCards = computed(() => {
    return this.backlogGames().slice(this.currentIndex(), this.currentIndex() + 3);
  });

  private shuffledGames: UserGame[] = [];

  private shuffled(games: UserGame[]): UserGame[] {
    if (this.shuffledGames.length === 0) {
      this.shuffledGames = [...games].sort(() => Math.random() - 0.5);
    }
    return this.shuffledGames;
  }

  swipeLeft() {
    const game = this.visibleCards()[0];
    if (!game) return;

    this.cardClass.set('-translate-x-full rotate-[-20deg] opacity-0');

    // Set skippedUntil to 30 days from now
    const skipUntil = new Date();
    skipUntil.setDate(skipUntil.getDate() + 30);

    setTimeout(() => {
      this.updateMutation.mutate(
        { id: game.id, updates: { skippedUntil: skipUntil.toISOString() } },
        {
          onSettled: () => {
            this.currentIndex.update(i => i + 1);
            this.activeScreenshot.set(0);
            this.cardClass.set('');
          },
        }
      );
    }, 200);
  }

  swipeRight() {
    const game = this.visibleCards()[0];
    if (!game) return;

    this.cardClass.set('translate-x-full rotate-[20deg] opacity-0');
    setTimeout(() => {
      this.updateMutation.mutate(
        { id: game.id, updates: { status: 'up_next' } },
        {
          onSuccess: () => {
            this.currentIndex.update(i => i + 1);
            this.activeScreenshot.set(0);
            this.cardClass.set('');
          },
        }
      );
    }, 200);
  }

  pickRandom() {
    const remaining = this.backlogGames().length - this.currentIndex();
    if (remaining <= 1) {
      this.swipeRight();
      return;
    }
    const randomSkip = Math.floor(Math.random() * (remaining - 1)) + 1;
    this.currentIndex.update(i => i + randomSkip);
    this.activeScreenshot.set(0);
  }

  reset() {
    this.shuffledGames = [];
    this.currentIndex.set(0);
    this.activeScreenshot.set(0);
    // Refetch games to reset the shuffle
    this.gamesQuery.refetch();
  }

  formatPlaytime(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h`;
  }

  getCoverUrl(url: string): string {
    // Convert cover_big to 720p for larger display
    return url.replace('t_cover_big', 't_720p');
  }

  nextScreenshot(total: number) {
    this.activeScreenshot.update(i => (i + 1) % Math.min(total, 5));
  }

  prevScreenshot(total: number) {
    this.activeScreenshot.update(i => (i - 1 + Math.min(total, 5)) % Math.min(total, 5));
  }
}

