import { apiErrorMessage } from '../../../core/http/api-error-key';
import { TranslationService } from '../../../core/services/translation.service';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { PaymentAddComponent } from '../payment-add/payment-add.component';
import { AccountRechargeComponent } from '../recharge/recharge.component';
import { AccountRefundComponent } from '../refund/refund.component';
import { Component, computed, HostListener, inject, input, OnInit, signal, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { UserService } from '../../../core/services/user.service';
import { WalletService } from '../../../core/services/wallet.service';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { RuntimeStyleDirective } from '../../../shared/directives/runtime-style.directive';

@Component({
  selector: 'app-payment-layout',
  imports: [
    EuroPipe,
    NgTemplateOutlet,
    PaymentAddComponent,
    AccountRechargeComponent,
    AccountRefundComponent,
    SplitViewComponent,
    TranslatePipe,
    ResultModalComponent,
    LoaderComponent,
    RuntimeStyleDirective,
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
          <app-account-refund [embedded]="true" (back)="screen.set('list')" />
        }
        @default {
          <ng-container [ngTemplateOutlet]="walletContent" />
        }
      }
    } @else {
      <app-split-view class="payment-split" [hideList]="isChildRoute()" [hideDetail]="false">
        <div splitList class="payment-master"><ng-container [ngTemplateOutlet]="walletContent" /></div>
        @switch (routeScreen()) {
          @case ('add') {
            <app-payment-add splitDetail />
          }
          @case ('recharge') {
            <app-account-recharge splitDetail [cardId]="routeCardId()" />
          }
          @case ('refund') {
            <app-account-refund splitDetail />
          }
          @default {
            <div splitDetail class="payment-detail-empty"></div>
          }
        }
      </app-split-view>
    }
    <ng-template #walletContent>
      <div class="page wallet-page" [class.compact]="embedded()">
        @if (!embedded()) {
          <h1 class="page-title">{{ 'account.menu.paymentMethods' | translate }}</h1>
        }
        <div class="wallet-scroll" (scroll)="closeCardMenuOnScroll()">
          <div class="wallet-card payment-wallet-card mb-2">
            <div class="wallet-section">
              <strong>{{ 'account.wallet' | translate }}</strong>
              <p class="wallet-balance-large">{{ walletService.balance() | euro }}</p>
            </div>
          </div>
          <p class="section-title cards-heading">
            {{ 'account.cards' | translate }}
            @if (!walletService.loading()) {
              <span class="cards-count">({{ walletService.cards().length }})</span>
            }
          </p>
          <div class="card">
            @if (walletService.loading()) {
              <div class="cards-skeleton" aria-hidden="true">
                @for (row of skeletonRows; track row) {
                  <div class="card-skeleton-row">
                    <span class="skeleton-block skeleton-brand"></span>
                    <span class="skeleton-copy"><i class="skeleton-block"></i><i class="skeleton-block"></i></span>
                    <span class="skeleton-block skeleton-menu"></span>
                  </div>
                }
              </div>
            } @else {
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
                    #cardMenuButton
                    type="button"
                    class="kebab-button"
                    (click)="toggleCardMenu(card.id, $event)"
                    [attr.aria-label]="'account.cardOptions' | translate: { brand: card.brand, last4: card.last4 }"
                    [attr.aria-expanded]="activeCardMenu() === card.id"
                  >
                    ⋮
                  </button>
                  @if (activeCardMenu() === card.id) {
                    <div class="card-menu" [appRuntimeStyle]="cardMenuStyles()">
                      <button type="button" (click)="rechargeCard(card.id)">
                        <span>＋</span> {{ 'account.recharge.button' | translate }}
                      </button>
                      @if (walletService.defaultCardId() !== card.id) {
                        <button type="button" (click)="setAsDefault(card.id)">
                          <span>☆</span> {{ 'account.setPrimaryCard' | translate }}
                        </button>
                      }
                      <button type="button" class="delete-option" (click)="requestDelete(card.id)">
                        <span>▣</span> {{ 'account.deleteCard' | translate }}
                      </button>
                    </div>
                  }
                </div>
              }
              @if (!walletService.loading() && walletService.cards().length === 0) {
                <p class="empty-cards">{{ 'account.cardsEmpty' | translate }}</p>
              }
            }
          </div>
        </div>
        <div class="wallet-actions">
          <div class="payment-actions">
            <button type="button" class="btn btn-primary btn-sm" [disabled]="walletService.cards().length === 0" (click)="goToRecharge()">
              {{ 'dashboard.recharge' | translate }}
            </button>
            <button
              type="button"
              (click)="refundBalance()"
              [disabled]="walletService.balance() <= 0 || busy()"
              class="btn btn-secondary btn-sm"
            >
              {{ 'account.withdrawBalance' | translate }}
            </button>
          </div>
          <button type="button" (click)="openScreen('add')" class="btn btn-secondary btn-block mt-2">
            {{ 'account.addCard' | translate }}
          </button>
        </div>
      </div>
    </ng-template>
    @if (walletAlert(); as message) {
      <app-result-modal
        type="error"
        [title]="'ops.fineDetail.errorTitle' | translate"
        [message]="message"
        [primaryText]="'common.accept' | translate"
        (primaryAction)="walletErrorDismissed.set(true)"
      />
    }
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
  readonly skeletonRows = [0, 1, 2];
  private readonly translationService = inject(TranslationService);
  readonly walletErrorDismissed = signal(false);
  readonly walletAlert = computed(() =>
    (this.walletService.source() === 'error' || this.walletService.lastError()) && !this.walletErrorDismissed()
      ? apiErrorMessage(this.walletService.responseError?.(), this.translationService, {}, 'account.paymentMethods.loadError')
      : null,
  );

  @ViewChild(AccountRechargeComponent) private recharge?: AccountRechargeComponent;
  @ViewChild(AccountRefundComponent) private refund?: AccountRefundComponent;
  private cardMenuTrigger?: HTMLElement;
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
      void this.router.navigate(['/app/account/payment-methods', screen], {
        queryParams: cardId ? { cardId } : {},
        queryParamsHandling: cardId ? '' : 'preserve',
      });
    }
  }
  private readonly userService = inject(UserService);
  readonly walletService = inject(WalletService);
  readonly user = this.userService.user;
  private readonly router = inject(Router);
  readonly cardToDelete = signal<string | null>(null);
  readonly activeCardMenu = signal<string | null>(null);
  readonly cardMenuPosition = signal<{ top: number; left: number; maxHeight: number } | null>(null);
  cardMenuStyles(): Record<string, string> {
    const position = this.cardMenuPosition();
    return position ? { top: `${position.top}px`, left: `${position.left}px`, 'max-height': `${position.maxHeight}px` } : {};
  }
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  ngOnInit(): void {
    this.walletErrorDismissed.set(false);
    void this.walletService.load();
  }
  private readonly wideLayout = toSignal(
    new Observable<boolean>((subscriber) => {
      if (typeof window === 'undefined') {
        subscriber.next(false);
        subscriber.complete();
        return;
      }
      const query = window.matchMedia('(min-width: 960px)');
      subscriber.next(query.matches);
      const onChange = (event: MediaQueryListEvent) => subscriber.next(event.matches);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }),
    { initialValue: typeof window !== 'undefined' && window.matchMedia('(min-width: 960px)').matches },
  );
  isChildRoute = () => {
    if (this.wideLayout()) return false;
    const path = this.url().split('?')[0].replace(/\/$/, '');
    return path !== '/app/account/payment-methods';
  };
  routeScreen = (): 'list' | 'add' | 'recharge' | 'refund' => {
    const path = this.url().split('?')[0].replace(/\/$/, '');
    if (path.endsWith('/payment-methods/add')) return 'add';
    if (path.endsWith('/payment-methods/recharge')) return 'recharge';
    if (path.endsWith('/payment-methods/refund')) return 'refund';
    return 'list';
  };
  routeCardId = (): string => new URLSearchParams(this.url().split('?')[1] ?? '').get('cardId') ?? '';
  toggleCardMenu(id: string, event: MouseEvent): void {
    if (this.activeCardMenu() === id) {
      this.activeCardMenu.set(null);
      this.cardMenuPosition.set(null);
      return;
    }
    const trigger = event.currentTarget as HTMLElement;
    this.cardMenuTrigger = trigger;
    this.toggleCardMenuPosition(trigger, trigger.getBoundingClientRect());
    this.activeCardMenu.set(id);
  }
  @HostListener('document:click', ['$event'])
  closeCardMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && !target.closest('.kebab-button, .card-menu')) {
      this.activeCardMenu.set(null);
      this.cardMenuPosition.set(null);
      this.cardMenuTrigger = undefined;
    }
  }

  @HostListener('document:keydown.escape')
  closeCardMenuOnEscape(): void {
    this.activeCardMenu.set(null);
    this.cardMenuPosition.set(null);
  }
  @HostListener('window:scroll')
  closeCardMenuOnScroll(): void {
    if (!this.activeCardMenu()) return;
    this.activeCardMenu.set(null);
    this.cardMenuPosition.set(null);
    this.cardMenuTrigger = undefined;
  }
  closeCardMenuIfTriggerLeavesViewport(): void {
    if (!this.activeCardMenu()) return;
    const trigger = this.cardMenuTrigger;
    if (!trigger?.isConnected) {
      this.activeCardMenu.set(null);
      this.cardMenuPosition.set(null);
      this.cardMenuTrigger = undefined;
      return;
    }
    const bounds = trigger.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
      this.activeCardMenu.set(null);
      this.cardMenuPosition.set(null);
      this.cardMenuTrigger = undefined;
    } else {
      this.toggleCardMenuPosition(trigger, bounds);
    }
  }
  private toggleCardMenuPosition(trigger: HTMLElement, bounds: DOMRect): void {
    const menuHeight = 170;
    const menuWidth = 235;
    const gap = 4;
    const viewportPadding = 8;
    const spaceBelow = window.innerHeight - bounds.bottom - gap - viewportPadding;
    const spaceAbove = bounds.top - gap - viewportPadding;
    const openAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const availableHeight = Math.max(80, openAbove ? spaceAbove : spaceBelow);
    const top = openAbove ? Math.max(viewportPadding, bounds.top - Math.min(menuHeight, availableHeight) - gap) : bounds.bottom + gap;
    const left = Math.max(8, Math.min(bounds.right - menuWidth, window.innerWidth - menuWidth - 8));
    this.cardMenuPosition.set({ top, left, maxHeight: availableHeight });
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
  refundBalance(): void {
    this.openScreen('refund');
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
