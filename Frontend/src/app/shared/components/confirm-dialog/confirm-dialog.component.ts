import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="overlay" (click)="onCancel()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-icon" [class]="type()">
            <span class="material-icons">
              {{ type() === 'danger' ? 'warning' : type() === 'success' ? 'check_circle' : 'info' }}
            </span>
          </div>
          <h3>{{ title() }}</h3>
          <p>{{ message() }}</p>
          <div class="actions">
            <button class="btn-cancel" (click)="onCancel()">{{ cancelText() }}</button>
            <button class="btn-confirm" [class]="type()" (click)="onConfirm()">{{ confirmText() }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 400px;
      width: 90%;
      text-align: center;
    }

    .dialog-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;

      .material-icons {
        font-size: 2rem;
        color: white;
      }

      &.danger { background: #ef4444; }
      &.success { background: #10b981; }
      &.info { background: #3b82f6; }
    }

    h3 {
      margin: 0 0 0.5rem;
      color: #1f2937;
    }

    p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    button {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: white;
      border: 1px solid #e5e7eb;
      color: #1f2937;

      &:hover {
        background: #f3f4f6;
      }
    }

    .btn-confirm {
      border: none;
      color: white;

      &.danger { background: #ef4444; &:hover { background: #dc2626; } }
      &.success { background: #10b981; &:hover { background: #059669; } }
      &.info { background: #3b82f6; &:hover { background: #2563eb; } }
    }
  `
})
export class ConfirmDialogComponent {
  isOpen = input.required<boolean>();
  title = input('Confirmation');
  message = input('Êtes-vous sûr ?');
  type = input<'danger' | 'success' | 'info'>('danger');
  confirmText = input('Confirmer');
  cancelText = input('Annuler');
  
  confirm = output<void>();
  cancel = output<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
