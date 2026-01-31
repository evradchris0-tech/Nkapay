import { Routes } from '@angular/router';

export const DISTRIBUTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/distribution-list/distribution-list.component').then(m => m.DistributionListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/distribution-form/distribution-form.component').then(m => m.DistributionFormComponent)
  }
];
