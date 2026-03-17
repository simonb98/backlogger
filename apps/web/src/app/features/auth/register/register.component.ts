import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold dark:text-white">🎮 Backlogger</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-2">Create your account</p>
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
            <label class="block font-medium mb-2 dark:text-gray-300">Display Name (optional)</label>
            <input
              type="text"
              [(ngModel)]="displayName"
              name="displayName"
              class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="Your name"
            />
          </div>

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

          <div class="mb-4">
            <label class="block font-medium mb-2 dark:text-gray-300">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              minlength="8"
              class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div class="mb-6">
            <label class="block font-medium mb-2 dark:text-gray-300">Confirm Password</label>
            <input
              type="password"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
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
            {{ loading() ? 'Creating account...' : 'Create Account' }}
          </button>

          <p class="mt-6 text-center text-gray-500 dark:text-gray-400">
            Already have an account?
            <a routerLink="/login" class="text-blue-500 hover:underline">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  `,
})
export default class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal<string | null>(null);

  onSubmit() {
    if (!this.email || !this.password) {
      this.error.set('Please fill in all required fields');
      return;
    }

    if (this.password.length < 8) {
      this.error.set('Password must be at least 8 characters');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.register({
      email: this.email,
      password: this.password,
      displayName: this.displayName || undefined,
    }).subscribe({
      next: () => {
        this.router.navigate(['/library']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed');
      },
    });
  }
}

