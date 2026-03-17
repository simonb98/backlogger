// Query keys
export {
  IGDB_SEARCH_QUERY_KEY,
  IGDB_POPULAR_QUERY_KEY,
  IGDB_GAME_QUERY_KEY,
} from './igdb.queries';

// Queries
export {
  injectIgdbSearchQuery,
  injectIgdbPopularQuery,
  injectIgdbGameQuery,
} from './igdb.queries';

// Re-export types
export type { IgdbSearchResult, IgdbPlatformInfo } from '../../core/models';
export type { IgdbGameDetails } from '../../core/services/igdb.service';

