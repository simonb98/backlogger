import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { GAME_STATUS_COLORS, GAME_STATUS_LABELS, GameStatus } from '../../../libs/client-games-api';

@Component({
  selector: 'app-status-badge',
  imports: [CommonModule],
  template: `
    <span
      class="px-2 py-0.5 rounded text-xs font-semibold text-white uppercase"
      [class]="size() === 'sm' ? 'text-[10px] px-1.5' : 'text-xs px-2 py-1'"
      [style.backgroundColor]="statusColors[status()]">
      {{ statusLabels[status()] }}
    </span>
  `,
})
export class StatusBadgeComponent {
  status = input.required<GameStatus>();
  size = input<'sm' | 'md'>('md');

  readonly statusLabels = GAME_STATUS_LABELS;
  readonly statusColors = GAME_STATUS_COLORS;
}

