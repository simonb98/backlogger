export type GameStatus = 'backlog' | 'playing' | 'completed' | 'dropped' | 'wishlist' | 'on_hold';

export interface Game {
  id: number;
  igdbId: number;
  name: string;
  slug?: string;
  summary?: string;
  storyline?: string;
  coverUrl?: string;
  screenshotUrls?: string[];
  releaseDate?: string;
  genres?: string[];
  themes?: string[];
  gameModes?: string[];
  developer?: string;
  publisher?: string;
  igdbRating?: number;
  igdbRatingCount?: number;
}

export interface Platform {
  id: number;
  igdbId?: number;
  name: string;
  slug?: string;
  abbreviation?: string;
  category?: string;
}

export interface CustomTag {
  id: number;
  name: string;
  color?: string;
}

export interface UserGame {
  id: number;
  gameId: number;
  platformId: number;
  status: GameStatus;
  rating?: number;
  notes?: string;
  review?: string;
  completionPercent: number;
  totalPlaytimeMins: number;
  dateAdded: string;
  dateStarted?: string;
  dateCompleted?: string;
  game?: Game;
  platform?: Platform;
  tags?: CustomTag[];
}

export interface PlaySession {
  id: number;
  userGameId: number;
  sessionDate: string;
  durationMins: number;
  notes?: string;
}

export interface IgdbSearchResult {
  id: number;
  name: string;
  slug?: string;
  coverUrl?: string;
  releaseYear?: number;
  platforms?: string[];
  rating?: number;
}

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  backlog: 'Backlog',
  playing: 'Playing',
  completed: 'Completed',
  dropped: 'Dropped',
  wishlist: 'Wishlist',
  on_hold: 'On Hold',
};

export const GAME_STATUS_COLORS: Record<GameStatus, string> = {
  backlog: '#6b7280',
  playing: '#3b82f6',
  completed: '#22c55e',
  dropped: '#ef4444',
  wishlist: '#a855f7',
  on_hold: '#f59e0b',
};

