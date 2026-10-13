import { PaymentChallengeService } from '../../../core/services/payment-challenge.service';
import { isPaymentOutcomeUnknown } from '../../../core/utils/payment-error';
import { DecimalPipe } from '@angular/common';
import { Component, input, output, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';
import { OperationsService } from '../../../core/services/operations.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-account-refund',
  imports: [TranslatePipe, DecimalPipe, DetailPanelHeaderComponent, ResultModalComponent, LoaderComponent],
  template: `
    <app-loader [visible]="requesting() && !refundQuote()" [message]="'common.loading' | translate" />
    <div class="page account-static-page account-form-page">
      @if (!embedded()) {
        <app-detail-panel-header [title]="'account.refund.title' | translate" backRoute="/app/account/payment-methods" />
      } @else {
        <h2>{{ 'account.refund.title' | translate }}</h2>
      }
      @if (paymentUncertain()) {
        <p class="data-notice" role="alert">{{ 'payment.uncertain.message' | translate }}</p>
      } @else if (failed() || walletService.source() === 'error') {
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
          [disabled]="requesting() || paymentUncertain() || walletService.balance() <= 0"
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
  styleUrl: './refund.component.css',
})
export class AccountRefundComponent {
  private readonly pendingPayment = inject(PaymentChallengeService);
  readonly paymentUncertain = signal(this.pendingPayment.hasPendingPayment());
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
    if (this.pendingPayment.hasPendingPayment()) {
      this.paymentUncertain.set(true);
      return;
    }
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
    if (this.pendingPayment.hasPendingPayment()) {
      this.paymentUncertain.set(true);
      this.refundQuote.set(null);
      return;
    }
    this.requesting.set(true);
    this.failed.set(false);
    this.pendingPayment.begin({ kind: 'refund', returnUrl: '/app/operations', amount, status: 'uncertain' });
    try {
      const result = await this.walletService.refund(amount);
      this.refundQuote.set(null);
      if (!result.success || result.amount == null) {
        if (!isPaymentOutcomeUnknown(result.error)) this.pendingPayment.clear();
        else this.paymentUncertain.set(true);
        this.failed.set(true);
        await this.walletService.load();
        return;
      }
      this.refundedAmount.set(result.amount);
      this.pendingPayment.clear();
      this.done.set(true);
      await Promise.all([this.operationsService.load(), this.walletService.load()]);
      this.done.set(true);
    } catch {
      if (!this.done()) this.paymentUncertain.set(true);
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
