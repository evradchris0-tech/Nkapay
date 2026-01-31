import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1>Transactions</h1>
        <p>Suivez toutes les transactions (cotisations, remboursements...)</p>
      </div>
      <a routerLink="create" class="btn-primary">
        <span class="material-icons">add</span>
        Nouvelle transaction
      </a>
    </div>
    <div class="placeholder">
      <span class="material-icons">payments</span>
      <p>Liste des transactions en cours de développement</p>
    </div>
  `,
  styles: `
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: #1f2937; margin: 0; }
    .page-header p { color: #6b7280; margin-top: 0.25rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 500; text-decoration: none; }
    .placeholder { display: flex; flex-direction: column; align-items: center; padding: 4rem; background: white; border-radius: 12px; color: #6b7280; }
    .placeholder .material-icons { font-size: 4rem; opacity: 0.3; margin-bottom: 1rem; }
  `
})
export class TransactionListComponent {}
