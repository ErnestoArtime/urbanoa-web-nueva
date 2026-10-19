import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { ACCOUNT_MENU } from '../../../shared/constants/navigation';
import { WalletService } from '../../../core/services/wallet.service';
import { UserService } from '../../../core/services/user.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AccountProfileComponent } from '../profile/profile.component';
import { AccountSettingsComponent } from '../settings/settings.component';
import { AccountNotificationsComponent } from '../notifications/notifications.component';
import { AccountTaxDataComponent } from '../tax-data/tax-data.component';
import { AccountAboutComponent } from '../about/about.component';
import { AccountSupportComponent } from '../support/support.component';
import { AccountSupportSuccessComponent } from '../support-success/support-success.component';
import { AccountChangePasswordComponent } from '../change-password/change-password.component';
import { AccountRechargeComponent } from '../recharge/recharge.component';
import { AccountRefundComponent } from '../refund/refund.component';
import { VehicleAddComponent } from '../vehicle-add/vehicle-add.component';
import { VehicleEditComponent } from '../vehicle-edit/vehicle-edit.component';
import { PaymentAddComponent } from '../payment-add/payment-add.component';
import { WebContentComponent } from '../web-content/web-content.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';

import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-account-menu',
  imports: [
    EuroPipe,
    RouterLink,
    AppIconComponent,
    TranslatePipe,
    AccountProfileComponent,
    AccountSettingsComponent,
    AccountNotificationsComponent,
    AccountTaxDataComponent,
    AccountAboutComponent,
    AccountSupportComponent,
    AccountSupportSuccessComponent,
    AccountChangePasswordComponent,
    AccountRechargeComponent,
    AccountRefundComponent,
    VehicleAddComponent,
    VehicleEditComponent,
    PaymentAddComponent,
    WebContentComponent,
  ],
  template: `
    <div class="account-layout">
      <section class="account-master">
        <h1 class="page-title">{{ 'account.title' | translate }}</h1>
        <div class="account-profile">
          <span class="account-avatar">{{ user().name.charAt(0) }}</span>
          <div>
            <strong>{{ user().name }} {{ user().surname }}</strong
            ><span>{{ user().email }}</span
            ><span>{{ walletService.balance() | euro }}</span>
          </div>
        </div>
        <div class="card wallet-card mb-2 mobile-wallet">
          <p>{{ 'account.walletBalance' | translate }}</p>
          <p class="wallet-balance">{{ walletService.balance() | euro }}</p>
        </div>
        <ul class="list account-list">
          @for (item of menu; track item.key; let i = $index) {
            @if (itemGroupLabel(i); as group) {
              <li class="menu-group">{{ group | translate }}</li>
            }
            <button type="button" class="list-item account-item" [class.active]="selected() === item.key" (click)="select(item.key)">
              <app-icon [name]="item.icon" class="account-item-icon" [stroke]="false" />
              <div class="list-item-content">
                <div class="list-item-title">{{ item.labelKey | translate }}</div>
              </div>
              <span class="list-item-chevron">›</span>
            </button>
          }
        </ul>
        <div class="account-actions">
          <a routerLink="/auth/login" class="btn btn-ghost btn-block">{{ 'account.logout' | translate }}</a>
          <button type="button" class="btn btn-danger btn-block" (click)="select('delete-account')">
            {{ 'account.deleteAccount' | translate }}
          </button>
        </div>
      </section>
      <aside class="account-detail">
        @if (!selected()) {
          <div class="detail-placeholder">{{ 'account.selectOption' | translate }}</div>
        } @else {
          <div class="detail-toolbar">
            <span class="back-btn" (click)="goBack()">←</span>
            <strong>{{ selectedLabel() | translate }}</strong>
            <span class="detail-toolbar-actions"></span>
          </div>
          <div class="detail-content">
            @switch (selected()) {
              @case ('profile') {
                <app-account-profile />
              }
              @case ('settings') {
                <app-account-settings />
              }
              @case ('notifications') {
                <app-account-notifications />
              }
              @case ('tax-data') {
                <app-account-tax-data />
              }
              @case ('help') {
                <app-web-content [title]="'account.menu.help' | translate" backLink="/app/account" [url]="helpUrl()" />
              }
              @case ('about') {
                <app-account-about />
              }
              @case ('support') {
                <app-account-support />
              }
              @case ('support-success') {
                <app-account-support-success />
              }
              @case ('terms-and-conditions') {
                <app-web-content [title]="'account.menu.terms' | translate" backLink="/app/account" [url]="termsUrl()" />
              }
              @case ('privacy-policy') {
                <app-web-content [title]="'account.menu.privacy' | translate" backLink="/app/account" [url]="privacyUrl()" />
              }
              @case ('delete-account') {
                <div class="page account-static-page">
                  <h1 class="page-title">{{ 'account.deleteAccount' | translate }}</h1>
                  <p>{{ 'account.deleteAccountDetail' | translate }}</p>
                </div>
              }
              @case ('change-password') {
                <app-account-change-password />
              }
              @case ('vehicles') {
                @if (vehiclesSub() === 'add') {
                  <app-vehicle-add />
                } @else if (vehiclesSub() === 'edit') {
                  <app-vehicle-edit />
                } @else {
                  <div class="page">
                    <ul class="list card account-menu-list">
                      @for (v of vehicles(); track v.id) {
                        <a class="list-item" (click)="vehiclesSub.set('edit'); $event.preventDefault()">
                          <div class="list-item-content">
                            <div class="list-item-title">{{ v.plate }}</div>
                            <div class="list-item-subtitle">
                              @if (v.isDefault) {
                                {{ 'account.vehicleFavorite' | translate }}
                              } @else if (v.label; as label) {
                                {{ translateLabel(label) }}
                              }
                            </div>
                          </div>
                          @if (v.isDefault) {
                            <span class="badge badge-primary">★</span>
                          }
                        </a>
                      }
                    </ul>
                    <button type="button" class="btn btn-primary btn-block mt-2" (click)="vehiclesSub.set('add')">
                      {{ 'account.addVehicle' | translate }}
                    </button>
                  </div>
                }
              }
              @case ('payment-methods') {
                @if (paymentSub() === 'add') {
                  <app-payment-add />
                } @else if (paymentSub() === 'recharge') {
                  <app-account-recharge />
                } @else if (paymentSub() === 'refund') {
                  <app-account-refund />
                } @else {
                  <div class="page">
                    <div class="wallet-card mb-2">
                      <p class="wallet-brand-note">{{ 'account.wallet' | translate }} {{ brand.name }}</p>
                      <p class="wallet-balance">{{ walletService.balance() | euro }}</p>
                    </div>
                    <p class="section-title">{{ 'account.cards' | translate }}</p>
                    <div class="card">
                      Visa •••• 4242 <span class="badge badge-primary">{{ 'account.cardPrimary' | translate }}</span>
                    </div>
                    <div class="row mt-2">
                      <button type="button" class="btn btn-primary btn-sm" (click)="paymentSub.set('recharge')">
                        {{ 'account.recharge.button' | translate }}
                      </button>
                      <button type="button" class="btn btn-secondary btn-sm" (click)="paymentSub.set('refund')">
                        {{ 'account.withdrawBalance' | translate }}
                      </button>
                    </div>
                    <button type="button" class="btn btn-secondary btn-block mt-2" (click)="paymentSub.set('add')">
                      {{ 'account.addCard' | translate }}
                    </button>
                  </div>
                }
              }
            }
          </div>
        }
      </aside>
    </div>

    @if (toast()) {
      <div class="toast">{{ toast() }}</div>
    }
  `,
  styleUrl: './menu.component.css',
})
export class AccountMenuComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);
  readonly walletService = inject(WalletService);

  translateLabel(value: string): string {
    return this.translationService.translateLabel(value);
  }
  readonly user = inject(UserService).user;
  readonly menu = ACCOUNT_MENU;
  readonly vehicles = inject(VehicleService).vehicles;
  readonly selected = signal<string | null>(null);
  readonly vehiclesSub = signal<string | null>(null);
  readonly paymentSub = signal<string | null>(null);
  readonly brand = APP_BRAND;
  readonly helpUrl = computed(() => `${environment.externalContentBaseUrl}/Arinpark/ArinparkFAQ-${this.legalLanguage().faq}.html`);
  readonly termsUrl = computed(() => `${environment.externalContentBaseUrl}/arinpark/CU_${this.legalLanguage().code}.html`);
  readonly privacyUrl = computed(() => `${environment.externalContentBaseUrl}/arinpark/${this.legalLanguage().code}.html`);
  readonly toast = signal('');

  private legalLanguage(): { code: string; faq: string } {
    const language = this.translationService.currentLang$();
    return {
      es: { code: 'es', faq: 'ESP' },
      eu: { code: 'eus', faq: 'EUS' },
      fr: { code: 'fr', faq: 'FRA' },
      uk: { code: 'en', faq: 'ENG' },
    }[language];
  }

  constructor() {
    this.syncFromUrl(this.router.url);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.syncFromUrl(event.urlAfterRedirects);
    });
  }

  ngOnInit(): void {
    if (!this.walletService.loading()) void this.walletService.load();
  }

  readonly selectedLabel = () => {
    const s = this.selected();
    if (!s) return '';
    const item = this.menu.find((m) => m.key === s);
    return item?.labelKey ?? '';
  };

  readonly itemGroupLabel = (index: number) => {
    const item = this.menu[index];
    const prev = this.menu[index - 1];
    return index === 0 || prev.groupKey !== item.groupKey ? item.groupKey : null;
  };

  select(path: string | null): void {
    if (path === 'share') {
      this.shareApp();
      return;
    }
    if (path === 'review') {
      this.rateApp();
      return;
    }
    this.selected.set(path);
    this.vehiclesSub.set(null);
    this.paymentSub.set(null);
  }

  goBack(): void {
    const current = this.selected();
    if (current === 'payment-methods' && this.paymentSub()) {
      this.paymentSub.set(null);
    } else if (current === 'vehicles' && this.vehiclesSub()) {
      this.vehiclesSub.set(null);
    } else {
      this.selected.set(null);
      this.vehiclesSub.set(null);
      this.paymentSub.set(null);
    }
  }

  private async shareApp(): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: this.brand.name,
          text: this.translationService.translate('account.shareText', { brand: this.brand.name }),
          url: this.brand.storeUrl,
        });
      } catch {
        /* user dismissed share */
      }
    } else {
      try {
        await navigator.clipboard.writeText(this.brand.storeUrl);
        this.showToast(this.translationService.translate('account.linkCopied'));
      } catch {
        /* clipboard unavailable */
      }
    }
  }

  private rateApp(): void {
    window.open(this.brand.storeUrl, '_blank');
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
  }

  private syncFromUrl(url: string): void {
    if (!url.startsWith('/app/account')) return;

    const accountPath = url.replace('/app/account', '').replace(/^\//, '');

    if (!accountPath) {
      this.select(null);
      return;
    }

    if (accountPath.startsWith('vehicles')) {
      this.select('vehicles');
      if (accountPath.endsWith('/add')) this.vehiclesSub.set('add');
      if (accountPath.endsWith('/edit')) this.vehiclesSub.set('edit');
      return;
    }

    if (accountPath.startsWith('payment-methods')) {
      this.select('payment-methods');
      if (accountPath.endsWith('/add')) this.paymentSub.set('add');
      return;
    }

    if (accountPath === 'recharge') {
      this.selected.set('payment-methods');
      this.paymentSub.set('recharge');
      return;
    }
    if (accountPath === 'refund') {
      this.selected.set('payment-methods');
      this.paymentSub.set('refund');
      return;
    }
    if (accountPath === 'support-success' || accountPath.startsWith('support/')) {
      this.selected.set('support');
      return;
    }

    const item = this.menu.find((m) => m.path.endsWith(accountPath));
    if (item?.key === 'share' || item?.key === 'review') {
      this.select(null);
      this.select(item.key);
      return;
    }
    this.select(item?.key ?? null);
  }
}
