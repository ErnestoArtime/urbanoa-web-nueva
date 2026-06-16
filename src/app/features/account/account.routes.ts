import { Routes } from '@angular/router';

export const ACCOUNT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./menu/menu.component').then(m => m.AccountMenuComponent) },
  { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.AccountProfileComponent) },
  { path: 'settings', loadComponent: () => import('./settings/settings.component').then(m => m.AccountSettingsComponent) },
  { path: 'notifications', loadComponent: () => import('./notifications/notifications.component').then(m => m.AccountNotificationsComponent) },
  { path: 'change-password', loadComponent: () => import('./change-password/change-password.component').then(m => m.AccountChangePasswordComponent) },
  { path: 'tax-data', loadComponent: () => import('./tax-data/tax-data.component').then(m => m.AccountTaxDataComponent) },
  {
    path: 'vehicles',
    loadComponent: () => import('./vehicles-layout/vehicles-layout.component').then(m => m.VehiclesLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./vehicles-empty/vehicles-empty.component').then(m => m.VehiclesEmptyComponent) },
      { path: 'add', loadComponent: () => import('./vehicle-add/vehicle-add.component').then(m => m.VehicleAddComponent) },
      { path: 'edit', loadComponent: () => import('./vehicle-edit/vehicle-edit.component').then(m => m.VehicleEditComponent) },
    ],
  },
  {
    path: 'payment-methods',
    loadComponent: () => import('./payment-layout/payment-layout.component').then(m => m.PaymentLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./payment-empty/payment-empty.component').then(m => m.PaymentEmptyComponent) },
      { path: 'add', loadComponent: () => import('./payment-add/payment-add.component').then(m => m.PaymentAddComponent) },
    ],
  },
  { path: 'recharge', loadComponent: () => import('./recharge/recharge.component').then(m => m.AccountRechargeComponent) },
  { path: 'refund', loadComponent: () => import('./refund/refund.component').then(m => m.AccountRefundComponent) },
  { path: 'about', loadComponent: () => import('./about/about.component').then(m => m.AccountAboutComponent) },
  { path: 'support', loadComponent: () => import('./support/support.component').then(m => m.AccountSupportComponent) },
  { path: 'support-success', loadComponent: () => import('./support-success/support-success.component').then(m => m.AccountSupportSuccessComponent) },
];
