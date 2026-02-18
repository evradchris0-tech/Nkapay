import { Routes } from '@angular/router';

export const TONTINES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/tontine-list/tontine-list.component').then(m => m.TontineListComponent)
  },
  {
    path: 'recherche',
    loadComponent: () => import('./pages/tontine-search/tontine-search.component').then(m => m.TontineSearchComponent)
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
  },
  {
    path: ':id/rejoindre',
    loadComponent: () => import('./pages/adhesion-request/adhesion-request.component').then(m => m.AdhesionRequestComponent)
  }
];
