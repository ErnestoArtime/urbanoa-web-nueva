import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { OperationsService } from '../../../core/services/operations.service';
import { WalletService } from '../../../core/services/wallet.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-recharge',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent, DecimalPipe],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.recharge.title' | translate" backRoute="/app/account/payment-methods" />
      @if (walletService.source() === 'mock') {
        <p class="data-notice" role="status">
          La recarga se simulará localmente mientras no haya una sesión conectada o falle el servicio.
        </p>
      }
      @if (walletService.cards().length === 0) {
        <div class="card empty-recharge-state">
          <p class="card-title">{{ 'dashboard.cardEmptyTitle' | translate }}</p>
          <p class="text-muted">{{ 'dashboard.cardEmptyDetail' | translate }}</p>
          <a routerLink="/app/account/payment-methods/add" class="btn btn-primary btn-block mt-2">{{ 'account.addCard' | translate }}</a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="confirm()" novalidate>
          <div class="card">
            <p class="text-muted">
              {{ 'account.recharge.currentBalance' | translate }} <strong>{{ walletService.balance() }} €</strong>
            </p>
            <fieldset class="recharge-options">
              <legend>{{ 'account.recharge.amountQuestion' | translate }}</legend>
              @for (amount of rechargeAmounts; track amount) {
                <label class="recharge-option" [class.active]="selectedAmount() === amount">
                  <input type="radio" formControlName="amount" [value]="amount" />{{ amount | number: '1.2-2' }} €
                </label>
              }
            </fieldset>
            @if (amountControl.invalid && amountControl.touched) {
              <p class="form-error">{{ 'validation.amount' | translate }}</p>
            }
          </div>
          <fieldset class="payment-card-selector mt-1">
            <legend>{{ 'account.recharge.cardForRecharge' | translate }}</legend>
            <div role="radiogroup" [attr.aria-label]="'account.recharge.cardForRecharge' | translate">
              @for (card of walletService.cards(); track card.id) {
                <label class="payment-card-option" [class.selected]="selectedCardId() === card.id">
                  <input type="radio" formControlName="cardId" [value]="card.id" />
                  <span
                    ><strong>{{ card.brand }} •••• {{ card.last4 }}</strong
                    ><small>{{ card.cardholderName }} · {{ 'account.recharge.expires' | translate }} {{ card.expiryDate }}</small></span
                  >
                </label>
              }
            </div>
            @if (cardControl.invalid && cardControl.touched) {
              <p class="form-error">{{ 'validation.required' | translate }}</p>
            }
          </fieldset>
          <div class="card mt-1">
            <p>
              {{ 'account.recharge.balanceAfter' | translate }} <strong>{{ walletService.balance() + selectedAmount() }} €</strong>
            </p>
          </div>
          <button type="submit" class="btn btn-primary btn-block mt-2" [disabled]="saving()">
            {{ (saving() ? 'common.loading' : 'account.recharge.button') | translate }}
          </button>
        </form>
      }
      @if (done()) {
        <app-result-modal
          type="success"
          [title]="'account.recharge.success' | translate"
          [message]="'account.recharge.successDetail' | translate: { amount: selectedAmount() + ',00 €' }"
          [primaryText]="'common.accept' | translate"
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
      .data-notice {
        margin: 0 0 1rem;
        padding: 0.75rem 0.9rem;
        border: 1px solid #e5b85c;
        border-radius: var(--radius-md);
        background: #fff8e7;
        color: #714b00;
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
  private readonly fb = inject(FormBuilder);
  readonly rechargeAmounts = [1, 2, 5, 10, 20, 30, 40] as const;
  readonly done = signal(false);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    amount: [1, [Validators.required, Validators.min(1)]],
    cardId: [this.initialCardId(), Validators.required],
  });

  selectedAmount(): number {
    return Number(this.form.controls.amount.value) || 0;
  }

  selectedCardId(): string {
    return this.form.controls.cardId.value;
  }

  get amountControl() {
    return this.form.controls.amount;
  }

  get cardControl() {
    return this.form.controls.cardId;
  }

  async confirm(): Promise<void> {
    if (this.done() || this.saving()) return;
    if (!this.walletService.cards().length) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const amount = this.selectedAmount();
    this.saving.set(true);
    try {
      const result = await this.walletService.recharge(amount, this.selectedCardId());
      if (result.challengeUrl) {
        window.location.assign(result.challengeUrl);
        return;
      }
      if (!result.success) return;
      this.operationsService.registerTopUp(result.amount ?? amount);
      this.done.set(true);
    } finally {
      this.saving.set(false);
    }
  }

  private initialCardId(): string {
    const requested = this.route.snapshot.queryParamMap.get('cardId');
    return requested && this.walletService.cards().some((card) => card.id === requested) ? requested : this.walletService.defaultCardId();
  }
}
