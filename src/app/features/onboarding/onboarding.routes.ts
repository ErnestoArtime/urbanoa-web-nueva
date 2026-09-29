import { Routes } from '@angular/router';
import { canShowOnboardingReady } from './onboarding-ready.guard';

export const ONBOARDING_ROUTES: Routes = [
  { path: '', redirectTo: 'user', pathMatch: 'full' },
  {
    path: 'user',
    title: 'onboarding.user.title',
    loadComponent: () => import('./user/user.component').then((m) => m.OnboardingUserComponent),
  },
  {
    path: 'payment',
    title: 'account.paymentMethods',
    loadComponent: () => import('./payment/payment.component').then((m) => m.OnboardingPaymentComponent),
  },
  {
    path: 'location',
    title: 'onboarding.location.title',
    loadComponent: () => import('./location/location.component').then((m) => m.OnboardingLocationComponent),
  },
  {
    path: 'notification',
    title: 'account.notifications.title',
    loadComponent: () => import('./notification/notification.component').then((m) => m.OnboardingNotificationComponent),
  },
  {
    path: 'ready',
    title: 'onboarding.ready.title',
    canActivate: [canShowOnboardingReady],
    loadComponent: () => import('./ready/ready.component').then((m) => m.OnboardingReadyComponent),
  },
];
