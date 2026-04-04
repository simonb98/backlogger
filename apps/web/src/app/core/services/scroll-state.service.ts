import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollStateService {
  private positions: Record<string, number> = {};

  setScrollPosition(path: string, position: number) {
    this.positions[path] = position;
  }

  getScrollPosition(path: string): number {
    return this.positions[path] || 0;
  }
}
