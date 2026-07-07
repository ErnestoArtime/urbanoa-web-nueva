import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';
import { OperationsService } from '../../../core/services/operations.service';

@Component({
  selector: 'app-account-recharge',
  imports: [TranslatePipe],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.recharge.title' | translate }}</h1>
      <div class="card">
        <p class="text-muted">
          {{ 'account.recharge.currentBalance' | translate }} <strong>{{ walletService.balance() }} €</strong>
        </p>
        <div class="recharge-options">
          <button type="button" class="recharge-option" [class.active]="selected() === 5" (click)="selected.set(5)">5 €</button>
          <button type="button" class="recharge-option" [class.active]="selected() === 10" (click)="selected.set(10)">10 €</button>
          <button type="button" class="recharge-option" [class.active]="selected() === 20" (click)="selected.set(20)">20 €</button>
          <button type="button" class="recharge-option" [class.active]="selected() === 50" (click)="selected.set(50)">50 €</button>
        </div>
        <div class="form-group">
          <label>{{ 'account.recharge.otherAmount' | translate }}</label
          ><input class="form-input" type="number" min="1" [value]="selected()" (input)="setCustomAmount($event)" />
        </div>
      </div>
      <div class="card mt-1">
        <p>{{ 'account.recharge.cardForRecharge' | translate }}</p>
        <div class="card-row">
          <span>Visa •••• {{ walletService.mainCard.last4 }}</span
          ><span class="text-muted">{{ 'account.recharge.expires' | translate }} {{ walletService.mainCard.expiryDate }}</span>
        </div>
      </div>
      <div class="card mt-1">
        <p>
          {{ 'account.recharge.balanceAfter' | translate }} <strong>{{ walletService.balance() + selected() }} €</strong>
        </p>
      </div>
      <button class="btn btn-primary btn-block mt-2" (click)="confirm()">{{ 'account.recharge.button' | translate }}</button>
      @if (done()) {
        <div class="toast">
          <strong>{{ 'account.recharge.success' | translate }}</strong
          ><br />{{ 'account.recharge.successDetail' | translate: { amount: selected() + ',00 €' } }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      .recharge-options {
        display: flex;
        gap: 0.5rem;
        margin: 0.8rem 0;
      }
      .recharge-option {
        flex: 1;
        padding: 0.6rem;
        border: 1px solid var(--color-border);
        border-radius: 12px;
        background: var(--color-surface);
        font-weight: var(--font-bold);
        cursor: pointer;
        text-align: center;
      }
      .recharge-option.active {
        border-color: var(--color-primary);
        background: var(--color-active);
        color: var(--color-primary-dark);
      }
      .card-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
      }
      .toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.65rem 1.25rem;
        border-radius: 999px;
        background: var(--color-primary-dark);
        color: #fff;
        z-index: 2000;
        text-align: center;
      }
    `,
  ],
})
export class AccountRechargeComponent {
  readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  readonly selected = signal(10);
  readonly done = signal(false);
  confirm(): void {
    if (this.done() || this.selected() <= 0) return;
    this.walletService.credit(this.selected(), 'Recarga de saldo', 'top-up');
    this.operationsService.registerTopUp(this.selected());
    this.done.set(true);
  }
  setCustomAmount(event: Event): void {
    const amount = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(amount) && amount > 0) this.selected.set(amount);
  }
}
