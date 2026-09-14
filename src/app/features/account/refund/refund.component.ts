import { DecimalPipe } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
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
      @if (!embedded()) {
        <app-detail-panel-header [title]="'account.refund.title' | translate" backRoute="/app/account/payment-methods" />
      } @else {
        <h2>{{ 'account.refund.title' | translate }}</h2>
      }
      @if (failed() || walletService.source() === 'error') {
        <p class="data-notice" role="alert">{{ 'account.refund.error' | translate }}</p>
      }
      <div class="card refund-summary">
        <p class="text-muted">{{ 'account.refund.availableBalance' | translate }}</p>
        <strong class="available-balance">{{ walletService.balance() | number: '1.2-2' }} €</strong>
        <p class="refund-explanation">
          {{ 'account.refund.explanation' | translate }}
        </p>
        <p class="refund-destination">{{ 'account.refund.destinationManaged' | translate }}</p>
        <button
          type="button"
          class="btn btn-primary btn-block"
          [disabled]="requesting() || walletService.balance() <= 0"
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
          [busy]="requesting()"
          (primaryAction)="confirmRefund()"
          (secondaryAction)="cancelRefund()"
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
      .refund-destination {
        padding: 0.75rem;
        border-radius: var(--radius-md);
        background: var(--color-active);
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }
    `,
  ],
})
export class AccountRefundComponent {
  readonly cardId = input('');
  readonly embedded = input(false);
  readonly back = output<void>();

  readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  readonly requesting = signal(false);
  readonly refundQuote = signal<number | null>(null);
  readonly refundedAmount = signal(0);
  readonly done = signal(false);
  readonly failed = signal(false);
  requestRefund(): void {
    if (this.requesting() || this.walletService.balance() <= 0) return;
    this.failed.set(false);
    this.refundQuote.set(this.walletService.balance());
  }
  cancelRefund(): void {
    if (!this.requesting()) this.refundQuote.set(null);
  }
  async confirmRefund(): Promise<void> {
    const amount = this.refundQuote();
    if (!amount || this.requesting()) return;
    this.requesting.set(true);
    this.failed.set(false);
    try {
      const result = await this.walletService.refund(amount);
      this.refundQuote.set(null);
      if (!result.success || result.amount == null) {
        this.failed.set(true);
        await this.walletService.load();
        return;
      }
      this.refundedAmount.set(result.amount);
      await Promise.all([this.operationsService.load(), this.walletService.load()]);
      this.done.set(true);
    } catch {
      this.refundQuote.set(null);
      this.failed.set(true);
    } finally {
      this.requesting.set(false);
    }
  }
  formatAmount(amount: number): string {
    return amount.toFixed(2).replace('.', ',');
  }
}
