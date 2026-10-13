import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AppIconComponent } from '../../icons/app-icon.component';
import type { Wallet } from '../../models/wallet';

export type PaymentMethod = 'none' | 'balance' | 'card' | 'mixed';

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <div class="card payment-section" [class.empty-payment]="cardUsed() > 0 && !wallet().mainCard.last4">
      <p class="section-label">{{ 'payment.methodLabel' | translate }}</p>
      <ng-content />

      @if (cardUsed() > 0 && !wallet().mainCard.last4) {
        <div class="payment-summary missing-payment" role="status">
          <p>{{ 'dashboard.cardEmptyTitle' | translate }}</p>
          <p>{{ 'payment.missingCard' | translate: { amount: cardUsedFormatted() } }}</p>
        </div>
      } @else if (method() === 'none') {
        <div class="payment-summary">
          <div class="payment-summary-row">
            <app-icon name="check" [stroke]="false" />
            <div class="payment-summary-info">
              <strong>{{ 'payment.free' | translate }}</strong>
              <small>{{ 'payment.freeDesc' | translate }}</small>
            </div>
          </div>
        </div>
      } @else if (method() === 'balance') {
        <div class="payment-summary">
          <div class="payment-summary-row">
            <app-icon name="wallet" [stroke]="false" />
            <div class="payment-summary-info">
              <strong>{{ 'payment.wallet' | translate }}</strong>
              <small>{{ 'payment.walletUsed' | translate: { amount: balanceUsedFormatted() } }}</small>
            </div>
          </div>
        </div>
      } @else if (method() === 'card') {
        <div class="payment-summary">
          <div class="payment-summary-row">
            <span class="card-brand"><img [src]="cardBrandAsset()" [alt]="wallet().mainCard.brand" /></span>
            <div class="payment-summary-info">
              <strong>{{ wallet().mainCard.brand }} •••• {{ wallet().mainCard.last4 }}</strong>
              <small>{{ 'payment.cardExpiry' | translate: { date: wallet().mainCard.expiryDate } }}</small>
            </div>
          </div>
        </div>
      } @else {
        <div class="payment-summary">
          <div class="payment-summary-row">
            <app-icon name="card" [stroke]="false" />
            <div class="payment-summary-info">
              <strong>{{ 'payment.mixed' | translate }}</strong>
              <small>{{ 'payment.mixedDesc' | translate }}</small>
            </div>
          </div>
          <div class="payment-breakdown">
            <span
              >{{ 'payment.wallet' | translate }} <em>{{ 'payment.usedFirst' | translate }}</em></span
            >
            <strong>-{{ balanceUsedFormatted() }}</strong>
          </div>
          <div class="payment-breakdown">
            <span>{{ wallet().mainCard.brand }} •••• {{ wallet().mainCard.last4 }}</span>
            <strong>-{{ cardUsedFormatted() }}</strong>
          </div>
          <div class="payment-breakdown payment-breakdown-total">
            <span>{{ 'payment.total' | translate }}</span
            ><strong>{{ totalFormatted() }}</strong>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './payment-summary.component.css',
})
export class PaymentSummaryComponent {
  readonly wallet = input.required<Wallet>();
  readonly totalAmount = input.required<number>();

  readonly balanceUsed = computed(() => {
    const total = this.totalAmount();
    const balance = this.wallet().balance;
    if (total <= 0) return 0;
    return Math.min(balance, total);
  });

  readonly cardUsed = computed(() => {
    const total = this.totalAmount();
    const balance = this.wallet().balance;
    if (total <= 0) return 0;
    return Math.max(0, total - balance);
  });

  readonly balanceAfter = computed(() => {
    return Math.max(0, this.wallet().balance - this.balanceUsed());
  });

  readonly method = computed<PaymentMethod>(() => {
    const total = this.totalAmount();
    if (total <= 0) return 'none';
    if (this.cardUsed() <= 0) return 'balance';
    if (this.balanceUsed() <= 0) return 'card';
    return 'mixed';
  });

  readonly balanceUsedFormatted = computed(() => this.balanceUsed().toFixed(2).replace('.', ',') + ' €');

  readonly cardUsedFormatted = computed(() => this.cardUsed().toFixed(2).replace('.', ',') + ' €');

  readonly walletBalanceFormatted = computed(() => this.wallet().balance.toFixed(2).replace('.', ',') + ' €');

  readonly totalFormatted = computed(() => this.totalAmount().toFixed(2).replace('.', ',') + ' €');

  cardBrandAsset(): string {
    return this.wallet().mainCard.brand.toLowerCase().includes('master') ? '/assets/payment/mastercard.svg' : '/assets/payment/visa.svg';
  }
}
