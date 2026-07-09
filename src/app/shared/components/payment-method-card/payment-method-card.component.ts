import { Component, input, output } from '@angular/core';
import { LucideCreditCard, LucideMoreVertical } from '@lucide/angular';
import type { MainCard } from '../../../core/services/wallet.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-payment-method-card',
  standalone: true,
  imports: [TranslatePipe, LucideCreditCard, LucideMoreVertical],
  template: `
    <article class="payment-method-card card" [class.default-card]="isDefault()">
      <span class="payment-icon"><svg lucideCreditCard size="22" strokeWidth="2.2"></svg></span>
      <div class="payment-body">
        <strong>{{ card().brand }} •••• {{ card().last4 }}</strong>
        <span>{{ card().cardholderName }} · {{ card().expiryDate }}</span>
      </div>
      @if (isDefault()) {
        <span class="badge badge-primary">{{ 'account.cardPrimary' | translate }}</span>
      }
      <button type="button" class="payment-more" (click)="more.emit(card())" [attr.aria-label]="'common.moreOptions' | translate">
        <svg lucideMoreVertical size="18" strokeWidth="2.2"></svg>
      </button>
    </article>
  `,
  styles: [
    `
      .payment-method-card {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .default-card {
        border-color: var(--color-primary);
      }
      .payment-icon {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        flex: none;
        border-radius: 50%;
        background: var(--color-background);
        color: var(--color-primary);
      }
      .payment-body {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
      }
      .payment-body span {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .payment-more {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--color-text-muted);
        cursor: pointer;
      }
      .payment-more:hover {
        background: var(--color-active);
        color: var(--color-text);
      }
    `,
  ],
})
export class PaymentMethodCardComponent {
  readonly card = input.required<MainCard>();
  readonly isDefault = input(false);
  readonly more = output<MainCard>();
}
