import { Routes } from '@angular/router';
import { requireSession } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  // Paycomet's native flow reports URLs ending in /ok? and /ko?. Keep these
  // aliases so the provider can return to the web app using the same contract.
  { path: 'ok', redirectTo: 'app/paycomet/ok', pathMatch: 'full' },
  { path: 'ko', redirectTo: 'app/paycomet/ko', pathMatch: 'full' },
  { path: 'web-ui/ok', redirectTo: 'app/paycomet/ok', pathMatch: 'full' },
  { path: 'web-ui/ko', redirectTo: 'app/paycomet/ko', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'onboarding',
    canActivate: [requireSession],
    canActivateChild: [requireSession],
    loadChildren: () => import('./features/onboarding/onboarding.routes').then((m) => m.ONBOARDING_ROUTES),
  },
  {
    path: 'app',
    canActivate: [requireSession],
    canActivateChild: [requireSession],
    loadComponent: () => import('./layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/app-entry/app-entry.component').then((m) => m.AppEntryComponent),
      },
      {
        path: 'home',
        title: 'nav.home',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'parking',
        loadChildren: () => import('./features/parking/parking.routes').then((m) => m.PARKING_ROUTES),
      },
      {
        path: 'operations',
        loadChildren: () => import('./features/operations/operations.routes').then((m) => m.OPERATIONS_ROUTES),
      },
      {
        path: 'account',
        loadChildren: () => import('./features/account/account.routes').then((m) => m.ACCOUNT_ROUTES),
      },
      {
        path: 'paycomet/ok',
        title: 'payment.challenge.pendingTitle',
        loadComponent: () =>
          import('./features/account/payment-challenge-return/payment-challenge-return.component').then(
            (m) => m.PaymentChallengeReturnComponent,
          ),
        data: { outcome: 'ok' },
      },
      {
        path: 'paycomet/ko',
        title: 'payment.challenge.failedTitle',
        loadComponent: () =>
          import('./features/account/payment-challenge-return/payment-challenge-return.component').then(
            (m) => m.PaymentChallengeReturnComponent,
          ),
        data: { outcome: 'ko' },
      },
    ],
  },
  { path: '**', redirectTo: 'auth/login' },
];
