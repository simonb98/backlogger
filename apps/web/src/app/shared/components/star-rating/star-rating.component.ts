import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-1">
      @for (star of stars(); track star) {
        <button
          type="button"
          class="transition-colors text-2xl"
          [class]="rating() !== null && star <= rating()! ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'"
          [disabled]="readonly()"
          (click)="!readonly() && setRating(star)">
          ★
        </button>
      }
      @if (showValue() && rating()) {
        <span class="ml-2 font-semibold text-gray-700 dark:text-gray-300">{{ rating() }}/{{ maxRating() }}</span>
      }
    </div>
  `,
})
export class StarRatingComponent {
  rating = input<number | null>(null);
  maxRating = input(10);
  readonly = input(false);
  showValue = input(true);

  ratingChange = output<number>();

  stars = computed(() => Array.from({ length: this.maxRating() }, (_, i) => i + 1));

  setRating(value: number) {
    this.ratingChange.emit(value);
  }
}

