import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { ACCOUNT_MENU, MOCK_USER, MOCK_VEHICLES } from '../../../shared/mock-data';
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

import { APP_BRAND } from '../../../shared/constants/app-brand';

const STORE_URL = 'https://play.google.com/store/apps/details?id=com.gerteksa.r.c.mugipark';

@Component({
  selector: 'app-account-menu',
  imports: [
    RouterLink,
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
        <h1 class="page-title">Mi cuenta</h1>
        <div class="account-profile">
          <span class="account-avatar">{{ user.name.charAt(0) }}</span>
          <div><strong>{{ user.name }} {{ user.surname }}</strong><span>{{ user.email }}</span><span>{{ user.balance }} €</span></div>
        </div>
        <div class="card wallet-card mb-2 mobile-wallet">
          <p>Saldo monedero</p><p class="wallet-balance">{{ user.balance }} €</p>
        </div>
        <ul class="list account-list">
          @for (item of menu; track item.key; let i = $index) {
            @if (itemGroupLabel(i); as group) {
              <li class="menu-group">{{ group }}</li>
            }
            <button type="button" class="list-item account-item" [class.active]="selected() === item.key" (click)="select(item.key)">
              <svg class="account-item-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path [attr.d]="iconPath(item.icon)"></path>
              </svg>
              <div class="list-item-content"><div class="list-item-title">{{ item.labelKey }}</div></div>
              <span class="list-item-chevron">›</span>
            </button>
          }
        </ul>
        <a routerLink="/auth/login" class="btn btn-ghost btn-block mt-2">Cerrar sesión</a>
        <button type="button" class="btn btn-danger btn-block mt-2" (click)="select('delete-account')">Eliminar cuenta</button>
      </section>
      <aside class="account-detail">
        @if (!selected()) {
          <div class="detail-placeholder">Selecciona una opción para ver y editar sus datos</div>
        } @else {
          <div class="detail-toolbar">
            <span class="back-btn" (click)="goBack()">←</span>
            <strong>{{ selectedLabel() }}</strong>
            <span class="detail-toolbar-actions"></span>
          </div>
          <div class="detail-content">
            @switch (selected()) {
              @case ('profile') { <app-account-profile /> }
              @case ('settings') { <app-account-settings /> }
              @case ('notifications') { <app-account-notifications /> }
              @case ('tax-data') { <app-account-tax-data /> }
              @case ('help') { <app-web-content title="Ayuda" url="https://arinpark.gerteksa.eus/Arinpark/ArinparkFAQ-ESP.html" /> }
              @case ('about') { <app-account-about /> }
              @case ('support') { <app-account-support /> }
              @case ('support-success') { <app-account-support-success /> }
              @case ('terms-and-conditions') { <app-web-content title="Términos y condiciones" url="https://arinpark.gerteksa.eus/arinpark/CU_es.html" /> }
              @case ('privacy-policy') { <app-web-content title="Política de privacidad" url="https://arinpark.gerteksa.eus/arinpark/es.html" /> }
              @case ('delete-account') {
                <div class="page account-static-page">
                  <h1 class="page-title">Eliminar cuenta</h1>
                  <p>Esta acción eliminaría tu cuenta de forma permanente tras confirmación.</p>
                </div>
              }
              @case ('change-password') { <app-account-change-password /> }
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
                            <div class="list-item-subtitle">{{ v.isDefault ? 'Vehículo favorito' : (v.label ?? '') }}</div>
                          </div>
                          @if (v.isDefault) { <span class="badge badge-primary">★</span> }
                        </a>
                      }
                    </ul>
                    <button type="button" class="btn btn-primary btn-block mt-2" (click)="vehiclesSub.set('add')">Añadir vehículo</button>
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
                      <p style="opacity:0.9">Monedero {{ brand.name }}</p>
                      <p class="wallet-balance">{{ user.balance }} €</p>
                    </div>
                    <p class="section-title">Tarjetas</p>
                    <div class="card">Visa •••• 4242 <span class="badge badge-primary">Principal</span></div>
                    <div class="row mt-2">
                      <button type="button" class="btn btn-primary btn-sm" (click)="paymentSub.set('recharge')">Recargar</button>
                      <button type="button" class="btn btn-secondary btn-sm" (click)="paymentSub.set('refund')">Retirar saldo</button>
                    </div>
                    <button type="button" class="btn btn-secondary btn-block mt-2" (click)="paymentSub.set('add')">Añadir tarjeta</button>
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
  styles: [`
    .account-layout { min-height:100%; }
    .account-master { padding:1rem; background:var(--color-surface); }
    .account-profile { display:flex; align-items:center; gap:.7rem; margin:.8rem 0 1rem; }
    .account-avatar { display:grid; place-items:center; width:38px; height:38px; border-radius:50%; background:var(--color-accent-soft); color:var(--color-primary); font-weight:800; }
    .account-profile div { display:flex; flex-direction:column; font-size:.8rem; }
    .account-profile span { color:var(--color-text-muted); line-height:1.3; }
    .menu-group { list-style:none; margin:.75rem 0 .25rem; font-size:.76rem; font-weight:800; padding:0 .9rem; color:var(--color-text); }
    .account-list { overflow:hidden; border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); }
    .account-item { width:100%; border:0; text-align:left; }
    .account-list .list-item.active {
      background:var(--color-active);
      color:var(--color-primary-dark);
      box-shadow:inset 4px 0 0 var(--color-primary);
    }
    .account-list .list-item.active .list-item-title { font-weight:800; }
    .account-list .list-item.active .list-item-chevron { color:var(--color-primary); font-weight:900; }
    .account-item-icon { width:20px; height:20px; flex-shrink:0; fill:var(--color-secondary); }
    .account-item.active .account-item-icon { fill:var(--color-primary); }
    .account-detail { display:none; }
    .back-btn { cursor:pointer; font-size:1.2rem; padding:.2rem .5rem; }
    .detail-toolbar { display:grid; grid-template-columns:auto 1fr auto; gap:.8rem; align-items:center; padding:1rem; border-bottom:1px solid var(--color-border); }
    .detail-toolbar strong { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .detail-toolbar-actions { display:flex; align-items:center; gap:.7rem; color:var(--color-text-muted); font-size:1rem; }
    .detail-placeholder { height:100%; min-height:380px; display:flex; align-items:center; justify-content:center; color:var(--color-text-muted); padding:1.5rem; text-align:center; }
    .detail-content { flex:1; overflow:hidden; }
    .toast { position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); padding:.65rem 1.25rem; border-radius:999px; background:var(--color-primary-dark); color:#fff; font-size:.85rem; font-weight:600; z-index:2000; animation:fadeInUp .25s ease-out; }
    @keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
    @media (min-width:960px) {
      .account-layout { display:grid; grid-template-columns:420px minmax(0,1fr); height:100%; min-height:0; overflow:hidden; }
      .account-master { min-height:0; overflow-y:auto; overscroll-behavior:contain; scrollbar-gutter:stable; border-right:1px solid var(--color-border); }
      .mobile-wallet { display:none; }
      .account-list { border:0; background:transparent; }
      .account-list .list-item { padding:.76rem .3rem; background:transparent; }
      .account-detail { display:flex; min-height:0; flex-direction:column; margin:.55rem; border:1px solid var(--color-border); border-radius:22px; box-shadow:var(--shadow-sm); overflow:hidden; }
    }
    @media (max-width:959px) {
      .account-detail { display:block; border-top:1px solid var(--color-border); }
    }
  `],
})
export class AccountMenuComponent {
  private readonly router = inject(Router);
  readonly menu = ACCOUNT_MENU;
  readonly user = MOCK_USER;
  readonly vehicles = MOCK_VEHICLES;
  readonly selected = signal<string | null>(null);
  readonly vehiclesSub = signal<string | null>(null);
  readonly paymentSub = signal<string | null>(null);
  readonly brand = APP_BRAND;
  readonly toast = signal('');
  private toastTimer?: ReturnType<typeof setTimeout>;
  private readonly iconByKey: Record<string, string> = {
    profile: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    tax: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 12H7v-2h10v2zm0-4H7V9h10v2zm0-4H7V5h10v2z',
    lock: 'M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9zm3 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
    payment: 'M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM3 8V6h18v2H3zm0 10v-6h18v6H3z',
    vehicle: 'M18.92 6.01C18.72 5.42 18.16 5 17.52 5H6.48c-.64 0-1.2.42-1.4 1.01L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM6.5 16A1.5 1.5 0 1 1 6.5 13a1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
    notifications: 'M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z',
    settings: 'M19.14 12.94c.04-.31.06-.62.06-.94s-.02-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.95l-.36-2.54A.5.5 0 0 0 13.89 2h-3.78a.5.5 0 0 0-.49.42L9.26 4.96c-.58.24-1.12.55-1.63.95l-2.39-.96a.5.5 0 0 0-.6.22L2.72 8.5a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.07.63-.07.95s.03.63.08.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.62.22l2.39-.96c.5.39 1.05.71 1.63.95l.36 2.54c.04.24.25.42.49.42h3.78c.25 0 .45-.18.49-.42l.36-2.54c.58-.24 1.12-.56 1.63-.95l2.39.96c.23.09.49 0 .62-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z',
    help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm.1 15h-2.2v-2.2h2.2V17zm2.28-7.36-.98 1c-.79.8-1.3 1.44-1.3 2.96h-2.2v-.55c0-1.21.5-2.3 1.3-3.1l1.35-1.37a1.92 1.92 0 1 0-3.27-1.36H7.1a4.1 4.1 0 1 1 7.28 2.42z',
    share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a2.5 2.5 0 0 0 0-1.39l7-4.11A3 3 0 1 0 15 5a3 3 0 0 0 .04.48l-7 4.12a3 3 0 1 0 0 4.8l7.13 4.2A3 3 0 1 0 18 16.08z',
    review: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z',
    terms: 'M7 3h8l4 4v14H7V3zm8 1.5V8h3.5L15 4.5zM9 11h8v1.8H9V11zm0 3.2h8V16H9v-1.8z',
    privacy: 'M12 2 4 5v6c0 5.25 3.4 10.18 8 11 4.6-.82 8-5.75 8-11V5l-8-3zm0 10.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5zM12 18c-1.8 0-3.38-.86-4.38-2.2.99-1.34 2.58-2.2 4.38-2.2 1.8 0 3.38.86 4.38 2.2-1 1.34-2.58 2.2-4.38 2.2z',
    support: 'M11 18h2v2h-2zm1-16C6.48 2 2 6.48 2 12v2h2a2 2 0 0 0 2-2v-2a6 6 0 0 1 12 0v4h-3v-2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5h7a2 2 0 0 0 2-2v-1h2v-2c0-5.52-4.48-10-10-10z',
    about: 'M11 9h2V7h-2v2zm0 8h2v-6h-2v6zm1-15a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  };

  constructor() {
    this.syncFromUrl(this.router.url);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.syncFromUrl(event.urlAfterRedirects);
    });
  }

  readonly selectedLabel = () => {
    const s = this.selected();
    if (!s) return '';
    const item = this.menu.find(m => m.key === s);
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
        await navigator.share({ title: this.brand.name, text: `Descarga ${this.brand.name}`, url: STORE_URL });
      } catch { }
    } else {
      try {
        await navigator.clipboard.writeText(STORE_URL);
        this.showToast('Enlace copiado');
      } catch { }
    }
  }

  private rateApp(): void {
    window.open(STORE_URL, '_blank');
  }

  private showToast(msg: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set(msg);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2500);
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
    if (accountPath === 'support-success') {
      this.selected.set(accountPath);
      return;
    }

    const item = this.menu.find(m => m.path.endsWith(accountPath));
    if (item?.key === 'share' || item?.key === 'review') {
      this.select(null);
      this.select(item.key);
      return;
    }
    this.select(item?.key ?? null);
  }
}
