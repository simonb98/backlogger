import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface ProfileStats {
  user: {
    id: number;
    email?: string;
    displayName?: string;
    steamId?: string;
    steamAvatar?: string;
    createdAt: string;
  };
  stats: {
    totalGames: number;
    totalPlaytimeHours: number;
    averagePlaytimeHours: number;
    completedGames: number;
    playingGames: number;
    backlogGames: number;
    unlockedAchievements: number;
    platformBreakdown: { platform: string; count: number }[];
    statusBreakdown: { status: string; count: number }[];
  };
  recentlyPlayed: {
    id: number;
    name: string;
    coverUrl?: string;
    platform: string;
    playtimeHours: number;
    lastPlayed?: string;
  }[];
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto p-6">
      @if (loading()) {
        <div class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      } @else if (profile()) {
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-6 shadow-sm">
          <div class="flex items-center gap-6">
            @if (profile()!.user.steamAvatar) {
              <img 
                [src]="profile()!.user.steamAvatar" 
                alt="Avatar"
                class="w-24 h-24 rounded-full border-4 border-blue-500"
              />
            } @else {
              <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {{ getInitials() }}
              </div>
            }
            <div>
              <h1 class="text-3xl font-bold dark:text-white">
                {{ profile()!.user.displayName || profile()!.user.email || 'Gamer' }}
              </h1>
              @if (profile()!.user.steamId) {
                <p class="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.15 9.42 7.6 11.18l3.69-5.27c-.22-.05-.44-.08-.67-.08-2.35 0-4.27 1.92-4.27 4.27 0 .23.02.45.05.67L.86 18.33C2.44 21.26 5.97 23.15 10 23.15c5.52 0 10-4.48 10-10 0-5.52-4.48-10-10-10z"/>
                  </svg>
                  Steam Connected
                </p>
              }
              <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Member since {{ profile()!.user.createdAt | date:'MMMM yyyy' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
            <div class="text-4xl font-bold text-blue-500">{{ profile()!.stats.totalGames }}</div>
            <div class="text-gray-500 dark:text-gray-400 mt-1">Total Games</div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
            <div class="text-4xl font-bold text-green-500">{{ profile()!.stats.totalPlaytimeHours | number }}</div>
            <div class="text-gray-500 dark:text-gray-400 mt-1">Hours Played</div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
            <div class="text-4xl font-bold text-green-400">{{ profile()!.stats.averagePlaytimeHours | number:'1.0-0' }}</div>
            <div class="text-gray-500 dark:text-gray-400 mt-1">Avg Playtime</div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
            <div class="text-4xl font-bold text-purple-500">{{ profile()!.stats.completedGames }}</div>
            <div class="text-gray-500 dark:text-gray-400 mt-1">Completed</div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
            <div class="text-4xl font-bold text-cyan-500">{{ profile()!.stats.unlockedAchievements | number }}</div>
            <div class="text-gray-500 dark:text-gray-400 mt-1">Achievements</div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- Recently Played -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 class="text-xl font-bold dark:text-white mb-4">Recently Played</h2>
            @if (profile()!.recentlyPlayed.length === 0) {
              <p class="text-gray-500 dark:text-gray-400">No games played yet</p>
            } @else {
              <div class="space-y-3">
                @for (game of profile()!.recentlyPlayed; track game.id) {
                  <a 
                    [routerLink]="['/games', game.id]"
                    class="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors no-underline"
                  >
                    @if (game.coverUrl) {
                      <img [src]="game.coverUrl" [alt]="game.name" class="w-12 h-16 object-cover rounded"/>
                    } @else {
                      <div class="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-2xl">🎮</div>
                    }
                    <div class="flex-1 min-w-0">
                      <div class="font-medium dark:text-white truncate">{{ game.name }}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{{ game.platform }}</div>
                    </div>
                    <div class="text-right">
                      <div class="font-medium text-blue-500">{{ game.playtimeHours }}h</div>
                    </div>
                  </a>
                }
              </div>
            }
          </div>

          <!-- Platforms -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 class="text-xl font-bold dark:text-white mb-4">Platforms</h2>
            <div class="space-y-3">
              @for (platform of profile()!.stats.platformBreakdown; track platform.platform) {
                <div class="flex items-center justify-between">
                  <span class="dark:text-gray-300">{{ platform.platform }}</span>
                  <div class="flex items-center gap-3">
                    <div class="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-blue-500 rounded-full"
                        [style.width.%]="(platform.count / profile()!.stats.totalGames) * 100"
                      ></div>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400 w-10 text-right">{{ platform.count }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Status Breakdown -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow-sm">
          <h2 class="text-xl font-bold dark:text-white mb-4">Library Status</h2>
          <div class="flex flex-wrap gap-4">
            @for (status of profile()!.stats.statusBreakdown; track status.status) {
              <div class="flex items-center gap-2 px-4 py-2 rounded-lg" [class]="getStatusClass(status.status)">
                <span class="font-medium">{{ formatStatus(status.status) }}</span>
                <span class="opacity-75">{{ status.count }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ProfileContainer implements OnInit {
  private http = inject(HttpClient);

  loading = signal(true);
  profile = signal<ProfileStats | null>(null);

  ngOnInit() {
    this.http.get<{ success: boolean; data: ProfileStats }>('/api/v1/profile').subscribe({
      next: (response) => {
        this.profile.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getInitials(): string {
    const name = this.profile()?.user.displayName || this.profile()?.user.email || '';
    return name.substring(0, 2).toUpperCase();
  }

  formatStatus(status: string): string {
    const labels: Record<string, string> = {
      backlog: 'Backlog',
      playing: 'Playing',
      completed: 'Completed',
      dropped: 'Dropped',
      wishlist: 'Wishlist',
      up_next: 'Up Next',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      backlog: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      playing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      dropped: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      wishlist: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
      up_next: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    };
    return classes[status] || 'bg-gray-100 dark:bg-gray-700';
  }
}

