export type GameStatus = 'backlog' | 'up_next' | 'playing' | 'completed' | 'finished' | 'dropped' | 'wishlist' | 'on_hold';

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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
  // Joined data
  game?: Game;
  platform?: Platform;
  tags?: CustomTag[];
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

export interface PlaySession {
  id: number;
  userGameId: number;
  sessionDate: string;
  durationMins: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

