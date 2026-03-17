import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { GAME_STATUS_COLORS, GAME_STATUS_LABELS, GameStatus } from '../../../libs/client-games-api';

@Component({
  selector: 'app-status-filter',
  imports: [CommonModule],
  template: `
    <div class="flex flex-wrap gap-2 items-center">
      @if (showLabel()) {
        <span class="text-sm text-gray-500 mr-2">Status:</span>
      }
      <button
        class="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
        [class]="selectedStatus() === null ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'"
        (click)="selectStatus(null)">
        All
      </button>
      @for (status of statuses; track status) {
        <button
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
          [class]="selectedStatus() === status ? 'text-white' : 'bg-gray-100 hover:bg-gray-200'"
          [style.backgroundColor]="selectedStatus() === status ? statusColors[status] : ''"
          (click)="selectStatus(status)">
          {{ statusLabels[status] }}
        </button>
      }
    </div>
  `,
})
export class StatusFilterComponent {
  selectedStatus = input<GameStatus | null>(null);
  showLabel = input(true);

  statusChange = output<GameStatus | null>();

  readonly statuses: GameStatus[] = ['playing', 'up_next', 'backlog', 'completed', 'on_hold', 'dropped', 'wishlist'];
  readonly statusLabels = GAME_STATUS_LABELS;
  readonly statusColors = GAME_STATUS_COLORS;

  selectStatus(status: GameStatus | null) {
    this.statusChange.emit(status);
  }
}

