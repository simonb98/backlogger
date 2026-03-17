import { inject, signal } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom, Subscription } from 'rxjs';
import { SteamService, ImportProgress, ImportResult } from '../../core/services/steam.service';
import { GAMES_QUERY_KEY } from '../client-games-api';

export const STEAM_PROFILE_QUERY_KEY = 'steam-profile';

/**
 * Query for fetching Steam profile info
 */
export function injectSteamProfileQuery(getSteamId: () => string | null) {
  const steamService = inject(SteamService);

  return injectQuery(() => ({
    queryKey: [STEAM_PROFILE_QUERY_KEY, getSteamId()],
    queryFn: () => lastValueFrom(steamService.getProfile(getSteamId()!)),
    enabled: !!getSteamId(),
  }));
}

/**
 * Mutation for looking up Steam profile
 */
export function injectSteamProfileMutation() {
  const steamService = inject(SteamService);

  return injectMutation(() => ({
    mutationFn: (steamId: string) => lastValueFrom(steamService.getProfile(steamId)),
  }));
}

/**
 * Mutation for importing games from Steam with progress
 * Returns an object with mutate function and progress tracking
 */
export function injectSteamImportMutation() {
  const steamService = inject(SteamService);
  const queryClient = inject(QueryClient);

  let subscription: Subscription | null = null;
  const isPending = signal(false);
  const data = signal<ImportResult | null>(null);
  const error = signal<Error | null>(null);

  const mutate = (
    steamId: string,
    options?: {
      onProgress?: (progress: ImportProgress) => void;
      onSuccess?: (result: ImportResult) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    // Cancel any existing subscription
    subscription?.unsubscribe();

    isPending.set(true);
    error.set(null);
    data.set(null);

    subscription = steamService.importGamesWithProgress(steamId).subscribe({
      next: (progress) => {
        options?.onProgress?.(progress);

        if (progress.done && progress.result) {
          data.set(progress.result);
          isPending.set(false);
          queryClient.invalidateQueries({ queryKey: [GAMES_QUERY_KEY] });
          options?.onSuccess?.(progress.result);
        }
      },
      error: (err) => {
        error.set(err);
        isPending.set(false);
        options?.onError?.(err);
      },
    });
  };

  const cancel = () => {
    subscription?.unsubscribe();
    subscription = null;
    isPending.set(false);
  };

  return {
    mutate,
    cancel,
    isPending: () => isPending(),
    data: () => data(),
    error: () => error(),
  };
}

