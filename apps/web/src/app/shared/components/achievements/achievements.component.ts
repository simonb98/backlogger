import { Component, inject, input, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services';

interface Achievement {
  id: number;
  apiName: string;
  name: string;
  description?: string;
  iconUrl?: string;
  iconGrayUrl?: string;
  achieved: boolean;
  unlockTime?: string;
  globalPercent?: number;
}

interface AchievementStats {
  total: number;
  unlocked: number;
  percent: number;
}

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold dark:text-white">🏆 Achievements</h2>
        @if (hasSteamId()) {
          <button
            (click)="syncAchievements()"
            [disabled]="syncing()"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {{ syncing() ? 'Syncing...' : '🔄 Sync from Steam' }}
          </button>
        }
      </div>

      @if (!hasSteamId()) {
        <p class="text-gray-500 dark:text-gray-400 text-center py-4">
          Link your Steam account to sync achievements
        </p>
      } @else if (loading()) {
        <div class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      } @else if (achievements().length === 0) {
        <p class="text-gray-500 dark:text-gray-400 text-center py-4">
          No achievements synced yet. Click "Sync from Steam" to fetch them.
        </p>
      } @else {
        <!-- Stats Bar -->
        <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-600 dark:text-gray-300">
              {{ stats().unlocked }} / {{ stats().total }} unlocked
            </span>
            <span class="font-bold text-blue-500">{{ stats().percent }}%</span>
          </div>
          <div class="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
              [style.width.%]="stats().percent"
            ></div>
          </div>
        </div>

        <!-- Achievement Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          @for (achievement of sortedAchievements(); track achievement.id) {
            <div
              class="flex items-start gap-3 p-3 rounded-lg transition-colors"
              [class]="achievement.achieved 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-gray-50 dark:bg-gray-700/50 opacity-60'"
            >
              <img
                [src]="achievement.achieved ? achievement.iconUrl : achievement.iconGrayUrl"
                [alt]="achievement.name"
                class="w-12 h-12 rounded"
                onerror="this.style.display='none'"
              />
              <div class="flex-1 min-w-0">
                <div class="font-medium dark:text-white truncate" [title]="achievement.name">
                  {{ achievement.name }}
                </div>
                @if (achievement.description) {
                  <div class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {{ achievement.description }}
                  </div>
                }
                <div class="flex items-center gap-2 mt-1 text-xs">
                  @if (achievement.globalPercent !== null && achievement.globalPercent !== undefined) {
                    <span class="text-gray-400">{{ achievement.globalPercent | number:'1.1-1' }}% of players</span>
                  }
                  @if (achievement.achieved && achievement.unlockTime) {
                    <span class="text-green-600 dark:text-green-400">
                      ✓ {{ formatDate(achievement.unlockTime) }}
                    </span>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AchievementsComponent implements OnInit, OnChanges {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  userGameId = input.required<number>();
  steamAppId = input<number | null>(null);

  loading = signal(true);
  syncing = signal(false);
  achievements = signal<Achievement[]>([]);
  stats = signal<AchievementStats>({ total: 0, unlocked: 0, percent: 0 });

  hasSteamId = signal(false);

  sortedAchievements = () => {
    return [...this.achievements()].sort((a, b) => {
      // Unlocked first, then by global percent (rarest first)
      if (a.achieved !== b.achieved) return a.achieved ? -1 : 1;
      return (a.globalPercent ?? 100) - (b.globalPercent ?? 100);
    });
  };

  ngOnInit() {
    this.checkSteamId();
    this.loadAchievements();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userGameId'] && !changes['userGameId'].firstChange) {
      this.loadAchievements();
    }
  }

  private checkSteamId() {
    const user = this.authService.user();
    this.hasSteamId.set(!!user?.steamId);
  }

  loadAchievements() {
    this.loading.set(true);
    this.http.get<{ data: Achievement[] }>(`/api/v1/steam/achievements/${this.userGameId()}`).subscribe({
      next: (res) => {
        this.achievements.set(res.data || []);
        this.updateStats();
        this.loading.set(false);
      },
      error: () => {
        this.achievements.set([]);
        this.loading.set(false);
      },
    });
  }

  syncAchievements() {
    this.syncing.set(true);
    this.http.post<{ data: Achievement[] }>(`/api/v1/steam/achievements/${this.userGameId()}/sync`, {}).subscribe({
      next: (res) => {
        this.achievements.set(res.data || []);
        this.updateStats();
        this.syncing.set(false);
      },
      error: () => {
        this.syncing.set(false);
      },
    });
  }

  private updateStats() {
    const all = this.achievements();
    const unlocked = all.filter(a => a.achieved).length;
    this.stats.set({
      total: all.length,
      unlocked,
      percent: all.length > 0 ? Math.round((unlocked / all.length) * 100) : 0,
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }
}

