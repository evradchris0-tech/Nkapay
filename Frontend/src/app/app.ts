import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService, Toast } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet />
    
    <!-- Toast notifications -->
    <div class="toast-container">
      @for (toast of toasts(); track toast.id) {
        <div class="toast" [class]="toast.type">
          <span class="material-icons toast-icon" [class]="toast.type">
            {{ getToastIcon(toast.type) }}
          </span>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="removeToast(toast.id)">
            <span class="material-icons">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: ``
})
export class App implements OnInit {
  private notificationService = inject(NotificationService);
  
  toasts = this.notificationService.toasts;

  ngOnInit() {
    // Initialize app
  }

  getToastIcon(type: string): string {
    const icons: Record<string, string> = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    return icons[type] || 'info';
  }

  removeToast(id: string) {
    this.notificationService.remove(id);
  }
}
