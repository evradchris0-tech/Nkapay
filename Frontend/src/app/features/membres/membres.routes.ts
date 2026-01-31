import { Routes } from '@angular/router';

export const MEMBRES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/membre-list/membre-list.component').then(m => m.MembreListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/membre-detail/membre-detail.component').then(m => m.MembreDetailComponent)
  }
];
