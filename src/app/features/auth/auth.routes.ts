import { Routes } from '@angular/router';
import { redirectIfSession } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    title: 'auth.login.title',
    canActivate: [redirectIfSession],
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'auth.register.title',
    canActivate: [redirectIfSession],
    loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'register-confirm',
    title: 'auth.confirm.title',
    loadComponent: () => import('./register-confirm/register-confirm.component').then((m) => m.RegisterConfirmComponent),
  },
  {
    path: 'reset-password',
    title: 'auth.reset.title',
    loadComponent: () => import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'reset-password-code',
    title: 'auth.resetCode.title',
    loadComponent: () => import('./reset-password-code/reset-password-code.component').then((m) => m.ResetPasswordCodeComponent),
  },
  {
    path: 'reset-password-confirm',
    title: 'auth.newPassword.title',
    loadComponent: () => import('./reset-password-confirm/reset-password-confirm.component').then((m) => m.ResetPasswordConfirmComponent),
  },
  {
    path: 'reset-password-success',
    title: 'auth.resetSuccess.title',
    loadComponent: () => import('./reset-password-success/reset-password-success.component').then((m) => m.ResetPasswordSuccessComponent),
  },
  { path: 'web/:type', loadComponent: () => import('./web/web.component').then((m) => m.WebComponent) },
];
