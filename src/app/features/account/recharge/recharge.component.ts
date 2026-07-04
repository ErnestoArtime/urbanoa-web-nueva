import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_WALLET } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-recharge',
  imports: [TranslatePipe],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.recharge.title' | translate }}</h1>
      <div class="card">
        <p class="text-muted">
          {{ 'account.recharge.currentBalance' | translate }} <strong>{{ wallet.balance }} €</strong>
        </p>
        <div class="recharge-options">
          <button type="button" class="recharge-option" [class.active]="selected() === 5" (click)="selected.set(5)">5 €</button>
          <button type="button" class="recharge-option" [class.active]="selected() === 10" (click)="selected.set(10)">10 €</button>
          <button type="button" class="recharge-option" [class.active]="selected() === 20" (click)="selected.set(20)">20 €</button>
          <button type="button" class="recharge-option" [class.active]="selected() === 50" (click)="selected.set(50)">50 €</button>
        </div>
        <div class="form-group">
          <label>{{ 'account.recharge.otherAmount' | translate }}</label
          ><input class="form-input" type="number" min="1" />
        </div>
      </div>
      <div class="card mt-1">
        <p>{{ 'account.recharge.cardForRecharge' | translate }}</p>
        <div class="card-row">
          <span>Visa •••• {{ wallet.mainCard.last4 }}</span
          ><span class="text-muted">{{ 'account.recharge.expires' | translate }} {{ wallet.mainCard.expiryDate }}</span>
        </div>
      </div>
      <div class="card mt-1">
        <p>
          {{ 'account.recharge.balanceAfter' | translate }} <strong>{{ wallet.balance + selected() }},00 €</strong>
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
  private readonly router = inject(Router);
  readonly wallet = MOCK_WALLET;
  readonly selected = signal(10);
  readonly done = signal(false);
  confirm(): void {
    this.done.set(true);
    setTimeout(() => this.done.set(false), 3000);
  }
}
