import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UserGame, GameFilterParams, AddGameDto, UpdateGameDto, ApiResponse, PaginationMeta } from '../models';

export interface PaginatedGames {
  items: UserGame[];
  meta: PaginationMeta;
}

@Injectable({
  providedIn: 'root',
})
export class GamesService {
  private api = inject(ApiService);

  getGames(filters?: GameFilterParams): Observable<ApiResponse<UserGame[]>> {
    return this.api.getWithMeta<UserGame[]>('/games', filters);
  }

  getGame(id: number): Observable<UserGame> {
    return this.api.get<UserGame>(`/games/${id}`);
  }

  addGame(dto: AddGameDto): Observable<UserGame> {
    return this.api.post<UserGame>('/games', dto);
  }

  updateGame(id: number, dto: UpdateGameDto): Observable<UserGame> {
    return this.api.patch<UserGame>(`/games/${id}`, dto);
  }

  bulkUpdateGames(ids: number[], updates: UpdateGameDto): Observable<{ updated: number }> {
    return this.api.patch<{ updated: number }>('/games', { ids, updates });
  }

  deleteGame(id: number): Observable<void> {
    return this.api.delete<void>(`/games/${id}`);
  }
}

