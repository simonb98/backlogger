import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SteamProfile {
  steamId: string;
  name: string;
  avatar: string;
  profileUrl: string;
}

export interface SteamProfileInfo {
  profile: SteamProfile;
  gameCount: number;
  totalPlaytimeHours: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  games: {
    name: string;
    status: 'imported' | 'skipped' | 'failed';
    reason?: string;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class SteamService {
  private api = inject(ApiService);

  getProfile(steamId: string): Observable<SteamProfileInfo> {
    return this.api.get<SteamProfileInfo>('/steam/profile', { steamId });
  }

  importGames(steamId: string): Observable<ImportResult> {
    return this.api.post<ImportResult>('/steam/import', { steamId });
  }
}

