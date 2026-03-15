import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

// Backwards-compatible exported type name used across the app
export type Toast = Notification;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _notifications = signal<Notification[]>([]);
  // expose as `toasts` to match existing consumers (app.ts etc.)
  readonly toasts = this._notifications.asReadonly();

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  /**
   * Show a notification
   */
  show(notification: Omit<Notification, 'id'>): string {
    const id = this.generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
      dismissible: notification.dismissible ?? true
    };

    this._notifications.update(notifications => [...notifications, newNotification]);

    // Auto dismiss
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => this.dismiss(id), newNotification.duration);
    }

    return id;
  }

  /**
   * Show success notification
   */
  success(title: string, message?: string): string {
    return this.show({ type: 'success', title, message });
  }

  /**
   * Show error notification
   */
  error(title: string, message?: string): string {
    return this.show({ type: 'error', title, message, duration: 8000 });
  }

  /**
   * Show warning notification
   */
  warning(title: string, message?: string): string {
    return this.show({ type: 'warning', title, message });
  }

  /**
   * Show info notification
   */
  info(title: string, message?: string): string {
    return this.show({ type: 'info', title, message });
  }

  /**
   * Dismiss a notification (alias: remove)
   */
  dismiss(id: string): void {
    this._notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
  }

  /**
   * Alias `remove` for backward compatibility with app.ts
   */
  remove(id: string): void {
    this.dismiss(id);
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    this._notifications.set([]);
  }
}
