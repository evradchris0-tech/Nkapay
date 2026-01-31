import { Routes } from '@angular/router';

export const EXERCICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/exercice-list/exercice-list.component').then(m => m.ExerciceListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/exercice-form/exercice-form.component').then(m => m.ExerciceFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/exercice-detail/exercice-detail.component').then(m => m.ExerciceDetailComponent)
  }
];
