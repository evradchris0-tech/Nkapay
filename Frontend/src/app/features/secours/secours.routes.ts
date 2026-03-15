import { Routes } from '@angular/router';

export const SECOURS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/secours-list/secours-list.component').then(m => m.SecoursListComponent)
  },
  {
    path: 'evenements',
    loadComponent: () => import('./pages/evenement-secours-list/evenement-secours-list.component').then(m => m.EvenementSecoursListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/secours-form/secours-form.component').then(m => m.SecoursFormComponent)
  }
];
