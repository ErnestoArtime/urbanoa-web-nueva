import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';
import { OperationsService } from '../../../core/services/operations.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-account-recharge',
  imports: [TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.recharge.title' | translate" backRoute="/app/account/payment-methods" />
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
        <div class="card-selector" role="radiogroup" aria-label="Tarjeta para la recarga">
          @for (card of walletService.cards(); track card.id) {
            <label class="card-row" [class.selected]="selectedCard() === card.last4">
              <input
                type="radio"
                name="recharge-card"
                [value]="card.last4"
                [checked]="selectedCard() === card.last4"
                (change)="selectedCard.set(card.last4)"
              />
              <span class="card-brand">{{ card.brand }} •••• {{ card.last4 }}</span>
              <span class="text-muted">{{ 'account.recharge.expires' | translate }} {{ card.expiryDate }}</span>
            </label>
          }
        </div>
      </div>
      <div class="card mt-1">
        <p>
          {{ 'account.recharge.balanceAfter' | translate }} <strong>{{ walletService.balance() + selected() }} €</strong>
        </p>
      </div>
      <button class="btn btn-primary btn-block mt-2" (click)="confirm()">{{ 'account.recharge.button' | translate }}</button>
      @if (done()) {
        <app-result-modal type="success" [title]="'account.recharge.success' | translate"
          [message]="'account.recharge.successDetail' | translate: { amount: selected() + ',00 €' }"
          primaryText="Aceptar" (primaryAction)="done.set(false)" />
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
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.65rem;
        margin-top: 0.55rem;
        padding: 0.7rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        cursor: pointer;
      }
      .card-row.selected {
        border-color: var(--color-primary);
        background: var(--color-active);
      }
      .card-row input {
        accent-color: var(--color-primary);
      }
      .card-brand {
        font-weight: var(--font-bold);
      }
      @media (max-width: 480px) {
        .card-row {
          grid-template-columns: auto 1fr;
        }
        .card-row .text-muted {
          grid-column: 2;
        }
      }
    `,
  ],
})
export class AccountRechargeComponent {
  readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  readonly selected = signal(10);
  readonly selectedCard = signal(this.walletService.mainCard.last4);
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
