import { Routes } from '@angular/router';

export const TRANSACTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/transaction-list/transaction-list.component').then(m => m.TransactionListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/transaction-form/transaction-form.component').then(m => m.TransactionFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/transaction-detail/transaction-detail.component').then(m => m.TransactionDetailComponent)
  }
];
