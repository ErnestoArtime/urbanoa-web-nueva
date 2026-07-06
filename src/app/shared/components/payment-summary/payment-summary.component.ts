import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AppIconComponent } from '../../icons/app-icon.component';
import type { Wallet } from '../../mock-data';

export type PaymentMethod = 'none' | 'balance' | 'card' | 'mixed';

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <div class="card payment-section">
      <p class="section-label">{{ 'payment.methodLabel' | translate }}</p>

      @if (method() === 'none') {
        <div class="payment-summary">
          <div class="payment-summary-row">
            <app-icon name="check" [stroke]="true" />
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
              @if (balanceAfter() > 0) {
                <small>{{ 'payment.walletUsed' | translate: { amount: balanceUsedFormatted() } }}</small>
              } @else {
                <small>{{ 'payment.walletAvailable' | translate: { balance: walletBalanceFormatted() } }}</small>
              }
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
  styles: [
    `
      .payment-section {
        padding: 0.65rem;
        margin-top: 0.7rem;
      }
      .section-label {
        font-size: var(--text-xs);
        font-weight: var(--font-bold);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0 0.35rem 0.3rem;
      }
      .payment-summary {
        padding: 0.35rem 0.55rem;
      }
      .payment-summary-row {
        display: flex;
        align-items: center;
        gap: 0.7rem;
      }
      .payment-summary-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .payment-summary-info small {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .payment-breakdown {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.4rem 0;
        border-bottom: 1px solid var(--color-border);
        font-size: var(--text-sm);
        margin-left: 2.8rem;
      }
      .payment-breakdown em {
        color: var(--color-text-muted);
        font-style: normal;
        font-size: var(--text-2xs);
      }
      .payment-breakdown-total {
        border-bottom: none;
        padding-top: 0.5rem;
        font-weight: var(--font-bold);
      }
      .payment-breakdown-total span {
        color: var(--color-text-muted);
      }
      .payment-icon,
      .card-brand {
        width: 38px;
        height: 28px;
        display: grid;
        place-items: center;
        flex: none;
      }
      .payment-icon {
        width: 38px;
        height: 28px;
        display: grid;
        place-items: center;
        flex: none;
        color: var(--color-primary);
      }
      .card-brand img {
        display: block;
        max-width: 38px;
        max-height: 25px;
      }
    `,
  ],
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
