import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { SteamService } from '../../core/services/steam.service';
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
 * Mutation for importing games from Steam (sync version)
 */
export function injectSteamImportMutation() {
  const steamService = inject(SteamService);
  const queryClient = inject(QueryClient);

  return injectMutation(() => ({
    mutationFn: (steamId: string) => lastValueFrom(steamService.importGames(steamId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GAMES_QUERY_KEY] });
    },
  }));
}

// Note: The streaming import (importGamesWithProgress) uses SSE and is better
// handled directly with the SteamService since it's not a traditional query/mutation pattern.
// Components should use SteamService.importGamesWithProgress() directly for that.

