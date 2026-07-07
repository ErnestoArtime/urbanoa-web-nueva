import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { UserService } from '../../../core/services/user.service';
import { WalletService } from '../../../core/services/wallet.service';
import { WalletMovementListComponent } from '../../../shared/components/wallet-movement-list/wallet-movement-list.component';

@Component({
  selector: 'app-payment-layout',
  imports: [RouterLink, SplitViewComponent, TranslatePipe, AppIconComponent, DecimalPipe, WalletMovementListComponent],
  template: `
    <app-split-view [hideList]="isChildRoute()" [hideDetail]="!isChildRoute()">
      <div splitList class="page">
        <h1 class="page-title">{{ 'account.menu.paymentMethods' | translate }}</h1>
        <div class="wallet-card mb-2">
          <div class="wallet-section">
            <strong>Mi monedero</strong>
            <p class="wallet-balance-large">{{ walletService.balance() | number: '1.2-2' }} €</p>
          </div>
        </div>
        <p class="section-title">{{ 'account.cards' | translate }}</p>
        <div class="card">
          @for (card of walletService.cards(); track card.id) {
            <div class="card-item">
              <app-icon name="payment" class="card-icon" [stroke]="false" />
              <div class="card-info">
                <strong>{{ card.brand }} •••• {{ card.last4 }}</strong>
                <span>{{ card.cardholderName }}</span>
                <small>{{ card.expiryDate }}</small>
              </div>
              <label class="default-card">
                <input type="radio" name="default-card" [checked]="walletService.defaultCardId() === card.id"
                  (change)="walletService.setDefaultCard(card.id)" />
                <span>{{ walletService.defaultCardId() === card.id ? ('account.cardPrimary' | translate) : 'Usar como principal' }}</span>
              </label>
            </div>
          }
        </div>
        <div class="row mt-2">
          <a routerLink="/app/account/recharge" class="btn btn-primary btn-sm">{{ 'dashboard.recharge' | translate }}</a>
          <a routerLink="/app/account/refund" class="btn btn-secondary btn-sm">{{ 'account.withdrawBalance' | translate }}</a>
        </div>
        <a routerLink="/app/account/payment-methods/add" class="btn btn-secondary btn-block mt-2">{{ 'account.addCard' | translate }}</a>

        <app-wallet-movement-list class="mt-2" [movements]="walletService.movements()" [title]="'account.movements' | translate" />
      </div>
    </app-split-view>
  `,
  styles: `
    .wallet-section {
      padding: 0.5rem 0;
      color: #fff;
    }
    .wallet-balance-large {
      font-size: var(--text-2xl);
      font-weight: var(--font-extra);
      color: #fff;
      margin: 0.25rem 0 0;
    }
    .card-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-bottom: 1px solid var(--color-border);
    }
    .card-item:last-child {
      border-bottom: 0;
    }
    .card-icon {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      fill: var(--color-primary);
    }
    .card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .card-info strong {
      font-size: var(--text-sm);
    }
    .card-info span {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .card-info small {
      font-size: var(--text-2xs);
      color: var(--color-text-muted);
    }
    .default-card{display:flex;align-items:center;gap:.35rem;font-size:var(--text-xs);cursor:pointer}.default-card input{accent-color:var(--color-primary)}
  `,
})
export class PaymentLayoutComponent {
  private readonly userService = inject(UserService);
  readonly walletService = inject(WalletService);
  readonly user = this.userService.user;
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  isChildRoute = () => this.url().includes('/payment-methods/add');
}
