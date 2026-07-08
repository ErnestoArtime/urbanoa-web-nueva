import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';
import { OperationsService } from '../../../core/services/operations.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-account-recharge',
  imports: [TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent, DecimalPipe],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.recharge.title' | translate" backRoute="/app/account/payment-methods" />
      <div class="card">
        <p class="text-muted">
          {{ 'account.recharge.currentBalance' | translate }} <strong>{{ walletService.balance() }} €</strong>
        </p>
        <fieldset class="recharge-options">
          <legend>¿Cuánto quieres recargar?</legend>
          @for (amount of rechargeAmounts; track amount) {
            <label class="recharge-option" [class.active]="selected() === amount"
              ><input type="radio" name="recharge-amount" [checked]="selected() === amount" (change)="selected.set(amount)" />{{
                amount | number: '1.2-2'
              }}
              €</label
            >
          }
        </fieldset>
      </div>
      <fieldset class="payment-card-selector mt-1">
        <legend>{{ 'account.recharge.cardForRecharge' | translate }}</legend>
        <div role="radiogroup" aria-label="Tarjeta para la recarga">
          @for (card of walletService.cards(); track card.id) {
            <label class="payment-card-option" [class.selected]="selectedCardId() === card.id">
              <input
                type="radio"
                name="recharge-card"
                [value]="card.id"
                [checked]="selectedCardId() === card.id"
                (change)="selectedCardId.set(card.id)"
              />
              <span
                ><strong>{{ card.brand }} •••• {{ card.last4 }}</strong
                ><small>{{ card.cardholderName }} · {{ 'account.recharge.expires' | translate }} {{ card.expiryDate }}</small></span
              >
            </label>
          }
        </div>
      </fieldset>
      <div class="card mt-1">
        <p>
          {{ 'account.recharge.balanceAfter' | translate }} <strong>{{ walletService.balance() + selected() }} €</strong>
        </p>
      </div>
      <button class="btn btn-primary btn-block mt-2" (click)="confirm()">{{ 'account.recharge.button' | translate }}</button>
      @if (done()) {
        <app-result-modal
          type="success"
          [title]="'account.recharge.success' | translate"
          [message]="'account.recharge.successDetail' | translate: { amount: selected() + ',00 €' }"
          primaryText="Aceptar"
          (primaryAction)="done.set(false)"
        />
      }
    </div>
  `,
  styles: [
    `
      .recharge-options {
        display: grid;
        gap: 0;
        margin: 0.8rem 0;
        padding: 0;
        border: 0;
      }
      .recharge-options legend {
        margin-bottom: 0.35rem;
        font-weight: var(--font-bold);
      }
      .recharge-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.7rem 0.25rem;
        border-bottom: 1px solid var(--color-border);
        cursor: pointer;
      }
      .recharge-option input {
        width: 20px;
        height: 20px;
        accent-color: var(--color-primary);
      }
      .recharge-option.active {
        color: var(--color-primary-dark);
        font-weight: var(--font-bold);
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
  private readonly route = inject(ActivatedRoute);
  private readonly operationsService = inject(OperationsService);
  readonly rechargeAmounts = [1, 2, 5, 10, 20, 30, 40] as const;
  readonly selected = signal(1);
  readonly selectedCardId = signal(this.initialCardId());
  readonly done = signal(false);
  confirm(): void {
    if (this.done() || this.selected() <= 0) return;
    this.walletService.credit(this.selected(), 'Recarga de saldo', 'top-up');
    this.operationsService.registerTopUp(this.selected());
    this.done.set(true);
  }
  private initialCardId(): string {
    const requested = this.route.snapshot.queryParamMap.get('cardId');
    return requested && this.walletService.cards().some((card) => card.id === requested) ? requested : this.walletService.defaultCardId();
  }
}
