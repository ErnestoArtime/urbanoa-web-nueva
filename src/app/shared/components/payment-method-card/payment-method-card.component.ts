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
  styleUrl: './payment-method-card.component.css',
})
export class PaymentMethodCardComponent {
  readonly card = input.required<MainCard>();
  readonly isDefault = input(false);
  readonly more = output<MainCard>();
}
