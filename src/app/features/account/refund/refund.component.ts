import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
      <div class="card refund-summary">
        <p class="text-muted">{{ 'account.refund.availableBalance' | translate }}</p>
        <strong class="available-balance">{{ walletService.balance() | number: '1.2-2' }} €</strong>
        <p class="refund-explanation">
          Se solicitará al servicio el saldo que puede devolverse. El importe depende de las recargas realizadas durante el último año.
        </p>
        <button
          type="button"
          class="btn btn-primary btn-block"
          [disabled]="requesting() || walletService.balance() <= 0"
          (click)="requestRefund()"
        >
          {{ requesting() ? 'Calculando saldo…' : 'Solicitar devolución' }}
        </button>
      </div>
      @if (refundQuote(); as amount) {
        <app-result-modal
          type="confirmation"
          title="Confirmar devolución"
          [message]="'Se devolverán ' + formatAmount(amount) + ' €. Esta cantidad ha sido calculada por el servicio.'"
          primaryText="Confirmar devolución"
          secondaryText="Cancelar"
          (primaryAction)="confirmRefund()"
          (secondaryAction)="refundQuote.set(null)"
        />
      }
      @if (done()) {
        <app-result-modal
          type="success"
          title="Devolución solicitada"
          [message]="'La devolución de ' + formatAmount(refundedAmount()) + ' € se ha registrado correctamente.'"
          primaryText="Aceptar"
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
    `,
  ],
})
export class AccountRefundComponent {
  readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  readonly requesting = signal(false);
  readonly refundQuote = signal<number | null>(null);
  readonly refundedAmount = signal(0);
  readonly done = signal(false);

  requestRefund(): void {
    if (this.requesting() || this.walletService.balance() <= 0) return;
    this.requesting.set(true);
    queueMicrotask(() => {
      this.refundQuote.set(this.walletService.balance());
      this.requesting.set(false);
    });
  }
  confirmRefund(): void {
    const amount = this.refundQuote();
    if (!amount || !this.walletService.debit(amount, 'Devolución de saldo', 'balance-refund')) return;
    this.operationsService.registerBalanceRefund(amount, 'Saldo del monedero');
    this.refundedAmount.set(amount);
    this.refundQuote.set(null);
    this.done.set(true);
  }
  formatAmount(amount: number): string {
    return amount.toFixed(2).replace('.', ',');
  }
}
