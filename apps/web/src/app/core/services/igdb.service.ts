import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { IgdbSearchResult } from '../models';

export interface IgdbGameDetails {
  id: number;
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
  platforms?: { id: number; name: string; abbreviation?: string }[];
  rating?: number;
  ratingCount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class IgdbService {
  private api = inject(ApiService);

  search(query: string, limit: number = 20): Observable<IgdbSearchResult[]> {
    return this.api.get<IgdbSearchResult[]>('/igdb/search', { q: query, limit });
  }

  getPopular(limit: number = 20): Observable<IgdbSearchResult[]> {
    return this.api.get<IgdbSearchResult[]>('/igdb/popular', { limit });
  }

  getGame(igdbId: number): Observable<IgdbGameDetails> {
    return this.api.get<IgdbGameDetails>(`/igdb/game/${igdbId}`);
  }
}

