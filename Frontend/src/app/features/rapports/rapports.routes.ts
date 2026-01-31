import { Routes } from '@angular/router';

export const RAPPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/rapports/rapports.component').then(m => m.RapportsComponent)
  }
];
