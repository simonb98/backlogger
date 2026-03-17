import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Platform } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PlatformsService {
  private api = inject(ApiService);
  
  private _platforms = signal<Platform[]>([]);
  readonly platforms = this._platforms.asReadonly();

  getPlatforms(): Observable<Platform[]> {
    return this.api.get<Platform[]>('/platforms').pipe(
      tap((platforms) => this._platforms.set(platforms))
    );
  }

  loadPlatforms(): void {
    this.getPlatforms().subscribe();
  }
}

