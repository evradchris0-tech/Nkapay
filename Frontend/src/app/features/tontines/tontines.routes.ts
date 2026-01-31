import { Routes } from '@angular/router';

export const TONTINES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/tontine-list/tontine-list.component').then(m => m.TontineListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/tontine-form/tontine-form.component').then(m => m.TontineFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/tontine-detail/tontine-detail.component').then(m => m.TontineDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/tontine-form/tontine-form.component').then(m => m.TontineFormComponent)
  }
];
