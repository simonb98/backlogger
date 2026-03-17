import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold dark:text-white">🎮 Backlogger</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-2">Sign in to your account</p>
        </div>

        <form
          (ngSubmit)="onSubmit()"
          class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm"
        >
          @if (error()) {
            <div class="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {{ error() }}
            </div>
          }

          <div class="mb-4">
            <label class="block font-medium mb-2 dark:text-gray-300">Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div class="mb-6">
            <label class="block font-medium mb-2 dark:text-gray-300">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200 dark:border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or</span>
            </div>
          </div>

          <a
            [href]="steamLoginUrl"
            class="w-full py-3 bg-[#1b2838] text-white font-semibold rounded-lg hover:bg-[#2a475e] flex items-center justify-center gap-3 no-underline"
          >
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.15 9.42 7.6 11.18l3.69-5.27c-.22-.05-.44-.08-.67-.08-2.35 0-4.27 1.92-4.27 4.27 0 .23.02.45.05.67L.86 18.33C2.44 21.26 5.97 23.15 10 23.15c5.52 0 10-4.48 10-10 0-5.52-4.48-10-10-10zm-.62 15.77c-2.07 0-3.75-1.68-3.75-3.75s1.68-3.75 3.75-3.75c.87 0 1.67.3 2.31.8l-1.18 1.68c-.34-.22-.75-.35-1.18-.35-.97 0-1.75.78-1.75 1.75s.78 1.75 1.75 1.75c.43 0 .82-.16 1.12-.41l1.15 1.65c-.61.4-1.34.63-2.12.63h-.1z"/>
            </svg>
            Sign in with Steam
          </a>

          <p class="mt-6 text-center text-gray-500 dark:text-gray-400">
            Don't have an account?
            <a routerLink="/register" class="text-blue-500 hover:underline">Create one</a>
          </p>
        </form>
      </div>
    </div>
  `,
})
export default class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  steamLoginUrl = this.authService.getSteamLoginUrl();

  onSubmit() {
    if (!this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/library']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid email or password');
      },
    });
  }
}

