import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { GameFilterParams, GameStatus, UpdateGameDto } from '../../core/models';
import { GamesService } from '../../core/services/games.service';

export const GAMES_QUERY_KEY = 'games';
export const GAME_DETAIL_QUERY_KEY = 'game-detail';

/**
 * Query for fetching paginated games list with filters
 */
export function injectGamesQuery(getFilters: () => GameFilterParams) {
  const gamesService = inject(GamesService);

  return injectQuery(() => ({
    queryKey: [GAMES_QUERY_KEY, getFilters()],
    queryFn: async () => {
      const filters = getFilters();
      const limit = filters.limit ?? 50;

      // Handle "All" option - fetch all pages
      if (limit === 0) {
        return fetchAllGames(gamesService, filters);
      }

      const response = await lastValueFrom(gamesService.getGames(filters));
      return {
        games: response.data || [],
        total: response.meta?.total || response.data?.length || 0,
        totalPages: response.meta?.totalPages || 1,
      };
    },
  }));
}

async function fetchAllGames(gamesService: GamesService, baseFilters: GameFilterParams) {
  const allGames: any[] = [];
  let page = 1;
  let totalPages = 1;
  let total = 0;

  do {
    const filters: GameFilterParams = {
      ...baseFilters,
      limit: 100,
      page,
    };

    const response = await lastValueFrom(gamesService.getGames(filters));
    allGames.push(...(response.data || []));
    totalPages = response.meta?.totalPages || 1;
    total = response.meta?.total || allGames.length;
    page++;
  } while (page <= totalPages);

  return { games: allGames, total, totalPages: 1 };
}

/**
 * Query for fetching a single game by ID
 */
export function injectGameQuery(getId: () => number | null) {
  const gamesService = inject(GamesService);

  return injectQuery(() => ({
    queryKey: [GAME_DETAIL_QUERY_KEY, getId()],
    queryFn: () => lastValueFrom(gamesService.getGame(getId()!)),
    enabled: getId() !== null,
  }));
}

/**
 * Mutation for adding a new game
 */
export function injectAddGameMutation(options?: {
  onSuccess?: (igdbId: number) => void;
  onError?: (error: Error) => void;
}) {
  const gamesService = inject(GamesService);
  const queryClient = inject(QueryClient);

  return injectMutation(() => ({
    mutationFn: (data: { igdbId: number; platformId: number; status: 'backlog' | 'wishlist' }) =>
      lastValueFrom(gamesService.addGame(data)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: [GAMES_QUERY_KEY] });
      options?.onSuccess?.(variables.igdbId);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  }));
}

/**
 * Mutation for updating a game
 */
export function injectUpdateGameMutation() {
  const gamesService = inject(GamesService);
  const queryClient = inject(QueryClient);

  return injectMutation(() => ({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateGameDto }) =>
      lastValueFrom(gamesService.updateGame(id, updates)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: [GAMES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [GAME_DETAIL_QUERY_KEY, variables.id] });
    },
  }));
}

/**
 * Mutation for bulk updating games
 */
export function injectBulkUpdateGamesMutation(options?: { onSuccess?: () => void }) {
  const gamesService = inject(GamesService);
  const queryClient = inject(QueryClient);

  return injectMutation(() => ({
    mutationFn: ({ ids, updates }: { ids: number[]; updates: { status: GameStatus } }) =>
      lastValueFrom(gamesService.bulkUpdateGames(ids, updates)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GAMES_QUERY_KEY] });
      options?.onSuccess?.();
    },
  }));
}

/**
 * Mutation for deleting a game
 */
export function injectDeleteGameMutation() {
  const gamesService = inject(GamesService);
  const queryClient = inject(QueryClient);

  return injectMutation(() => ({
    mutationFn: (id: number) => lastValueFrom(gamesService.deleteGame(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GAMES_QUERY_KEY] });
    },
  }));
}

