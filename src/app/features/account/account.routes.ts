import { Routes } from '@angular/router';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    title: 'account.title',
    loadComponent: () => import('./account-shell/account-shell.component').then((m) => m.AccountShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'account.title',
        loadComponent: () => import('./menu/account-empty.component').then((m) => m.AccountEmptyComponent),
      },
      {
        path: 'profile',
        title: 'account.profile.title',
        loadComponent: () => import('./profile/profile.component').then((m) => m.AccountProfileComponent),
      },
      {
        path: 'settings',
        title: 'account.settings.title',
        loadComponent: () => import('./settings/settings.component').then((m) => m.AccountSettingsComponent),
      },
      {
        path: 'notifications',
        title: 'account.notifications.title',
        loadComponent: () => import('./notifications/notifications.component').then((m) => m.AccountNotificationsComponent),
      },
      {
        path: 'tax-data',
        title: 'account.taxData.title',
        loadComponent: () => import('./tax-data/tax-data.component').then((m) => m.AccountTaxDataComponent),
      },
      {
        path: 'change-password',
        title: 'account.changePassword.title',
        loadComponent: () => import('./change-password/change-password.component').then((m) => m.AccountChangePasswordComponent),
      },
      {
        path: 'help',
        title: 'account.menu.help',
        loadComponent: () => import('./web-content/web-content.component').then((m) => m.WebContentComponent),
        data: { title: 'account.menu.help', contentType: 'help', backLink: '/app/account' },
      },
      {
        path: 'terms-and-conditions',
        title: 'account.menu.terms',
        loadComponent: () => import('./web-content/web-content.component').then((m) => m.WebContentComponent),
        data: { title: 'account.menu.terms', contentType: 'terms', backLink: '/app/account' },
      },
      {
        path: 'privacy-policy',
        title: 'account.menu.privacy',
        loadComponent: () => import('./web-content/web-content.component').then((m) => m.WebContentComponent),
        data: { title: 'account.menu.privacy', contentType: 'privacy', backLink: '/app/account' },
      },
      {
        path: 'delete-account',
        title: 'account.deleteAccount.title',
        loadComponent: () => import('./delete-account/delete-account.component').then((m) => m.AccountDeleteAccountComponent),
      },
      {
        path: 'about',
        title: 'account.menu.about',
        loadComponent: () => import('./about/about.component').then((m) => m.AccountAboutComponent),
      },
      {
        path: 'support-success',
        title: 'account.support.title',
        loadComponent: () => import('./support-success/support-success.component').then((m) => m.AccountSupportSuccessComponent),
      },
      {
        path: 'support/new',
        title: 'account.support.title',
        loadComponent: () => import('./support-form/support-form.component').then((m) => m.AccountSupportFormComponent),
      },
      {
        path: 'support/:id/reply',
        title: 'account.support.replyTitle',
        loadComponent: () => import('./support-form/support-form.component').then((m) => m.AccountSupportFormComponent),
      },
      {
        path: 'support/:id',
        title: 'account.support.detailTitle',
        loadComponent: () => import('./support-detail/support-detail.component').then((m) => m.AccountSupportDetailComponent),
      },
      {
        path: 'support',
        title: 'account.support.title',
        loadComponent: () => import('./support/support.component').then((m) => m.AccountSupportComponent),
      },
      {
        path: 'vehicles',
        title: 'account.vehicles',
        loadComponent: () => import('./vehicles-layout/vehicles-layout.component').then((m) => m.VehiclesLayoutComponent),
        children: [
          {
            path: 'add',
            title: 'account.vehicleAdd.title',
            loadComponent: () => import('./vehicle-add/vehicle-add.component').then((m) => m.VehicleAddComponent),
          },
          {
            path: 'edit/:id',
            title: 'account.vehicleEdit.title',
            loadComponent: () => import('./vehicle-edit/vehicle-edit.component').then((m) => m.VehicleEditComponent),
          },
        ],
      },
      {
        path: 'payment-methods',
        title: 'account.paymentMethods',
        loadComponent: () => import('./payment-layout/payment-layout.component').then((m) => m.PaymentLayoutComponent),
        children: [
          {
            path: 'add',
            title: 'account.addCard.title',
            loadComponent: () => import('./payment-add/payment-add.component').then((m) => m.PaymentAddComponent),
          },
          {
            path: 'recharge',
            title: 'account.recharge.title',
            loadComponent: () => import('./recharge/recharge.component').then((m) => m.AccountRechargeComponent),
          },
          {
            path: 'refund',
            title: 'account.refund.title',
            loadComponent: () => import('./refund/refund.component').then((m) => m.AccountRefundComponent),
          },
        ],
      },
      { path: 'recharge', redirectTo: 'payment-methods/recharge', pathMatch: 'full' },
      { path: 'refund', redirectTo: 'payment-methods/refund', pathMatch: 'full' },
    ],
  },
];
