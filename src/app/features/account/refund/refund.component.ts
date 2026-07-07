import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-account-refund',
  imports: [TranslatePipe, DecimalPipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.refund.title' | translate" backRoute="/app/account/payment-methods" />
      <div class="card">
        <p class="text-muted">
          {{ 'account.refund.availableBalance' | translate }} <strong>{{ walletService.balance() | number: '1.2-2' }} €</strong>
        </p>
        <div class="form-group">
          <label>{{ 'account.refund.amount' | translate }} <span class="text-error">*</span></label
          ><input class="form-input" type="number" min="0.01" [value]="amount()" (input)="onAmountInput($any($event.target).value)" />
          @if (submitted() && (!amount() || amount() <= 0)) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
          @if (submitted() && amount() > 0 && amount() > walletService.balance()) {
            <p class="form-error">El importe no puede superar el saldo disponible</p>
          }
        </div>
        <p class="text-muted mt-1">
          {{ 'account.refund.balanceAfter' | translate }} <strong>{{ walletService.balance() - (amount() > 0 ? amount() : 0) | number: '1.2-2' }} €</strong>
        </p>
        <button type="button" class="btn btn-primary btn-block mt-2" (click)="confirm()">{{ 'account.refund.confirm' | translate }}</button>
      </div>
      @if (done()) {
        <app-result-modal type="success" title="Devolución solicitada" message="La devolución se procesará en los próximos días."
          primaryText="Aceptar" (primaryAction)="done.set(false)" />
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class AccountRefundComponent {
  readonly walletService = inject(WalletService);
  readonly amount = signal(0);
  readonly submitted = signal(false);
  readonly done = signal(false);

  onAmountInput(value: string): void {
    this.amount.set(parseFloat(value) || 0);
  }

  confirm(): void {
    this.submitted.set(true);
    if (this.amount() <= 0 || this.amount() > this.walletService.balance()) return;
    this.done.set(true);
  }
}
