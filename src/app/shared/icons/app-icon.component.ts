import { RuntimeStyleDirective } from '../directives/runtime-style.directive';
import { Component, input, computed } from '@angular/core';
import { APK_ICONS, type ApkIconName } from './apk-icons';
import { ICON_PATHS, type IconName } from './icon-paths';

const APK_ALIAS: Record<string, string> = {
  delete: 'delete',
  home: 'home',
  dashboard: 'home',
  parking: 'parking',
  location: 'location',
  operations: 'operations',
  account: 'account',
  profile: 'myAccount',
  tax: 'datosFiscales',
  lock: 'changePassword',
  payment: 'paymentMethod',
  card: 'paymentMethod',
  vehicle: 'vehicles',
  directions_car: 'car',
  notifications: 'notifications',
  settings: 'settings',
  help: 'help',
  share: 'share',
  review: 'review',
  terms: 'terms',
  privacy: 'terms',
  about: 'info',
  support: 'support',
  wallet: 'wallet',
  extend: 'extend',
  goToCar: 'goToCar',
  chevron: 'chevrolenRight',
  check: 'select',
  parkingSlip: 'fine',
  dateRange: 'calendarRange',
  schedule: 'clock',
  warning: 'warning',
  operationParking: 'parking',
  operationExtension: 'extend',
  operationRefund: 'refundAmount',
  operationBalanceRefund: 'refundAmount',
  operationFine: 'fine',
  operationTopUp: 'topUp',
  coins: 'rechargeAmount',
  logout: 'logout',
};

export type AppIconName = IconName | ApkIconName;

@Component({
  imports: [RuntimeStyleDirective],
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      class="app-icon"
      [attr.viewBox]="icon().viewBox"
      [attr.aria-hidden]="ariaLabel() ? undefined : true"
      [attr.aria-label]="ariaLabel() ?? undefined"
      [class.app-icon-stroke]="icon().stroke"
      [appRuntimeStyle]="{ width: size() + 'px', height: size() + 'px' }"
    >
      @for (p of icon().paths; track $index) {
        <path [attr.d]="p.d" [attr.fill-rule]="p.rule ?? null" [attr.fill-opacity]="p.opacity ?? null"></path>
      }
    </svg>
  `,
  styleUrl: './app-icon.component.css',
})
export class AppIconComponent {
  readonly name = input.required<AppIconName>();
  readonly size = input(20);
  readonly stroke = input(true);
  readonly ariaLabel = input<string>();

  readonly icon = computed(() => {
    const apk = APK_ICONS[this.name()] ?? APK_ICONS[APK_ALIAS[this.name()] ?? ''];
    if (apk) return { viewBox: apk.viewBox, paths: apk.paths, stroke: false };
    const d = ICON_PATHS[this.name()] ?? ICON_PATHS['about'];
    return { viewBox: '0 -960 960 960', paths: [{ d, rule: undefined, opacity: undefined }], stroke: this.stroke() };
  });
}
