import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-steam-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="text-center">
        @if (error) {
          <div class="text-red-500 dark:text-red-400">
            <h1 class="text-2xl font-bold mb-2">Authentication Failed</h1>
            <p>{{ error }}</p>
            <a href="/login" class="text-blue-500 hover:underline mt-4 inline-block">
              Back to Login
            </a>
          </div>
        } @else {
          <div class="text-gray-500 dark:text-gray-400">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Completing Steam login...</p>
          </div>
        }
      </div>
    </div>
  `,
})
export default class SteamCallbackComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  error: string | null = null;

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    const errorParam = this.route.snapshot.queryParamMap.get('error');

    if (errorParam) {
      this.error = 'Steam authentication failed. Please try again.';
      return;
    }

    if (token) {
      // Store the token and load user info
      this.authService.handleSteamCallback(token).subscribe({
        next: () => {
          this.router.navigate(['/library']);
        },
        error: () => {
          this.error = 'Failed to complete authentication';
        },
      });
    } else {
      this.error = 'No authentication token received';
    }
  }
}

