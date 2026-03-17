import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center gap-2">
        <button
          (click)="goToPage(currentPage() - 1)"
          [disabled]="currentPage() === 1"
          class="px-3 py-1 rounded border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          ← Prev
        </button>
        <span class="text-sm text-gray-600">Page {{ currentPage() }} of {{ totalPages() }}</span>
        <button
          (click)="goToPage(currentPage() + 1)"
          [disabled]="currentPage() >= totalPages()"
          class="px-3 py-1 rounded border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          Next →
        </button>
      </div>
    }
  `,
})
export class PaginationComponent {
  currentPage = input.required<number>();
  totalPages = input.required<number>();

  pageChange = output<number>();

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}

