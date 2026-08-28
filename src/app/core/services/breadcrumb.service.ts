import { Injectable, signal } from '@angular/core';
import { APP_BRAND } from '../../shared/constants/app-brand';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private breadcrumbs = signal<BreadcrumbItem[]>([]);
  readonly breadcrumbs$ = this.breadcrumbs.asReadonly();

  set(breadcrumbs: BreadcrumbItem[]): void {
    this.breadcrumbs.set(breadcrumbs);
  }

  clear(): void {
    this.breadcrumbs.set([]);
  }

  setFromUrl(url: string): void {
    const cleanUrl = url.split(/[?#]/, 1)[0];
    const parts = cleanUrl.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];
    let acc = '';

    for (const part of parts) {
      acc += '/' + part;
      const label = this.labelForSegment(part);
      items.push({ label, path: acc });
    }

    if (items.length > 0) {
      items[items.length - 1].path = undefined;
    }

    this.breadcrumbs.set(items);
  }

  private labelForSegment(segment: string): string {
    const map: Record<string, string> = {
      app: APP_BRAND.name,
      home: 'nav.home',
      parking: 'nav.park',
      cities: 'breadcrumb.cities',
      'city-info': 'breadcrumb.cityInfo',
      streets: 'breadcrumb.streets',
      tickets: 'breadcrumb.tickets',
      'time-steps': 'common.duration',
      confirm: 'common.confirm',
      success: 'breadcrumb.success',
      operations: 'nav.operations',
      detail: 'breadcrumb.detail',
      'unpaid-fines': 'ops.sanciones',
      'unpaid-fine-detail': 'ops.fineDetail.title',
      report: 'ops.report',
      'report-success': 'ops.report.success',
      account: 'nav.account',
      profile: 'account.profile',
      vehicles: 'account.vehicles',
      add: 'common.add',
      edit: 'common.edit',
      'payment-methods': 'account.paymentMethods',
      recharge: 'account.recharge.title',
      refund: 'account.refund.title',
      settings: 'account.settings',
      notifications: 'account.menu.notifications',
      'change-password': 'account.changePassword.title',
      'tax-data': 'account.taxData',
      support: 'account.support',
      'support-success': 'account.supportSuccess.title',
      about: 'account.menu.about',
      'delete-account': 'account.deleteAccount.title',
    };
    return map[segment] ?? segment;
  }
}
