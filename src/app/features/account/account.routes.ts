import { Routes } from '@angular/router';
import { environment } from '../../../environments/environment';

const externalContent = environment.externalContentBaseUrl;

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./account-shell/account-shell.component').then((m) => m.AccountShellComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./menu/account-empty.component').then((m) => m.AccountEmptyComponent) },
      { path: 'profile', loadComponent: () => import('./profile/profile.component').then((m) => m.AccountProfileComponent) },
      { path: 'settings', loadComponent: () => import('./settings/settings.component').then((m) => m.AccountSettingsComponent) },
      {
        path: 'notifications',
        loadComponent: () => import('./notifications/notifications.component').then((m) => m.AccountNotificationsComponent),
      },
      { path: 'tax-data', loadComponent: () => import('./tax-data/tax-data.component').then((m) => m.AccountTaxDataComponent) },
      {
        path: 'change-password',
        loadComponent: () => import('./change-password/change-password.component').then((m) => m.AccountChangePasswordComponent),
      },
      {
        path: 'help',
        loadComponent: () => import('./web-content/web-content.component').then((m) => m.WebContentComponent),
        data: { title: 'Ayuda', url: `${externalContent}/Arinpark/ArinparkFAQ-ESP.html`, backLink: '/app/account' },
      },
      {
        path: 'terms-and-conditions',
        loadComponent: () => import('./web-content/web-content.component').then((m) => m.WebContentComponent),
        data: { title: 'Términos y condiciones', url: `${externalContent}/arinpark/CU_es.html`, backLink: '/app/account' },
      },
      {
        path: 'privacy-policy',
        loadComponent: () => import('./web-content/web-content.component').then((m) => m.WebContentComponent),
        data: { title: 'Política de privacidad', url: `${externalContent}/arinpark/es.html`, backLink: '/app/account' },
      },
      { path: 'about', loadComponent: () => import('./about/about.component').then((m) => m.AccountAboutComponent) },
      { path: 'support', loadComponent: () => import('./support/support.component').then((m) => m.AccountSupportComponent) },
      {
        path: 'support-success',
        loadComponent: () => import('./support-success/support-success.component').then((m) => m.AccountSupportSuccessComponent),
      },
      {
        path: 'vehicles',
        loadComponent: () => import('./vehicles-layout/vehicles-layout.component').then((m) => m.VehiclesLayoutComponent),
        children: [
          { path: 'add', loadComponent: () => import('./vehicle-add/vehicle-add.component').then((m) => m.VehicleAddComponent) },
          { path: 'edit/:id', loadComponent: () => import('./vehicle-edit/vehicle-edit.component').then((m) => m.VehicleEditComponent) },
        ],
      },
      {
        path: 'payment-methods',
        loadComponent: () => import('./payment-layout/payment-layout.component').then((m) => m.PaymentLayoutComponent),
        children: [
          {
            path: 'add',
            loadComponent: () => import('./payment-add/payment-add.component').then((m) => m.PaymentAddComponent),
          },
          {
            path: 'recharge',
            loadComponent: () => import('./recharge/recharge.component').then((m) => m.AccountRechargeComponent),
          },
          {
            path: 'refund',
            loadComponent: () => import('./refund/refund.component').then((m) => m.AccountRefundComponent),
          },
        ],
      },
      { path: 'recharge', redirectTo: 'payment-methods/recharge', pathMatch: 'full' },
      { path: 'refund', redirectTo: 'payment-methods/refund', pathMatch: 'full' },
    ],
  },
];
