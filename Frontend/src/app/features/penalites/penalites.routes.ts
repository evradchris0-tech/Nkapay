import { Routes } from '@angular/router';

export const PENALITES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/penalite-list/penalite-list.component').then(m => m.PenaliteListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/penalite-form/penalite-form.component').then(m => m.PenaliteFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/penalite-detail/penalite-detail.component').then(m => m.PenaliteDetailComponent)
  }
];
