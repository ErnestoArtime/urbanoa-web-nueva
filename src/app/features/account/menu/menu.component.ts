import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { ACCOUNT_MENU, MOCK_USER, MOCK_VEHICLES } from '../../../shared/mock-data';
import { WalletService } from '../../../core/services/wallet.service';
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

import { APP_BRAND } from '../../../shared/constants/app-brand';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-account-menu',
  imports: [
    RouterLink,
    TranslatePipe,
    DecimalPipe,
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
          <span class="account-avatar">{{ user.name.charAt(0) }}</span>
          <div>
            <strong>{{ user.name }} {{ user.surname }}</strong
            ><span>{{ user.email }}</span
            ><span>{{ walletService.balance() | number: '1.2-2' }} €</span>
          </div>
        </div>
        <div class="card wallet-card mb-2 mobile-wallet">
          <p>{{ 'account.walletBalance' | translate }}</p>
          <p class="wallet-balance">{{ walletService.balance() | number: '1.2-2' }} €</p>
        </div>
        <ul class="list account-list">
          @for (item of menu; track item.key; let i = $index) {
            @if (itemGroupLabel(i); as group) {
              <li class="menu-group">{{ group | translate }}</li>
            }
            <button type="button" class="list-item account-item" [class.active]="selected() === item.key" (click)="select(item.key)">
              <svg class="account-item-icon" viewBox="0 -960 960 960" aria-hidden="true">
                <path [attr.d]="iconPath(item.icon)"></path>
              </svg>
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
                    <ul class="list card" style="padding:0;overflow:hidden">
                      @for (v of vehicles; track v.id) {
                        <a class="list-item" (click)="vehiclesSub.set('edit'); $event.preventDefault()">
                          <div class="list-item-content">
                            <div class="list-item-title">{{ v.plate }}</div>
                            <div class="list-item-subtitle">
                              {{ v.isDefault ? ('account.vehicleFavorite' | translate) : (v.label ?? '' | translate) }}
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
                      <p style="opacity:0.9">{{ 'account.wallet' | translate }} {{ brand.name }}</p>
                      <p class="wallet-balance">{{ user.balance | number: '1.2-2' }} €</p>
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
  styles: [
    `
      .account-layout {
        min-height: 100%;
      }
      .account-master {
        padding: 1rem;
        background: var(--color-surface);
      }
      .account-profile {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        margin: 0.8rem 0 1rem;
      }
      .account-avatar {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--color-accent-soft);
        color: var(--color-primary);
        font-weight: var(--font-extra);
      }
      .account-profile div {
        display: flex;
        flex-direction: column;
        font-size: var(--text-sm);
      }
      .account-profile span {
        color: var(--color-text-muted);
        line-height: var(--line-normal);
      }
      .menu-group {
        list-style: none;
        margin: 0.75rem 0 0.25rem;
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        padding: 0 0.9rem;
        color: var(--color-text);
      }
      .account-list {
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      .account-item {
        width: 100%;
        border: 0;
        text-align: left;
      }
      .account-list .list-item.active {
        background: var(--color-active);
        color: var(--color-primary-dark);
        box-shadow: inset 4px 0 0 var(--color-primary);
      }
      .account-list .list-item.active .list-item-title {
        font-weight: var(--font-extra);
      }
      .account-list .list-item.active .list-item-chevron {
        color: var(--color-primary);
        font-weight: var(--font-extra);
      }
      .account-item-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        fill: var(--color-secondary);
      }
      .account-item.active .account-item-icon {
        fill: var(--color-primary);
      }
      .account-detail {
        display: none;
      }
      .back-btn {
        cursor: pointer;
        font-size: var(--text-lg);
        padding: 0.2rem 0.5rem;
      }
      .detail-toolbar {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.8rem;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--color-border);
      }
      .detail-toolbar strong {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .detail-toolbar-actions {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        color: var(--color-text-muted);
        font-size: var(--text-base);
      }
      .detail-placeholder {
        height: 100%;
        min-height: 380px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-muted);
        padding: 1.5rem;
        text-align: center;
      }
      .detail-content {
        flex: 1;
        overflow: hidden;
      }
      .toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.65rem 1.25rem;
        border-radius: 999px;
        background: var(--color-primary-dark);
        color: #fff;
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        z-index: 2000;
        animation: fadeInUp 0.25s ease-out;
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      @media (min-width: 960px) {
        .account-layout {
          display: grid;
          grid-template-columns: 420px minmax(0, 1fr);
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }
        .account-master {
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
          border-right: 1px solid var(--color-border);
        }
        .mobile-wallet {
          display: none;
        }
        .account-list {
          border: 0;
          background: transparent;
        }
        .account-list .list-item {
          padding: 0.76rem 0.3rem;
          background: transparent;
        }
        .account-detail {
          display: flex;
          min-height: 0;
          flex-direction: column;
          margin: 0.55rem;
          border: 1px solid var(--color-border);
          border-radius: 22px;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
      }
      .account-actions {
        padding: 0.75rem 0.35rem 0;
      }
      @media (max-width: 959px) {
        .account-master {
          padding-bottom: 5rem;
        }
        .account-actions {
          position: fixed;
          right: 0;
          bottom: 0;
          left: 0;
          display: flex;
          gap: 0.65rem;
          padding: 0.65rem 1rem calc(0.65rem + env(safe-area-inset-bottom, 0px));
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
          z-index: 100;
        }
        .account-actions .btn {
          flex: 1;
          margin: 0 !important;
        }
        .account-detail {
          display: block;
          border-top: 1px solid var(--color-border);
        }
      }
    `,
  ],
})
export class AccountMenuComponent {
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);
  readonly walletService = inject(WalletService);
  readonly user = MOCK_USER;
  readonly menu = ACCOUNT_MENU;
  readonly vehicles = MOCK_VEHICLES;
  readonly selected = signal<string | null>(null);
  readonly vehiclesSub = signal<string | null>(null);
  readonly paymentSub = signal<string | null>(null);
  readonly brand = APP_BRAND;
  readonly helpUrl = computed(() => `${environment.externalContentBaseUrl}/Arinpark/ArinparkFAQ-${this.legalLanguage().faq}.html`);
  readonly termsUrl = computed(() => `${environment.externalContentBaseUrl}/arinpark/CU_${this.legalLanguage().code}.html`);
  readonly privacyUrl = computed(() => `${environment.externalContentBaseUrl}/arinpark/${this.legalLanguage().code}.html`);
  readonly toast = signal('');
  private readonly iconByKey: Record<string, string> = {
    profile:
      'M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-240v-32q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v32q0 33-23.5 56.5T720-160H240q-33 0-56.5-23.5T160-240Zm80 0h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Z',
    tax: 'M240-80q-50 0-85-35t-35-85v-80q0-17 11.5-28.5T160-320h80v-536q0-7 6-9.5t11 2.5l29 29q6 6 14 6t14-6l32-32q6-6 14-6t14 6l32 32q6 6 14 6t14-6l32-32q6-6 14-6t14 6l32 32q6 6 14 6t14-6l32-32q6-6 14-6t14 6l32 32q6 6 14 6t14-6l29-29q5-5 11-2.5t6 9.5v656q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-560H320v440h320q17 0 28.5 11.5T680-280v80q0 17 11.5 28.5T720-160ZM400-680h160q17 0 28.5 11.5T600-640q0 17-11.5 28.5T560-600H400q-17 0-28.5-11.5T360-640q0-17 11.5-28.5T400-680Zm0 120h160q17 0 28.5 11.5T600-520q0 17-11.5 28.5T560-480H400q-17 0-28.5-11.5T360-520q0-17 11.5-28.5T400-560Z',
    lock: 'M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-160q33 0 56.5-23.5T560-400q0-33-23.5-56.5T480-480q-33 0-56.5 23.5T400-400q0 33 23.5 56.5T480-320ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80Z',
    payment:
      'M880-720v480q0 33-23.5 56.5T800-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720Zm-720 80h640v-80H160v80Zm0 160v240h640v-240H160Zm0 240v-480 480Z',
    vehicle:
      'M240-200v20q0 25-17.5 42.5T180-120q-25 0-42.5-17.5T120-180v-286q0-7 1-14t3-13l75-213q8-24 29-39t47-15h410q26 0 47 15t29 39l75 213q2 6 3 13t1 14v286q0 25-17.5 42.5T780-120q-25 0-42.5-17.5T720-180v-20H240Zm-8-360h496l-42-120H274l-42 120Zm-32 80v200-200Zm100 160q25 0 42.5-17.5T360-380q0-25-17.5-42.5T300-440q-25 0-42.5 17.5T240-380q0 25 17.5 42.5T300-320Zm360 0q25 0 42.5-17.5T720-380q0-25-17.5-42.5T660-440q-25 0-42.5 17.5T600-380q0 25 17.5 42.5T660-320Zm-460 40h560v-200H200v200Z',
    notifications:
      'M200-200q-17 0-28.5-11.5T160-240q0-17 11.5-28.5T200-280h40v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h40q17 0 28.5 11.5T800-240q0 17-11.5 28.5T760-200H200Zm280-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z',
    settings:
      'M433-80q-27 0-46.5-18T363-142l-9-66q-13-5-24.5-12T307-235l-62 26q-25 11-50 2t-39-32l-47-82q-14-23-8-49t27-43l53-40q-1-7-1-13.5v-27q0-6.5 1-13.5l-53-40q-21-17-27-43t8-49l47-82q14-23 39-32t50 2l62 26q11-8 23-15t24-12l9-66q4-26 23.5-44t46.5-18h94q27 0 46.5 18t23.5 44l9 66q13 5 24.5 12t22.5 15l62-26q25-11 50-2t39 32l47 82q14 23 8 49t-27 43l-53 40q1 7 1 13.5v27q0 6.5-2 13.5l53 40q21 17 27 43t-8 49l-48 82q-14 23-39 32t-50-2l-60-26q-11 8-23 15t-24 12l-9 66q-4 26-23.5 44T527-80h-94Zm7-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z',
    help: 'M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm-4-172q15 0 25.5-10.5T512-368q0-15-10.5-25.5T476-404q-15 0-25.5 10.5T440-368q0 15 10.5 25.5T476-332Zm36-176q23-22 39.5-48t16.5-58q0-51-41.5-83.5T484-720q-38 0-72.5 16T359-655q-7 12-4.5 25.5T368-609q14 8 29 5t25-17q11-15 27.5-23t34.5-8q21 0 37 12.5t16 33.5q0 17-11.5 32T507-550q-23 20-40.5 44T444-462q-3 9-2.5 19t1.5 21q2 15 12.5 24.5T480-388q15 0 25.5-9.5T518-422q2-12 9.5-22.5T544-460l32-32Z',
    share:
      'M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440ZM680-680q17 0 28.5-11.5T720-700q0-17-11.5-28.5T680-740q-17 0-28.5 11.5T640-700q0 17 11.5 28.5T680-680Z',
    review:
      'm354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143Zm126 18L314-169q-11 7-23 6t-21-8q-9-7-14-17.5t-2-23.5l44-189-147-127q-10-9-12.5-20.5T140-571q4-11 12-18t22-9l194-17 75-178q5-12 15.5-18t21.5-6q11 0 21.5 6t15.5 18l75 178 194 17q14 2 22 9t12 18q4 11 1.5 22.5T809-528L662-401l44 189q3 13-2 23.5T690-171q-9 7-21 8t-23-6L480-269Zm0-201Z',
    terms:
      'M360-240h240q17 0 28.5-11.5T640-280q0-17-11.5-28.5T600-320H360q-17 0-28.5 11.5T320-280q0 17 11.5 28.5T360-240Zm0-160h240q17 0 28.5-11.5T640-440q0-17-11.5-28.5T600-480H360q-17 0-28.5 11.5T320-440q0 17 11.5 28.5T360-400ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h287q16 0 30.5 6t25.5 17l194 194q11 11 17 25.5t6 30.5v447q0 33-23.5 56.5T720-80H240Zm280-560v-160H240v640h480v-440H560q-17 0-28.5-11.5T520-640ZM240-800v200-200 640-640Z',
    privacy:
      'M508.5-291.5Q520-303 520-320v-160q0-17-11.5-28.5T480-520q-17 0-28.5 11.5T440-480v160q0 17 11.5 28.5T480-280q17 0 28.5-11.5Zm0-320Q520-623 520-640t-11.5-28.5Q497-680 480-680t-28.5 11.5Q440-657 440-640t11.5 28.5Q463-600 480-600t28.5-11.5ZM467-85q-6-1-12-3-135-45-215-166.5T160-516v-189q0-25 14.5-45t37.5-29l240-90q14-5 28-5t28 5l240 90q23 9 37.5 29t14.5 45v189q0 140-80 261.5T505-88q-6 2-12 3t-13 1q-7 0-13-1Zm13-79q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Zm0-316Z',
    support:
      'M480-120q-17 0-28.5-11.5T440-160q0-17 11.5-28.5T480-200h280v-284q0-117-81.5-198.5T480-764q-117 0-198.5 81.5T200-484v204q0 17-11.5 28.5T160-240q-33 0-56.5-23.5T80-320v-80q0-21 10.5-39.5T120-469l3-53q8-68 39.5-126t79-101q47.5-43 109-67T480-840q68 0 129 24t109 66.5Q766-707 797-649t40 126l3 52q19 9 29.5 27t10.5 38v92q0 20-10.5 38T840-249v49q0 33-23.5 56.5T760-120H480ZM331.5-411.5Q320-423 320-440t11.5-28.5Q343-480 360-480t28.5 11.5Q400-457 400-440t-11.5 28.5Q377-400 360-400t-28.5-11.5Zm240 0Q560-423 560-440t11.5-28.5Q583-480 600-480t28.5 11.5Q640-457 640-440t-11.5 28.5Q617-400 600-400t-28.5-11.5ZM241-462q-7-106 64-182t177-76q89 0 156.5 56.5T720-519q-91-1-167.5-49T435-698q-16 80-67.5 142.5T241-462Z',
    about:
      'M508.5-291.5Q520-303 520-320v-160q0-17-11.5-28.5T480-520q-17 0-28.5 11.5T440-480v160q0 17 11.5 28.5T480-280q17 0 28.5-11.5Zm0-320Q520-623 520-640t-11.5-28.5Q497-680 480-680t-28.5 11.5Q440-657 440-640t11.5 28.5Q463-600 480-600t28.5-11.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z',
  };

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

  iconPath(icon: string): string {
    return this.iconByKey[icon] ?? this.iconByKey['about'];
  }

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
