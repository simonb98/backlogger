import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SteamService, SteamProfileInfo, ImportResult } from '../../core/services';

@Component({
  selector: 'app-import-container',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-2">Import from Steam</h1>
      <p class="text-gray-500 mb-8">Import your Steam library to quickly add games</p>

      <!-- Step 1: Enter Steam ID -->
      @if (!profile() && !importResult()) {
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <label class="block font-medium mb-2">Steam Profile URL or ID</label>
          <input
            type="text"
            [(ngModel)]="steamInput"
            placeholder="https://steamcommunity.com/id/yourname"
            class="w-full p-4 border-2 border-gray-200 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
          />
          <p class="text-sm text-gray-500 mb-4">
            Paste your Steam profile URL, Steam ID, or vanity name.<br>
            Make sure your Steam profile and game library are set to <strong>public</strong>.
          </p>
          <button
            (click)="lookupProfile()"
            [disabled]="loading() || !steamInput"
            class="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50">
            {{ loading() ? 'Looking up...' : 'Find Profile' }}
          </button>
          @if (error()) {
            <p class="mt-4 text-red-600 text-center">{{ error() }}</p>
          }
        </div>
      }

      <!-- Step 2: Confirm Profile -->
      @if (profile() && !importResult()) {
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <div class="flex items-center gap-4 mb-6">
            <img [src]="profile()!.profile.avatar" class="w-16 h-16 rounded-full" />
            <div>
              <h2 class="text-xl font-semibold">{{ profile()!.profile.name }}</h2>
              <p class="text-gray-500">{{ profile()!.gameCount }} games · {{ profile()!.totalPlaytimeHours }}h played</p>
            </div>
          </div>
          <div class="flex gap-4">
            <button
              (click)="reset()"
              class="flex-1 py-3 bg-gray-100 rounded-lg font-medium hover:bg-gray-200">
              Back
            </button>
            <button
              (click)="startImport()"
              [disabled]="importing()"
              class="flex-1 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50">
              {{ importing() ? 'Importing...' : 'Import Games' }}
            </button>
          </div>
          @if (importing()) {
            <p class="mt-4 text-center text-gray-500">This may take a few minutes...</p>
          }
        </div>
      }

      <!-- Step 3: Import Results -->
      @if (importResult()) {
        <div class="bg-white p-6 rounded-xl shadow-sm">
          <h2 class="text-xl font-semibold mb-4">Import Complete!</h2>
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">{{ importResult()!.imported }}</div>
              <div class="text-sm text-gray-600">Imported</div>
            </div>
            <div class="text-center p-4 bg-yellow-50 rounded-lg">
              <div class="text-2xl font-bold text-yellow-600">{{ importResult()!.skipped }}</div>
              <div class="text-sm text-gray-600">Skipped</div>
            </div>
            <div class="text-center p-4 bg-red-50 rounded-lg">
              <div class="text-2xl font-bold text-red-600">{{ importResult()!.failed }}</div>
              <div class="text-sm text-gray-600">Failed</div>
            </div>
          </div>

          <div class="max-h-64 overflow-y-auto mb-6 border rounded-lg">
            @for (game of importResult()!.games; track game.name) {
              <div class="flex justify-between items-center px-4 py-2 border-b last:border-b-0">
                <span class="truncate">{{ game.name }}</span>
                <span class="text-sm px-2 py-1 rounded"
                  [class]="game.status === 'imported' ? 'bg-green-100 text-green-700' : 
                           game.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'">
                  {{ game.status }}
                </span>
              </div>
            }
          </div>

          <button
            (click)="goToLibrary()"
            class="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">
            View Library
          </button>
        </div>
      }
    </div>
  `,
})
export class ImportContainer {
  private steamService = inject(SteamService);
  private router = inject(Router);

  steamInput = '';
  loading = signal(false);
  importing = signal(false);
  error = signal<string | null>(null);
  profile = signal<SteamProfileInfo | null>(null);
  importResult = signal<ImportResult | null>(null);

  lookupProfile() {
    this.loading.set(true);
    this.error.set(null);

    this.steamService.getProfile(this.steamInput).subscribe({
      next: (info) => {
        this.profile.set(info);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error?.message || 'Could not find Steam profile');
        this.loading.set(false);
      },
    });
  }

  startImport() {
    this.importing.set(true);

    this.steamService.importGames(this.steamInput).subscribe({
      next: (result) => {
        this.importResult.set(result);
        this.importing.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error?.message || 'Import failed');
        this.importing.set(false);
      },
    });
  }

  reset() {
    this.profile.set(null);
    this.error.set(null);
  }

  goToLibrary() {
    this.router.navigate(['/library']);
  }
}

