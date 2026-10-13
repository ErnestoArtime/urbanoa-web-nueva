import { PaymentAddComponent } from '../payment-add/payment-add.component';
import { AccountRechargeComponent } from '../recharge/recharge.component';
import { AccountRefundComponent } from '../refund/refund.component';
import { Component, HostListener, inject, input, OnInit, signal, ViewChild } from '@angular/core';
import { NgTemplateOutlet, DecimalPipe } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { UserService } from '../../../core/services/user.service';
import { WalletService } from '../../../core/services/wallet.service';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-payment-layout',
  imports: [
    NgTemplateOutlet,
    PaymentAddComponent,
    AccountRechargeComponent,
    AccountRefundComponent,
    SplitViewComponent,
    TranslatePipe,
    DecimalPipe,
    ResultModalComponent,
    LoaderComponent,
  ],
  template: `
    <app-loader [visible]="updating()" [message]="'common.loading' | translate" />
    @if (embedded()) {
      @if (screen() !== 'list') {
        <button type="button" class="btn btn-ghost" [disabled]="busy()" (click)="screen.set('list')">
          ← {{ 'account.addCard.backToList' | translate }}
        </button>
      }
      @switch (screen()) {
        @case ('add') {
          <app-payment-add [embedded]="true" (back)="screen.set('list')" />
        }
        @case ('recharge') {
          <app-account-recharge [embedded]="true" [cardId]="actionCardId()" (addCard)="screen.set('add')" />
        }
        @case ('refund') {
          <app-account-refund [embedded]="true" [cardId]="actionCardId()" />
        }
        @default {
          <ng-container [ngTemplateOutlet]="walletContent" />
        }
      }
    } @else {
      <app-split-view [hideList]="isChildRoute()" [hideDetail]="!isChildRoute()">
        <div splitList><ng-container [ngTemplateOutlet]="walletContent" /></div>
      </app-split-view>
    }
    <ng-template #walletContent>
      <div class="page" [class.compact]="embedded()">
        @if (!embedded()) {
          <h1 class="page-title">{{ 'account.menu.paymentMethods' | translate }}</h1>
        }
        @if (walletService.source() === 'error') {
          <p class="data-notice" role="alert">{{ 'account.paymentMethods.loadError' | translate }}</p>
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
          <button type="button" (click)="refundToCard(walletService.defaultCardId())" class="btn btn-secondary btn-sm">
            {{ 'account.withdrawBalance' | translate }}
          </button>
        </div>
        <button type="button" (click)="openScreen('add')" class="btn btn-secondary btn-block mt-2">
          {{ 'account.addCard' | translate }}
        </button>
      </div>
    </ng-template>
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
  styleUrl: './payment-layout.component.css',
})
export class PaymentLayoutComponent implements OnInit {
  @ViewChild(AccountRechargeComponent) private recharge?: AccountRechargeComponent;
  @ViewChild(AccountRefundComponent) private refund?: AccountRefundComponent;
  readonly updating = signal(false);
  busy(): boolean {
    return (
      this.updating() || !!this.cardToDelete() || !!this.recharge?.saving() || !!this.refund?.requesting() || !!this.refund?.refundQuote()
    );
  }
  readonly embedded = input(false);
  readonly screen = signal<'list' | 'add' | 'recharge' | 'refund'>('list');
  readonly actionCardId = signal('');
  openScreen(screen: 'add' | 'recharge' | 'refund', cardId = ''): void {
    this.activeCardMenu.set(null);
    if (this.embedded()) {
      this.actionCardId.set(cardId);
      this.screen.set(screen);
    } else {
      void this.router.navigate(['/app/account/payment-methods', screen], { queryParams: cardId ? { cardId } : {} });
    }
  }
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
    if (this.updating()) return;
    this.updating.set(true);
    try {
      await this.walletService.setDefaultCard(id);
      this.activeCardMenu.set(null);
    } finally {
      this.updating.set(false);
    }
  }
  requestDelete(id: string): void {
    this.activeCardMenu.set(null);
    this.cardToDelete.set(id);
  }
  rechargeCard(id: string): void {
    this.activeCardMenu.set(null);
    this.openScreen('recharge', id);
  }
  goToRecharge(): void {
    const cardId = this.walletService.defaultCardId();
    if (!this.walletService.cards().length || !cardId) return;
    this.openScreen('recharge', cardId);
  }
  refundToCard(id: string): void {
    this.activeCardMenu.set(null);
    this.openScreen('refund', id);
  }
  async confirmDelete(): Promise<void> {
    if (this.updating()) return;
    this.updating.set(true);
    try {
      const id = this.cardToDelete();
      if (id) await this.walletService.removeCard(id);
      this.cardToDelete.set(null);
    } finally {
      this.updating.set(false);
    }
  }
  brandAsset(brand: string): string | null {
    const normalized = brand.toLowerCase();
    if (normalized === 'visa') return '/assets/payment/visa.svg';
    if (normalized === 'mastercard') return '/assets/payment/mastercard.svg';
    return null;
  }
}
