import { Routes } from '@angular/router';
import { AuthLayoutComponent } from '../../layouts/auth-layout/auth-layout.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'change-password',
        loadComponent: () => import('./pages/change-password/change-password.component').then(m => m.ChangePasswordComponent)
      }
    ]
  }
];
