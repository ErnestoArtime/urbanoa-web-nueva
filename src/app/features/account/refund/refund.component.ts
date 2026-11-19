import { OpsApiError } from '../../../core/api/ops-api.types';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { apiErrorMessage } from '../../../core/http/api-error-key';
import { formatEuroNumber } from '../../../core/utils/euro-format';
import { PaymentChallengeService } from '../../../core/services/payment-challenge.service';
import { TranslationService } from '../../../core/services/translation.service';

import { Component, computed, effect, input, output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';
import { OperationsService } from '../../../core/services/operations.service';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-account-refund',
  imports: [TranslatePipe, ResultModalComponent],
  template: `
    <div class="refund-host">
      @if (refundQuote(); as amount) {
        <app-result-modal
          type="confirmation"
          [title]="'account.refund.dialogTitle' | translate"
          [message]="'account.refund.dialogMessage' | translate: { amount: formatAmount(amount) }"
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
          (primaryAction)="closeSuccess()"
        />
      }
      @if (alertMessage(); as message) {
        <app-result-modal
          type="error"
          [title]="'ops.fineDetail.errorTitle' | translate"
          [message]="message"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="dismissAlert()"
        />
      }
    </div>
  `,
  styleUrl: './refund.component.css',
})
export class AccountRefundComponent {
  private readonly pendingPayment = inject(PaymentChallengeService);
  private readonly translationService = inject(TranslationService);
  readonly embedded = input(false);
  readonly back = output<void>();

  readonly walletService = inject(WalletService);
  readonly connectivity = inject(ConnectivityService);
  private readonly operationsService = inject(OperationsService);
  readonly requesting = signal(false);
  readonly refundQuote = signal<number | null>(null);
  readonly refundedAmount = signal(0);
  readonly done = signal(false);
  readonly failed = signal(false);
  readonly refundError = signal<unknown>(null);
  readonly alertMessage = computed(() =>
    this.failed() ? apiErrorMessage(this.refundError(), this.translationService, {}, 'account.refund.error') : null,
  );
  private readonly router = inject(Router);
  private started = false;
  private readonly autoStart = effect(() => {
    if (this.started || this.walletService.loading()) return;
    this.started = true;
    this.requestRefund();
    if (this.refundQuote() === null) this.leave();
  });
  dismissAlert(): void {
    this.failed.set(false);
    this.leave();
  }
  closeSuccess(): void {
    this.done.set(false);
    this.leave();
  }
  private leave(): void {
    this.back.emit();
    if (!this.embedded()) void this.router.navigate(['/app/account/payment-methods']);
  }
  requestRefund(): void {
    if (this.done() || this.requesting() || this.walletService.loading() || this.walletService.balance() <= 0) return;
    if (!this.connectivity.online()) return;
    this.failed.set(false);
    this.refundError.set(null);
    this.refundQuote.set(this.walletService.balance());
  }
  cancelRefund(): void {
    if (this.requesting()) return;
    this.refundQuote.set(null);
    this.leave();
  }
  async confirmRefund(): Promise<void> {
    const amount = this.refundQuote();
    if (!amount || this.requesting()) return;
    if (!this.connectivity.online()) {
      this.refundQuote.set(null);
      this.refundError.set(new OpsApiError('transport', 'refund', 'offline'));
      this.failed.set(true);
      return;
    }
    this.requesting.set(true);
    this.failed.set(false);
    this.refundError.set(null);
    this.pendingPayment.clear();
    try {
      const result = await this.walletService.refund(amount);
      this.refundQuote.set(null);
      if (!result.success || result.amount == null) {
        this.refundError.set(result.error);
        this.failed.set(true);
        void this.walletService.load({ balanceOnly: true }).catch(() => undefined);
        return;
      }
      this.refundedAmount.set(result.amount);
      this.done.set(true);
      // WalletService already applied the amount confirmed by OPS. A stale read
      // must not restore the pre-refund balance and enable another refund.
      void this.operationsService.load().catch(() => undefined);
    } catch (error) {
      this.refundError.set(error);
      this.refundQuote.set(null);
      this.failed.set(true);
    } finally {
      this.requesting.set(false);
    }
  }
  formatAmount(amount: number): string {
    return formatEuroNumber(amount);
  }
}
