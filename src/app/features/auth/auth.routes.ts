import { Routes } from '@angular/router';
import { redirectIfSession } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [redirectIfSession],
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [redirectIfSession],
    loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'register-confirm',
    loadComponent: () => import('./register-confirm/register-confirm.component').then((m) => m.RegisterConfirmComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'reset-password-code',
    loadComponent: () => import('./reset-password-code/reset-password-code.component').then((m) => m.ResetPasswordCodeComponent),
  },
  {
    path: 'reset-password-confirm',
    loadComponent: () => import('./reset-password-confirm/reset-password-confirm.component').then((m) => m.ResetPasswordConfirmComponent),
  },
  { path: 'web/:type', loadComponent: () => import('./web/web.component').then((m) => m.WebComponent) },
];
