import { Component } from '@angular/core';
import { MOCK_WALLET } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-refund',
  imports: [TranslatePipe],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.refund.title' | translate }}</h1>
      <div class="card">
        <p class="text-muted">
          {{ 'account.refund.availableBalance' | translate }} <strong>{{ wallet.balance }} €</strong>
        </p>
        <div class="form-group">
          <label>{{ 'account.refund.amount' | translate }}</label
          ><input class="form-input" type="number" />
        </div>
        <p class="text-muted mt-1">{{ 'account.refund.balanceAfter' | translate }}</p>
        <button class="btn btn-primary btn-block mt-2">{{ 'account.refund.confirm' | translate }}</button>
      </div>
    </div>
  `,
  styles: [':host{display:block}'],
})
export class AccountRefundComponent {
  readonly wallet = MOCK_WALLET;
}
