import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';
import { OperationsService } from '../../../core/services/operations.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-account-refund',
  imports: [TranslatePipe, DecimalPipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.refund.title' | translate" backRoute="/app/account/payment-methods" />
      @if (walletService.source() === 'mock') {
        <p class="data-notice" role="status">
          La devolución se simulará localmente mientras no haya una sesión conectada o falle el servicio.
        </p>
      }
      <div class="card refund-summary">
        <p class="text-muted">{{ 'account.refund.availableBalance' | translate }}</p>
        <strong class="available-balance">{{ walletService.balance() | number: '1.2-2' }} €</strong>
        <p class="refund-explanation">
          {{ 'account.refund.explanation' | translate }}
        </p>
        <section class="refund-card-selector">
          <strong>{{ 'account.refund.destinationCard' | translate }}</strong>
          @for (card of walletService.cards(); track card.id) {
            <label class="payment-card-option" [class.selected]="selectedCardId() === card.id">
              <input
                type="radio"
                name="refund-card"
                [value]="card.id"
                [checked]="selectedCardId() === card.id"
                (change)="selectedCardId.set(card.id)"
              />
              <span>{{ card.brand }} •••• {{ card.last4 }}</span>
              <small>{{ card.cardholderName }} · {{ card.expiryDate }}</small>
            </label>
          } @empty {
            <p class="text-muted">{{ 'account.refund.noCard' | translate }}</p>
          }
        </section>
        <button
          type="button"
          class="btn btn-primary btn-block"
          [disabled]="requesting() || walletService.balance() <= 0 || !selectedCard()"
          (click)="requestRefund()"
        >
          {{ (requesting() ? 'account.refund.calculating' : 'account.refund.request') | translate }}
        </button>
      </div>
      @if (refundQuote(); as amount) {
        <app-result-modal
          type="confirmation"
          [title]="'account.refund.confirm' | translate"
          [message]="'account.refund.confirmDetail' | translate: { amount: formatAmount(amount) }"
          [primaryText]="'account.refund.confirm' | translate"
          [secondaryText]="'common.cancel' | translate"
          (primaryAction)="confirmRefund()"
          (secondaryAction)="refundQuote.set(null)"
        />
      }
      @if (done()) {
        <app-result-modal
          type="success"
          [title]="'account.refund.successTitle' | translate"
          [message]="'account.refund.successDetail' | translate: { amount: formatAmount(refundedAmount()) }"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="done.set(false)"
        />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .refund-summary {
        display: grid;
        gap: 0.75rem;
      }
      .data-notice {
        margin: 0 0 1rem;
        padding: 0.75rem 0.9rem;
        border: 1px solid #e5b85c;
        border-radius: var(--radius-md);
        background: #fff8e7;
        color: #714b00;
      }
      .refund-summary p {
        margin: 0;
      }
      .available-balance {
        font-size: var(--text-2xl);
        color: var(--color-primary);
      }
      .refund-explanation {
        color: var(--color-text-muted);
        font-size: var(--text-sm);
        line-height: 1.5;
      }
      .refund-card-selector {
        display: grid;
        gap: 0.55rem;
      }
      .refund-card-selector > strong {
        font-size: var(--text-sm);
      }
    `,
  ],
})
export class AccountRefundComponent {
  private readonly route = inject(ActivatedRoute);
  readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  readonly selectedCardId = signal(this.route.snapshot.queryParamMap.get('cardId') ?? this.walletService.defaultCardId());
  readonly selectedCard = computed(
    () => this.walletService.cards().find((card) => card.id === this.selectedCardId()) ?? this.walletService.defaultCard(),
  );
  readonly requesting = signal(false);
  readonly refundQuote = signal<number | null>(null);
  readonly refundedAmount = signal(0);
  readonly done = signal(false);

  requestRefund(): void {
    if (this.requesting() || this.walletService.balance() <= 0 || !this.selectedCard()) return;
    this.requesting.set(true);
    queueMicrotask(() => {
      this.refundQuote.set(this.walletService.balance());
      this.requesting.set(false);
    });
  }
  async confirmRefund(): Promise<void> {
    const amount = this.refundQuote();
    const card = this.selectedCard();
    if (!amount || !card || this.requesting()) return;
    this.requesting.set(true);
    const result = await this.walletService.refund(amount);
    this.requesting.set(false);
    if (!result.success) return;
    const refunded = result.amount ?? amount;
    const cardLabel = `${card.brand} •••• ${card.last4}`;
    this.operationsService.registerBalanceRefund(refunded, cardLabel, card.id, cardLabel);
    this.refundedAmount.set(refunded);
    this.refundQuote.set(null);
    this.done.set(true);
  }
  formatAmount(amount: number): string {
    return amount.toFixed(2).replace('.', ',');
  }
}
