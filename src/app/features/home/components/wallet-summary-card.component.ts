import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { APP_BRAND } from '../../../shared/constants/app-brand';

@Component({
  selector: 'app-wallet-summary-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslatePipe, AppIconComponent],
  template: `
    <div class="card wallet-shell-card">
      <div class="wallet-card-inline">
        <p class="wallet-inline-title">{{ 'account.wallet' | translate }}</p>
        <p class="wallet-inline-balance">
          @if (balanceAvailable()) {
            {{ balance() | number: '1.2-2' }} €
          } @else {
            —
          }
        </p>
        <span class="wallet-inline-brand">ap</span>
        <span class="wallet-inline-mark" aria-hidden="true">{{ brand.name }}</span>
      </div>
      @if (balanceError()) {
        <p role="alert">{{ 'account.paymentMethods.loadError' | translate }}</p>
        <button type="button" class="btn btn-secondary btn-sm" (click)="retry.emit()">{{ 'common.retry' | translate }}</button>
      }
      <div class="wallet-main-card-row">
        <app-icon name="card" class="wallet-card-icon" [stroke]="false" />
        @if (hasCards()) {
          <div>
            <p class="wallet-main-label">{{ 'dashboard.mainCard' | translate }}</p>
            <p class="wallet-main-value">{{ mainCard().brand }} Debit ·{{ mainCard().last4 }}</p>
            <p class="wallet-main-expiry">{{ mainCard().cardholderName }} {{ mainCard().expiryDate }}</p>
          </div>
        } @else {
          <div>
            <p class="wallet-main-label">{{ 'dashboard.cardEmptyTitle' | translate }}</p>
            <p class="wallet-main-expiry">{{ 'dashboard.cardEmptyDetail' | translate }}</p>
          </div>
        }
      </div>
      <div class="row mt-2 wallet-actions">
        <button type="button" class="btn btn-secondary btn-sm" [disabled]="!hasCards()" (click)="recharge.emit()">
          {{ 'dashboard.recharge' | translate }}
        </button>
        <a routerLink="/app/account/payment-methods" class="btn btn-primary btn-sm">{{ 'dashboard.manageCards' | translate }}</a>
      </div>
    </div>
  `,
  styleUrl: './wallet-summary-card.component.css',
})
export class WalletSummaryCardComponent {
  readonly balance = input.required<number>();
  readonly balanceAvailable = input(true);
  readonly balanceError = input(false);
  readonly mainCard = input.required<{ brand: string; last4: string; cardholderName: string; expiryDate: string }>();
  readonly hasCards = input(false);
  readonly recharge = output<void>();
  readonly retry = output<void>();
  readonly brand = APP_BRAND;
}
