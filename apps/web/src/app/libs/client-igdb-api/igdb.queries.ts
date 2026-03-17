import { inject, Signal } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { IgdbService } from '../../core/services/igdb.service';

export const IGDB_SEARCH_QUERY_KEY = 'igdb-search';
export const IGDB_POPULAR_QUERY_KEY = 'igdb-popular';
export const IGDB_GAME_QUERY_KEY = 'igdb-game';

/**
 * Query for searching games on IGDB
 */
export function injectIgdbSearchQuery(getQuery: () => string, options?: { enabled?: () => boolean }) {
  const igdbService = inject(IgdbService);

  return injectQuery(() => ({
    queryKey: [IGDB_SEARCH_QUERY_KEY, getQuery()],
    queryFn: () => lastValueFrom(igdbService.search(getQuery())),
    enabled: options?.enabled?.() ?? getQuery().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  }));
}

/**
 * Query for fetching popular/trending games from IGDB
 */
export function injectIgdbPopularQuery(limit: number = 20) {
  const igdbService = inject(IgdbService);

  return injectQuery(() => ({
    queryKey: [IGDB_POPULAR_QUERY_KEY, limit],
    queryFn: () => lastValueFrom(igdbService.getPopular(limit)),
    staleTime: 1000 * 60 * 10, // 10 minutes - popular games don't change often
  }));
}

/**
 * Query for fetching detailed game info from IGDB
 */
export function injectIgdbGameQuery(getIgdbId: () => number | null) {
  const igdbService = inject(IgdbService);

  return injectQuery(() => ({
    queryKey: [IGDB_GAME_QUERY_KEY, getIgdbId()],
    queryFn: () => lastValueFrom(igdbService.getGame(getIgdbId()!)),
    enabled: getIgdbId() !== null,
    staleTime: 1000 * 60 * 30, // 30 minutes - game details rarely change
  }));
}

