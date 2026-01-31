import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading" [class.fullscreen]="fullscreen()">
      <div class="spinner" [style.width.px]="size()" [style.height.px]="size()"></div>
      @if (message()) {
        <p>{{ message() }}</p>
      }
    </div>
  `,
  styles: `
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #6b7280;

      &.fullscreen {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.9);
        z-index: 1000;
      }
    }

    .spinner {
      border: 3px solid rgba(102, 126, 234, 0.2);
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    p {
      margin-top: 1rem;
      font-size: 0.875rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
})
export class LoadingSpinnerComponent {
  size = input(40);
  message = input<string>();
  fullscreen = input(false);
}
