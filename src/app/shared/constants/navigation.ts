export interface NavigationItem {
  path: string;
  labelKey: string;
  icon: string;
}

export interface AccountMenuItem extends NavigationItem {
  key: string;
  groupKey: string;
}

export const NAV_ITEMS: readonly NavigationItem[] = [
  { path: '/app/home', labelKey: 'nav.home', icon: 'home' },
  { path: '/app/parking', labelKey: 'nav.park', icon: 'directions_car' },
  { path: '/app/operations', labelKey: 'nav.operations', icon: 'operations' },
  { path: '/app/account', labelKey: 'nav.account', icon: 'account' },
] as const;

export const ACCOUNT_MENU: readonly AccountMenuItem[] = [
  { key: 'profile', path: '/app/account/profile', labelKey: 'account.menu.profile', icon: 'profile', groupKey: 'account.menu.group.myAccount' },
  { key: 'tax-data', path: '/app/account/tax-data', labelKey: 'account.menu.taxData', icon: 'tax', groupKey: 'account.menu.group.myAccount' },
  { key: 'change-password', path: '/app/account/change-password', labelKey: 'account.menu.changePassword', icon: 'lock', groupKey: 'account.menu.group.myAccount' },
  { key: 'payment-methods', path: '/app/account/payment-methods', labelKey: 'account.menu.paymentMethods', icon: 'payment', groupKey: 'account.menu.group.myAccount' },
  { key: 'vehicles', path: '/app/account/vehicles', labelKey: 'account.menu.vehicles', icon: 'vehicle', groupKey: 'account.menu.group.myAccount' },
  { key: 'notifications', path: '/app/account/notifications', labelKey: 'account.menu.notifications', icon: 'notifications', groupKey: 'account.menu.group.myAccount' },
  { key: 'settings', path: '/app/account/settings', labelKey: 'account.menu.settings', icon: 'settings', groupKey: 'account.menu.group.other' },
  { key: 'help', path: '/app/account/help', labelKey: 'account.menu.help', icon: 'help', groupKey: 'account.menu.group.other' },
  { key: 'terms-and-conditions', path: '/app/account/terms-and-conditions', labelKey: 'account.menu.terms', icon: 'terms', groupKey: 'account.menu.group.other' },
  { key: 'privacy-policy', path: '/app/account/privacy-policy', labelKey: 'account.menu.privacy', icon: 'privacy', groupKey: 'account.menu.group.other' },
  { key: 'about', path: '/app/account/about', labelKey: 'account.menu.about', icon: 'about', groupKey: 'account.menu.group.other' },
  { key: 'support', path: '/app/account/support', labelKey: 'account.menu.support', icon: 'support', groupKey: 'account.menu.group.other' },
  { key: 'delete-account', path: '/app/account/delete-account', labelKey: 'account.deleteAccount.action', icon: 'lock', groupKey: 'account.menu.group.other' },
];
