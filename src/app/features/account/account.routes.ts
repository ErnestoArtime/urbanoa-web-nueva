import { Routes } from '@angular/router';

const loadAccountMenu = () => import('./menu/menu.component').then(m => m.AccountMenuComponent);

export const ACCOUNT_ROUTES: Routes = [
  { path: '', loadComponent: loadAccountMenu },
  { path: 'profile', loadComponent: loadAccountMenu },
  { path: 'settings', loadComponent: loadAccountMenu },
  { path: 'notifications', loadComponent: loadAccountMenu },
  { path: 'change-password', loadComponent: loadAccountMenu },
  { path: 'tax-data', loadComponent: loadAccountMenu },
  { path: 'help', loadComponent: loadAccountMenu },
  { path: 'share', loadComponent: loadAccountMenu },
  { path: 'review', loadComponent: loadAccountMenu },
  { path: 'terms-and-conditions', loadComponent: loadAccountMenu },
  { path: 'privacy-policy', loadComponent: loadAccountMenu },
  { path: 'vehicles', loadComponent: loadAccountMenu },
  { path: 'vehicles/add', loadComponent: loadAccountMenu },
  { path: 'vehicles/edit', loadComponent: loadAccountMenu },
  { path: 'payment-methods', loadComponent: loadAccountMenu },
  { path: 'payment-methods/add', loadComponent: loadAccountMenu },
  { path: 'recharge', loadComponent: loadAccountMenu },
  { path: 'refund', loadComponent: loadAccountMenu },
  { path: 'about', loadComponent: loadAccountMenu },
  { path: 'support', loadComponent: loadAccountMenu },
  { path: 'support-success', loadComponent: loadAccountMenu },
  { path: 'delete-account', loadComponent: loadAccountMenu },
];
