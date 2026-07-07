import { Component, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { UserService } from '../../../core/services/user.service';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-payment-layout',
  imports: [RouterLink, SplitViewComponent, TranslatePipe, DetailPanelHeaderComponent, AppIconComponent, DecimalPipe, DatePipe],
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
          <div class="card-item">
            <app-icon name="payment" class="card-icon" [stroke]="false" />
            <div class="card-info">
              <strong>Visa Debit •••• 4242</strong>
              <span>{{ user().name }} {{ user().surname }}</span>
              <small>12/28</small>
            </div>
            <span class="badge badge-primary">{{ 'account.cardPrimary' | translate }}</span>
          </div>
        </div>
        <div class="row mt-2">
          <a routerLink="/app/account/recharge" class="btn btn-primary btn-sm">{{ 'dashboard.recharge' | translate }}</a>
          <a routerLink="/app/account/refund" class="btn btn-secondary btn-sm">{{ 'account.withdrawBalance' | translate }}</a>
        </div>
        <a routerLink="/app/account/payment-methods/add" class="btn btn-secondary btn-block mt-2">{{ 'account.addCard' | translate }}</a>

        <section class="card mt-2">
          <p class="section-title">{{ 'account.movements' | translate }}</p>
          @for (movement of walletService.movements().slice(0, 5); track movement.id) {
            <div class="wallet-movement">
              <div class="movement-info">
                <strong>{{ movement.description }}</strong>
                <span class="movement-date">{{ movement.date | date: 'dd/MM/yyyy' }}</span>
              </div>
              <strong class="movement-amount" [class.positive]="movement.amount > 0">
                {{ movement.amount > 0 ? '+' : '' }}{{ movement.amount | number: '1.2-2' }} €
              </strong>
            </div>
          }
        </section>
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
    .wallet-movement {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--color-border);
    }
    .wallet-movement:last-child {
      border-bottom: none;
    }
    .movement-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .movement-info strong {
      font-size: var(--text-sm);
    }
    .movement-date {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .movement-amount {
      font-size: var(--text-sm);
      color: var(--color-error);
    }
    .movement-amount.positive {
      color: var(--color-success);
    }
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
