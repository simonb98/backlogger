// Query keys
export { GAMES_QUERY_KEY, GAME_DETAIL_QUERY_KEY } from './games.queries';

// Queries
export { injectGamesQuery, injectGameQuery } from './games.queries';

// Mutations
export {
  injectAddGameMutation,
  injectUpdateGameMutation,
  injectBulkUpdateGamesMutation,
  injectDeleteGameMutation,
} from './games.queries';

// Re-export types from models
export type {
  UserGame,
  Game,
  GameStatus,
  GameFilterParams,
  UpdateGameDto,
  AddGameDto,
} from '../../core/models';

export { GAME_STATUS_LABELS, GAME_STATUS_COLORS } from '../../core/models';

