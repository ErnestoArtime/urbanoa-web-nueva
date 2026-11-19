import { apiErrorMessage } from '../../../core/http/api-error-key';
import { formatEuroNumber } from '../../../core/utils/euro-format';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { PaymentChallengeService } from '../../../core/services/payment-challenge.service';
import { TranslationService } from '../../../core/services/translation.service';

import { Component, computed, input, output, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';
import { OperationsService } from '../../../core/services/operations.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-account-refund',
  imports: [EuroPipe, TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent, LoaderComponent],
  template: `
    <app-loader [visible]="requesting() && !refundQuote()" [message]="'common.loading' | translate" />
    <div class="page account-static-page account-form-page">
      @if (!embedded()) {
        <app-detail-panel-header [title]="'account.refund.title' | translate" backRoute="/app/account/payment-methods" />
      } @else {
        <h2>{{ 'account.refund.title' | translate }}</h2>
      }
      <div class="card refund-summary">
        <p class="text-muted">{{ 'account.refund.availableBalance' | translate }}</p>
        <strong class="available-balance">{{ walletService.balance() | euro }}</strong>
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
          (primaryAction)="done.set(false)"
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
  readonly refundError = signal<unknown>(null);
  readonly alertMessage = computed(() =>
    this.failed() ? apiErrorMessage(this.refundError(), this.translationService, {}, 'account.refund.error') : null,
  );
  dismissAlert(): void {
    this.failed.set(false);
  }
  requestRefund(): void {
    if (this.done() || this.requesting() || this.walletService.loading() || this.walletService.balance() <= 0) return;
    this.failed.set(false);
    this.refundError.set(null);
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
