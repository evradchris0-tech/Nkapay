import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination">
      <div class="info">
        Affichage de {{ startItem() }} à {{ endItem() }} sur {{ totalItems() }} résultats
      </div>
      <div class="controls">
        <button 
          [disabled]="currentPage() === 1" 
          (click)="goToPage(1)"
          class="nav-btn"
        >
          <span class="material-icons">first_page</span>
        </button>
        <button 
          [disabled]="currentPage() === 1" 
          (click)="goToPage(currentPage() - 1)"
          class="nav-btn"
        >
          <span class="material-icons">chevron_left</span>
        </button>
        
        @for (page of visiblePages(); track page) {
          <button 
            [class.active]="page === currentPage()"
            (click)="goToPage(page)"
            class="page-btn"
          >
            {{ page }}
          </button>
        }
        
        <button 
          [disabled]="currentPage() === totalPages()" 
          (click)="goToPage(currentPage() + 1)"
          class="nav-btn"
        >
          <span class="material-icons">chevron_right</span>
        </button>
        <button 
          [disabled]="currentPage() === totalPages()" 
          (click)="goToPage(totalPages())"
          class="nav-btn"
        >
          <span class="material-icons">last_page</span>
        </button>
      </div>
    </div>
  `,
  styles: `
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      margin-top: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .info {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .controls {
      display: flex;
      gap: 0.25rem;
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #f3f4f6;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.active {
        background: #667eea;
        border-color: #667eea;
        color: white;
      }
    }

    .nav-btn .material-icons {
      font-size: 1.25rem;
    }

    .page-btn {
      font-size: 0.875rem;
      padding: 0 0.5rem;
    }
  `
})
export class PaginationComponent {
  currentPage = model.required<number>();
  totalItems = input.required<number>();
  pageSize = input(10);
  pageChange = output<number>();

  totalPages() {
    return Math.ceil(this.totalItems() / this.pageSize());
  }

  startItem() {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  endItem() {
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  }

  visiblePages() {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.pageChange.emit(page);
    }
  }
}
