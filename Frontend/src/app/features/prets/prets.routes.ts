import { Routes } from '@angular/router';

export const PRETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/pret-list/pret-list.component').then(m => m.PretListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/pret-form/pret-form.component').then(m => m.PretFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/pret-detail/pret-detail.component').then(m => m.PretDetailComponent)
  }
];
