import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'actions';
  format?: string;
  width?: string;
  badgeColors?: Record<string, string>;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th [style.width]="col.width">{{ col.label }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of data(); track $index) {
            <tr (click)="rowClick.emit(row)">
              @for (col of columns(); track col.key) {
                <td>
                  @switch (col.type) {
                    @case ('currency') {
                      {{ getValue(row, col.key) | currency:'XAF':'symbol':'1.0-0':'fr' }}
                    }
                    @case ('date') {
                      {{ getValue(row, col.key) | date:(col.format || 'dd/MM/yyyy') }}
                    }
                    @case ('badge') {
                      <span class="badge" [style.background]="getBadgeColor(getValue(row, col.key), col)">
                        {{ getValue(row, col.key) }}
                      </span>
                    }
                    @case ('actions') {
                      <div class="actions">
                        <ng-content select="[actions]"></ng-content>
                      </div>
                    }
                    @default {
                      {{ getValue(row, col.key) }}
                    }
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="columns().length" class="empty">
                {{ emptyMessage() }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .table-container {
      overflow-x: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      background: #f9fafb;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #6b7280;
    }

    tr:hover {
      background: #f9fafb;
      cursor: pointer;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
    }

    .empty {
      text-align: center;
      color: #6b7280;
      padding: 2rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }
  `
})
export class DataTableComponent {
  columns = input.required<Column[]>();
  data = input.required<any[]>();
  emptyMessage = input('Aucune donnée');
  rowClick = output<any>();

  getValue(row: any, key: string): any {
    return key.split('.').reduce((o, k) => o?.[k], row);
  }

  getBadgeColor(value: string, col: Column): string {
    return col.badgeColors?.[value] || '#6b7280';
  }
}
