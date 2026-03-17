import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

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

export interface ImportProgress {
  current: number;
  total: number;
  gameName: string;
  status: 'imported' | 'skipped' | 'failed' | 'processing';
  reason?: string;
  done: boolean;
  result?: ImportResult;
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

  importGamesWithProgress(steamId: string): Observable<ImportProgress> {
    const subject = new Subject<ImportProgress>();

    const eventSource = new EventSource(
      `${environment.apiUrl}/steam/import-stream?steamId=${encodeURIComponent(steamId)}`
    );

    eventSource.addEventListener('progress', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as ImportProgress;
        subject.next(data);

        if (data.done) {
          eventSource.close();
          subject.complete();
        }
      } catch (e) {
        console.error('Failed to parse progress event', e);
      }
    });

    eventSource.addEventListener('error', (event) => {
      try {
        const messageEvent = event as MessageEvent;
        if (messageEvent.data) {
          const data = JSON.parse(messageEvent.data);
          subject.error(new Error(data.message || 'Import failed'));
        } else {
          subject.error(new Error('Import failed'));
        }
      } catch {
        subject.error(new Error('Import failed'));
      }
      eventSource.close();
    });

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        return; // Already handled
      }
      subject.error(new Error('Connection lost'));
      eventSource.close();
    };

    return subject.asObservable();
  }
}

