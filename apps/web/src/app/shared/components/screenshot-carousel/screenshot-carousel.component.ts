import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-screenshot-carousel',
  imports: [CommonModule],
  template: `
    <div class="relative rounded-lg overflow-hidden" [class]="containerClass()">
      @if (screenshots().length > 0) {
        <img
          [src]="screenshots()[activeIndex()]"
          [alt]="alt()"
          class="w-full h-full object-cover" />

        @if (screenshots().length > 1) {
          <!-- Navigation Arrows -->
          <button
            (click)="prev()"
            class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full hover:bg-black/70 flex items-center justify-center">
            ‹
          </button>
          <button
            (click)="next()"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full hover:bg-black/70 flex items-center justify-center">
            ›
          </button>

          <!-- Dots -->
          @if (showDots()) {
            <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              @for (ss of visibleDots(); track $index) {
                <button
                  (click)="activeIndex.set($index)"
                  class="w-2 h-2 rounded-full transition-all"
                  [class]="$index === activeIndex() ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'">
                </button>
              }
            </div>
          }
        }
      } @else {
        <div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700">
          No screenshots
        </div>
      }
    </div>
  `,
})
export class ScreenshotCarouselComponent {
  screenshots = input<string[]>([]);
  alt = input('Screenshot');
  containerClass = input('aspect-video');
  showDots = input(true);
  maxDots = input(5);

  activeIndex = signal(0);

  visibleDots = computed(() => this.screenshots().slice(0, this.maxDots()));

  prev() {
    const length = this.screenshots().length;
    this.activeIndex.update(i => (i - 1 + length) % length);
  }

  next() {
    const length = this.screenshots().length;
    this.activeIndex.update(i => (i + 1) % length);
  }
}

