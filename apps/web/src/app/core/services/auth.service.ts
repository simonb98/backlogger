import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models';

const TOKEN_KEY = 'backlogger-token';
const USER_KEY = 'backlogger-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private currentUser = signal<User | null>(null);
  private accessToken = signal<string | null>(null);

  user = this.currentUser.asReadonly();
  token = this.accessToken.asReadonly();
  isAuthenticated = computed(() => this.accessToken() !== null);

  constructor() {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.accessToken.set(token);
        this.currentUser.set(user);
      } catch {
        this.clearAuth();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<{ success: boolean; data: AuthResponse }>('/api/v1/auth/login', credentials).pipe(
      tap(response => this.handleAuthSuccess(response.data)),
      map(response => response.data),
      catchError(error => {
        return throwError(() => error);
      }),
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<{ success: boolean; data: AuthResponse }>('/api/v1/auth/register', data).pipe(
      tap(response => this.handleAuthSuccess(response.data)),
      map(response => response.data),
      catchError(error => {
        return throwError(() => error);
      }),
    );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.accessToken();
  }

  private handleAuthSuccess(response: AuthResponse): void {
    this.accessToken.set(response.accessToken);
    this.currentUser.set(response.user);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(TOKEN_KEY, response.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    }
  }

  private clearAuth(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }
}

