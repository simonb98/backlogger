import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GAME_STATUS_COLORS, GAME_STATUS_LABELS, GameStatus } from '../../../libs/client-games-api';

export interface GameCardData {
  id: number;
  name: string;
  coverUrl?: string | null;
  status: GameStatus;
  rating?: number | null;
  playtimeMins?: number;
  platformAbbreviations?: string[];
  isFullyCompleted?: boolean;
}

@Component({
  selector: 'app-game-card',
  imports: [CommonModule, RouterLink],
  template: `
    <div
      class="relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
      [class.ring-2]="selected()"
      [class.ring-blue-500]="selected()"
      [class.cursor-pointer]="selectable()"
      (click)="handleClick($event)">

      @if (selectable()) {
        <div class="absolute top-2 left-2 z-10">
          <div class="w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer"
               [class]="selected() ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300'">
            @if (selected()) {
              <span class="text-sm">✓</span>
            }
          </div>
        </div>
      }

      <a [routerLink]="selectable() ? null : ['/games', game().id]"
         [class.pointer-events-none]="selectable()"
         class="block no-underline text-inherit">
        <div class="relative aspect-[3/4] bg-gray-100">
          @if (game().coverUrl) {
            <img [src]="game().coverUrl" [alt]="game().name" class="w-full h-full object-cover" />
          } @else {
            <div class="flex items-center justify-center h-full text-gray-400 text-sm">No Image</div>
          }
          @if (game().isFullyCompleted) {
            <span class="absolute top-2 right-2 text-2xl" title="100% Completed">🏆</span>
          } @else {
            <span class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold text-white uppercase"
                  [style.backgroundColor]="statusColors[game().status]">
              {{ statusLabels[game().status] }}
            </span>
          }
        </div>
        <div class="p-3">
          <h3 class="font-semibold text-sm line-clamp-2 mb-1">{{ game().name }}</h3>
          @if (game().platformAbbreviations?.length) {
            <div class="flex flex-wrap gap-1 mb-1">
              @for (abbr of game().platformAbbreviations; track abbr) {
                <span class="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-600">
                  {{ abbr }}
                </span>
              }
            </div>
          }
          <div class="flex gap-2 text-xs text-gray-500">
            @if (game().rating) {
              <span>⭐ {{ game().rating }}</span>
            }
            @if (game().playtimeMins) {
              <span>🕐 {{ formatPlaytime(game().playtimeMins ?? 0) }}</span>
            }
          </div>
        </div>
      </a>
    </div>
  `,
})
export class GameCardComponent {
  game = input.required<GameCardData>();
  selectable = input(false);
  selected = input(false);

  cardClick = output<MouseEvent>();

  readonly statusLabels = GAME_STATUS_LABELS;
  readonly statusColors = GAME_STATUS_COLORS;

  handleClick(event: MouseEvent) {
    if (this.selectable()) {
      this.cardClick.emit(event);
    }
  }

  formatPlaytime(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
}

