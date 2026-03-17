export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface GameFilterParams {
  status?: string;
  platform?: number;
  genre?: string;
  tag?: number;
  minRating?: number;
  maxRating?: number;
  search?: string;
  sortBy?: 'name' | 'date_added' | 'rating' | 'playtime' | 'release_date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AddGameDto {
  igdbId: number;
  platformId: number;
  status?: string;
  rating?: number;
  notes?: string;
}

export interface UpdateGameDto {
  status?: string;
  rating?: number | null;
  notes?: string;
  review?: string;
  completionPercent?: number;
  dateStarted?: string;
  dateCompleted?: string;
  platformId?: number;
}

export interface CreateSessionDto {
  sessionDate: string;
  durationMins: number;
  notes?: string;
}

export interface UpdateSessionDto {
  sessionDate?: string;
  durationMins?: number;
  notes?: string;
}

