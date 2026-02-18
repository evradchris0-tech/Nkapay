import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/utilisateur-list/utilisateur-list.component').then(m => m.UtilisateurListComponent)
  },
  {
    path: 'utilisateurs',
    loadComponent: () => import('./pages/utilisateur-list/utilisateur-list.component').then(m => m.UtilisateurListComponent)
  },
  {
    path: 'utilisateurs/nouveau',
    loadComponent: () => import('./pages/utilisateur-form/utilisateur-form.component').then(m => m.UtilisateurFormComponent)
  },
  {
    path: 'utilisateurs/:id',
    loadComponent: () => import('./pages/utilisateur-form/utilisateur-form.component').then(m => m.UtilisateurFormComponent)
  }
];
