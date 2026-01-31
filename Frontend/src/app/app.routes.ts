import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'tontines',
        loadChildren: () => import('./features/tontines/tontines.routes').then(m => m.TONTINES_ROUTES)
      },
      {
        path: 'exercices',
        loadChildren: () => import('./features/exercices/exercices.routes').then(m => m.EXERCICES_ROUTES)
      },
      {
        path: 'reunions',
        loadChildren: () => import('./features/reunions/reunions.routes').then(m => m.REUNIONS_ROUTES)
      },
      {
        path: 'membres',
        loadChildren: () => import('./features/membres/membres.routes').then(m => m.MEMBRES_ROUTES)
      },
      {
        path: 'transactions',
        loadChildren: () => import('./features/transactions/transactions.routes').then(m => m.TRANSACTIONS_ROUTES)
      },
      {
        path: 'prets',
        loadChildren: () => import('./features/prets/prets.routes').then(m => m.PRETS_ROUTES)
      },
      {
        path: 'penalites',
        loadChildren: () => import('./features/penalites/penalites.routes').then(m => m.PENALITES_ROUTES)
      },
      {
        path: 'distributions',
        loadChildren: () => import('./features/distributions/distributions.routes').then(m => m.DISTRIBUTIONS_ROUTES)
      },
      {
        path: 'secours',
        loadChildren: () => import('./features/secours/secours.routes').then(m => m.SECOURS_ROUTES)
      },
      {
        path: 'rapports',
        loadChildren: () => import('./features/rapports/rapports.routes').then(m => m.RAPPORTS_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
