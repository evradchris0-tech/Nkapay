import { Routes } from '@angular/router';

export const REUNIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/reunion-list/reunion-list.component').then(m => m.ReunionListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/reunion-form/reunion-form.component').then(m => m.ReunionFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/reunion-detail/reunion-detail.component').then(m => m.ReunionDetailComponent)
  }
];
