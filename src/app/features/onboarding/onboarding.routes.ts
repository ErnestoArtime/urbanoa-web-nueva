import { Routes } from '@angular/router';
import { canShowOnboardingReady } from './onboarding-ready.guard';

export const ONBOARDING_ROUTES: Routes = [
  { path: '', redirectTo: 'user', pathMatch: 'full' },
  { path: 'user', loadComponent: () => import('./user/user.component').then((m) => m.OnboardingUserComponent) },
  { path: 'payment', loadComponent: () => import('./payment/payment.component').then((m) => m.OnboardingPaymentComponent) },
  { path: 'location', loadComponent: () => import('./location/location.component').then((m) => m.OnboardingLocationComponent) },
  {
    path: 'notification',
    loadComponent: () => import('./notification/notification.component').then((m) => m.OnboardingNotificationComponent),
  },
  {
    path: 'ready',
    canActivate: [canShowOnboardingReady],
    loadComponent: () => import('./ready/ready.component').then((m) => m.OnboardingReadyComponent),
  },
];
