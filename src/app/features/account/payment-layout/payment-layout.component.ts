import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { UserService } from '../../../core/services/user.service';
import { WalletService } from '../../../core/services/wallet.service';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-payment-layout',
  imports: [RouterLink, SplitViewComponent, TranslatePipe, DecimalPipe, ResultModalComponent],
  template: `
    <app-split-view [hideList]="isChildRoute()" [hideDetail]="!isChildRoute()">
      <div splitList class="page">
        <h1 class="page-title">{{ 'account.menu.paymentMethods' | translate }}</h1>
        @if (walletService.source() === 'error') {
          <p class="data-notice" role="alert">No se pudieron cargar la billetera y las tarjetas.</p>
        }
        <div class="wallet-card payment-wallet-card mb-2">
          <div class="wallet-section">
            <strong>{{ 'account.wallet' | translate }}</strong>
            <p class="wallet-balance-large">{{ walletService.balance() | number: '1.2-2' }} €</p>
          </div>
        </div>
        <p class="section-title">{{ 'account.cards' | translate }}</p>
        <div class="card">
          @for (card of walletService.cards(); track card.id) {
            <div class="card-item">
              <span class="card-brand-mark">
                @if (brandAsset(card.brand); as asset) {
                  <img [src]="asset" [alt]="card.brand" />
                } @else {
                  <span>{{ card.brand.slice(0, 2).toUpperCase() }}</span>
                }
              </span>
              <div class="card-info">
                <strong>{{ card.brand }} •••• {{ card.last4 }}</strong>
                <span>{{ card.cardholderName }}</span>
                <small>{{ card.expiryDate }}</small>
              </div>
              @if (walletService.defaultCardId() === card.id) {
                <span class="primary-label">{{ 'account.cardPrimary' | translate }}</span>
              }
              <button
                type="button"
                class="kebab-button"
                (click)="toggleCardMenu(card.id)"
                [attr.aria-label]="'account.cardOptions' | translate: { brand: card.brand, last4: card.last4 }"
                [attr.aria-expanded]="activeCardMenu() === card.id"
              >
                ⋮
              </button>
              @if (activeCardMenu() === card.id) {
                <div class="card-menu">
                  <button type="button" (click)="rechargeCard(card.id)"><span>＋</span> {{ 'account.recharge.button' | translate }}</button>
                  <button type="button" (click)="refundToCard(card.id)"><span>↗</span> {{ 'account.withdrawBalance' | translate }}</button>
                  @if (walletService.defaultCardId() !== card.id) {
                    <button type="button" (click)="setAsDefault(card.id)"><span>☆</span> {{ 'account.setPrimaryCard' | translate }}</button>
                  }
                  <button type="button" class="delete-option" (click)="requestDelete(card.id)">
                    <span>▣</span> {{ 'account.deleteCard' | translate }}
                  </button>
                </div>
              }
            </div>
          }
          @if (walletService.cards().length === 0) {
            <p class="empty-cards">{{ 'account.cardsEmpty' | translate }}</p>
          }
        </div>
        <div class="payment-actions mt-2">
          <button type="button" class="btn btn-primary btn-sm" [disabled]="walletService.cards().length === 0" (click)="goToRecharge()">
            {{ 'dashboard.recharge' | translate }}
          </button>
          <a routerLink="/app/account/payment-methods/refund" class="btn btn-secondary btn-sm">{{
            'account.withdrawBalance' | translate
          }}</a>
        </div>
        <a routerLink="/app/account/payment-methods/add" class="btn btn-secondary btn-block mt-2">{{ 'account.addCard' | translate }}</a>
      </div>
    </app-split-view>
    @if (cardToDelete()) {
      <app-result-modal
        type="confirmation"
        [title]="'account.deleteCard' | translate"
        [message]="'account.deleteCardDetail' | translate"
        [primaryText]="'common.delete' | translate"
        [secondaryText]="'common.cancel' | translate"
        (primaryAction)="confirmDelete()"
        (secondaryAction)="cardToDelete.set(null)"
      />
    }
  `,
  styles: `
    .payment-wallet-card {
      position: relative;
      isolation: isolate;
      display: flex;
      aspect-ratio: 382 / 220;
      overflow: hidden;
      padding: 1.4rem 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.58);
      border-radius: 18px;
      background:
        radial-gradient(circle at 85% 15%, rgba(82, 202, 192, 0.42), transparent 36%),
        linear-gradient(120deg, #103b3c 0%, #11605f 48%, #258e87 100%);
      box-shadow:
        inset 0 0 0 1px rgba(0, 0, 0, 0.2),
        0 5px 14px rgba(19, 68, 65, 0.18);
    }
    .data-notice {
      margin: 0 0 1rem;
      padding: 0.75rem 0.9rem;
      border: 1px solid #e5b85c;
      border-radius: var(--radius-md);
      background: #fff8e7;
      color: #714b00;
    }
    .payment-wallet-card::before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 0;
      background: url('/assets/brand/wallet-watermark.svg') center / 100% 100% no-repeat;
    }
    .payment-wallet-card::after {
      content: none;
    }
    .wallet-section {
      align-self: flex-end;
      padding: 0;
      color: #fff;
    }
    .wallet-section > strong {
      font-size: var(--text-sm);
      font-weight: var(--font-bold);
    }
    .wallet-balance-large {
      font-size: clamp(1.65rem, 3vw, 2rem);
      font-weight: var(--font-extra);
      color: #fff;
      margin: 0.25rem 0 0;
      letter-spacing: 0.02em;
    }
    .payment-actions button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
      filter: grayscale(0.35);
    }
    .card-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-height: 82px;
      padding: 0.8rem 0.75rem;
      border-bottom: 1px solid var(--color-border);
    }
    .card-item:last-child {
      border-bottom: 0;
    }
    .card-brand-mark {
      display: grid;
      place-items: center;
      width: 54px;
      height: 34px;
      flex-shrink: 0;
      overflow: hidden;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background: #fff;
      color: var(--color-primary);
      font-size: var(--text-xs);
      font-weight: var(--font-extra);
    }
    .card-brand-mark img {
      display: block;
      width: 46px;
      height: 27px;
      object-fit: contain;
    }
    .card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .card-info strong {
      color: var(--color-text);
      font-size: var(--text-sm);
      letter-spacing: 0.01em;
    }
    .card-info span {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .card-info small {
      font-size: var(--text-2xs);
      color: var(--color-text-muted);
    }
    .primary-label {
      padding: 0.22rem 0.5rem;
      border-radius: 999px;
      background: var(--color-active);
      color: var(--color-primary-dark);
      font-size: var(--text-2xs);
      font-weight: var(--font-extra);
      white-space: nowrap;
    }
    .kebab-button {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--color-text);
      font-size: 1.7rem;
      line-height: 1;
      cursor: pointer;
    }
    .kebab-button:hover,
    .kebab-button[aria-expanded='true'] {
      background: var(--color-background);
    }
    .card-menu {
      position: absolute;
      z-index: 20;
      right: 0.5rem;
      top: 3.2rem;
      display: grid;
      min-width: 235px;
      padding: 0.4rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-md);
    }
    .card-menu button {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      width: 100%;
      padding: 0.7rem 0.8rem;
      border: 0;
      background: transparent;
      color: var(--color-text);
      text-align: left;
      cursor: pointer;
      border-radius: var(--radius-sm);
    }
    .card-menu button:hover {
      background: var(--color-background);
    }
    .card-menu button span {
      width: 1.2rem;
      font-size: 1.15rem;
    }
    .card-menu .delete-option {
      color: var(--color-error);
    }
    .empty-cards {
      padding: 1rem;
      text-align: center;
      color: var(--color-text-muted);
    }
  `,
})
export class PaymentLayoutComponent implements OnInit {
  private readonly userService = inject(UserService);
  readonly walletService = inject(WalletService);
  readonly user = this.userService.user;
  private readonly router = inject(Router);
  readonly cardToDelete = signal<string | null>(null);
  readonly activeCardMenu = signal<string | null>(null);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  ngOnInit(): void {
    void this.walletService.load();
  }
  isChildRoute = () => {
    const path = this.url().split('?')[0].replace(/\/$/, '');
    return path !== '/app/account/payment-methods';
  };
  toggleCardMenu(id: string): void {
    this.activeCardMenu.update((active) => (active === id ? null : id));
  }
  @HostListener('document:click', ['$event'])
  closeCardMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && !target.closest('.kebab-button, .card-menu')) this.activeCardMenu.set(null);
  }

  @HostListener('document:keydown.escape')
  closeCardMenuOnEscape(): void {
    this.activeCardMenu.set(null);
  }
  async setAsDefault(id: string): Promise<void> {
    await this.walletService.setDefaultCard(id);
    this.activeCardMenu.set(null);
  }
  requestDelete(id: string): void {
    this.activeCardMenu.set(null);
    this.cardToDelete.set(id);
  }
  rechargeCard(id: string): void {
    this.activeCardMenu.set(null);
    void this.router.navigate(['/app/account/payment-methods/recharge'], { queryParams: { cardId: id } });
  }
  goToRecharge(): void {
    const cardId = this.walletService.defaultCardId();
    if (!this.walletService.cards().length || !cardId) return;
    void this.router.navigate(['/app/account/payment-methods/recharge'], { queryParams: { cardId } });
  }
  refundToCard(id: string): void {
    this.activeCardMenu.set(null);
    void this.router.navigate(['/app/account/payment-methods/refund'], { queryParams: { cardId: id } });
  }
  async confirmDelete(): Promise<void> {
    const id = this.cardToDelete();
    if (id) await this.walletService.removeCard(id);
    this.cardToDelete.set(null);
  }
  brandAsset(brand: string): string | null {
    const normalized = brand.toLowerCase();
    if (normalized === 'visa') return '/assets/payment/visa.svg';
    if (normalized === 'mastercard') return '/assets/payment/mastercard.svg';
    return null;
  }
}
