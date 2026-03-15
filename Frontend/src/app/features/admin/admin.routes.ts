import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

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
  },
  {
    path: 'organisations',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/organisation-list/organisation-list.component').then(m => m.OrganisationListComponent)
  },
  {
    path: 'organisations/:id',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/organisation-detail/organisation-detail.component').then(m => m.OrganisationDetailComponent)
  }
];
