import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ImportProgress,
  ImportResult,
  injectSteamImportMutation,
  injectSteamProfileMutation,
} from '../../libs/client-steam-api';

@Component({
  selector: 'app-import-container',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-2 dark:text-white">Import from Steam</h1>
      <p class="text-gray-500 dark:text-gray-400 mb-8">Import your Steam library to quickly add games</p>

      <!-- Step 1: Enter Steam ID -->
      @if (!profile() && !importResult() && !importing()) {
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <label class="block font-medium mb-2 dark:text-gray-300">Steam Profile URL or ID</label>
          <input
            type="text"
            [(ngModel)]="steamInput"
            placeholder="https://steamcommunity.com/id/yourname"
            class="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
          />
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Paste your Steam profile URL, Steam ID, or vanity name.<br />
            Make sure your Steam profile and game library are set to <strong class="dark:text-white">public</strong>.
          </p>
          <button
            (click)="lookupProfile()"
            [disabled]="loading() || !steamInput"
            class="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {{ loading() ? 'Looking up...' : 'Find Profile' }}
          </button>
          @if (error()) {
            <p class="mt-4 text-red-600 dark:text-red-400 text-center">{{ error() }}</p>
          }
        </div>
      }

      <!-- Step 2: Confirm Profile -->
      @if (profile() && !importResult() && !importing()) {
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div class="flex items-center gap-4 mb-6">
            <img [src]="profile()!.profile.avatar" class="w-16 h-16 rounded-full" />
            <div>
              <h2 class="text-xl font-semibold dark:text-white">{{ profile()!.profile.name }}</h2>
              <p class="text-gray-500 dark:text-gray-400">
                {{ profile()!.gameCount }} games · {{ profile()!.totalPlaytimeHours }}h played
              </p>
            </div>
          </div>
          <div class="flex gap-4">
            <button
              (click)="reset()"
              class="flex-1 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Back
            </button>
            <button
              (click)="startImport()"
              class="flex-1 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
            >
              Import Games
            </button>
          </div>
        </div>
      }

      <!-- Step 2.5: Import Progress -->
      @if (importing()) {
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h2 class="text-xl font-semibold mb-4 dark:text-white">Importing Games...</h2>

          <!-- Progress bar -->
          <div class="mb-4">
            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>{{ progress()?.current || 0 }} of {{ progress()?.total || 0 }}</span>
              <span>{{ progressPercent() }}%</span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 transition-all duration-300"
                [style.width.%]="progressPercent()"
              ></div>
            </div>
          </div>

          <!-- Current game -->
          @if (progress()?.gameName) {
            <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              @if (progress()?.status === 'processing') {
                <div
                  class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                ></div>
              } @else if (progress()?.status === 'imported') {
                <span class="text-green-500">✓</span>
              } @else if (progress()?.status === 'skipped') {
                <span class="text-yellow-500">○</span>
              } @else {
                <span class="text-red-500">✗</span>
              }
              <span class="truncate dark:text-white">{{ progress()?.gameName }}</span>
            </div>
          }

          <!-- Stats so far -->
          <div class="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
            <div>
              <div class="font-semibold text-green-600 dark:text-green-400">{{ importedCount() }}</div>
              <div class="text-gray-500 dark:text-gray-400">Imported</div>
            </div>
            <div>
              <div class="font-semibold text-yellow-600 dark:text-yellow-400">{{ skippedCount() }}</div>
              <div class="text-gray-500 dark:text-gray-400">Skipped</div>
            </div>
            <div>
              <div class="font-semibold text-red-600 dark:text-red-400">{{ failedCount() }}</div>
              <div class="text-gray-500 dark:text-gray-400">Failed</div>
            </div>
          </div>
        </div>
      }

      <!-- Step 3: Import Results -->
      @if (importResult()) {
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h2 class="text-xl font-semibold mb-4 dark:text-white">Import Complete!</h2>
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ importResult()!.imported }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Imported</div>
            </div>
            <div class="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ importResult()!.skipped }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Skipped</div>
            </div>
            <div class="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ importResult()!.failed }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
          </div>

          <div class="max-h-64 overflow-y-auto mb-6 border dark:border-gray-700 rounded-lg">
            @for (game of importResult()!.games; track game.name) {
              <div class="flex justify-between items-center px-4 py-2 border-b dark:border-gray-700 last:border-b-0">
                <span class="truncate dark:text-white">{{ game.name }}</span>
                <span
                  class="text-sm px-2 py-1 rounded"
                  [class]="
                    game.status === 'imported'
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                      : game.status === 'skipped'
                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                  "
                >
                  {{ game.status }}
                </span>
              </div>
            }
          </div>

          <button
            (click)="goToLibrary()"
            class="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
          >
            View Library
          </button>
        </div>
      }

      <!-- Sync Steam Achievements -->
      @if (!importing()) {
        <div class="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h3 class="font-medium dark:text-white mb-2">🏆 Sync Steam Achievements</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Sync achievements for all your Steam games. Games with 100% achievements will be marked as completed.
          </p>
          <button
            (click)="syncAllAchievements()"
            [disabled]="syncing()"
            class="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            {{ syncing() ? 'Syncing achievements...' : '🔄 Sync All Achievements' }}
          </button>
          @if (syncResult()) {
            <p class="mt-2 text-sm text-green-600 dark:text-green-400">
              ✓ Synced {{ syncResult()!.synced }} games, {{ syncResult()!.completed }} auto-completed
              @if (syncResult()!.failed > 0) {
                <span class="text-yellow-600 dark:text-yellow-400">({{ syncResult()!.failed }} failed)</span>
              }
            </p>
          }
          @if (syncError()) {
            <p class="mt-2 text-sm text-red-600 dark:text-red-400">
              ✗ {{ syncError() }}
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class ImportContainer {
  private router = inject(Router);
  private http = inject(HttpClient);

  // Use client libs
  profileMutation = injectSteamProfileMutation();
  importMutation = injectSteamImportMutation();

  steamInput = '';
  importing = signal(false);
  error = signal<string | null>(null);
  importResult = signal<ImportResult | null>(null);
  progress = signal<ImportProgress | null>(null);

  // Sync state
  syncing = signal(false);
  syncResult = signal<{ synced: number; failed: number; completed: number } | null>(null);
  syncError = signal<string | null>(null);

  // Derived state from mutation
  loading = computed(() => this.profileMutation.isPending());
  profile = computed(() => this.profileMutation.data() ?? null);

  // Live counters
  importedCount = signal(0);
  skippedCount = signal(0);
  failedCount = signal(0);

  // Warn user before leaving during import
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.importing()) {
      event.preventDefault();
      event.returnValue = 'Import is in progress. Are you sure you want to leave?';
    }
  }

  // Check if user can leave (used by route guard)
  canDeactivate(): boolean {
    if (this.importing()) {
      return confirm(
        'Import is in progress. If you leave, you will lose visibility of the progress (but the import will continue in the background). Leave anyway?',
      );
    }
    return true;
  }

  progressPercent(): number {
    const p = this.progress();
    if (!p || p.total === 0) return 0;
    return Math.round((p.current / p.total) * 100);
  }

  lookupProfile() {
    this.error.set(null);
    this.profileMutation.mutate(this.steamInput, {
      onError: (err: any) => {
        this.error.set(err.error?.error?.message || 'Could not find Steam profile');
      },
    });
  }

  startImport() {
    this.importing.set(true);
    this.importedCount.set(0);
    this.skippedCount.set(0);
    this.failedCount.set(0);

    this.importMutation.mutate(this.steamInput, {
      onProgress: (progress) => {
        this.progress.set(progress);

        // Update counters based on status
        if (progress.status === 'imported') {
          this.importedCount.update((c) => c + 1);
        } else if (progress.status === 'skipped') {
          this.skippedCount.update((c) => c + 1);
        } else if (progress.status === 'failed') {
          this.failedCount.update((c) => c + 1);
        }
      },
      onSuccess: (result) => {
        this.importResult.set(result);
        this.importing.set(false);
      },
      onError: (err) => {
        this.error.set(err.message || 'Import failed');
        this.importing.set(false);
      },
    });
  }

  reset() {
    this.profileMutation.reset();
    this.error.set(null);
  }

  goToLibrary() {
    this.router.navigate(['/library']);
  }

  syncAllAchievements() {
    this.syncing.set(true);
    this.syncResult.set(null);
    this.syncError.set(null);

    // First backfill Steam App IDs, then sync achievements
    this.http.post<{ data: { updated: number; total: number } }>('/api/v1/steam/backfill-app-ids', {}).subscribe({
      next: () => {
        // Now sync all achievements
        this.http.post<{ data: { synced: number; failed: number; completed: number } }>('/api/v1/steam/achievements/sync-all', {}).subscribe({
          next: (res) => {
            this.syncResult.set(res.data);
            this.syncing.set(false);
          },
          error: (err) => {
            this.syncError.set(err?.error?.error?.message || 'Failed to sync achievements');
            this.syncing.set(false);
          },
        });
      },
      error: (err) => {
        this.syncError.set(err?.error?.error?.message || 'Failed to backfill Steam App IDs');
        this.syncing.set(false);
      },
    });
  }
}
