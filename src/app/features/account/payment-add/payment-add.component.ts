import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-payment-add',
  imports: [TranslatePipe],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.addCard.title' | translate }}</h1>
      <div class="card">
        <div class="form-group"><label>{{ 'account.addCard.cardholder' | translate }}</label><input class="form-input" [placeholder]="'account.addCard.cardholder' | translate"/></div>
        <div class="form-group"><label>{{ 'account.addCard.cardNumber' | translate }}</label><input class="form-input" [placeholder]="'account.addCard.cardNumber' | translate"/></div>
        <div class="form-row"><div class="form-group"><label>{{ 'account.addCard.expiry' | translate }}</label><select class="form-input"><option value="">{{ 'account.addCard.month' | translate }}</option></select></div><div class="form-group"><label>&nbsp;</label><select class="form-input"><option value="">{{ 'account.addCard.year' | translate }}</option></select></div><div class="form-group"><label>{{ 'account.addCard.cvc' | translate }}</label><input class="form-input" [placeholder]="'account.addCard.cvc' | translate"/></div></div>
        <div class="form-group"><label>{{ 'account.addCard.alias' | translate }}</label><input class="form-input" [placeholder]="'account.addCard.alias' | translate"/></div>
        <button class="btn btn-primary btn-block">{{ 'account.addCard.button' | translate }}</button>
      </div>
      <div class="secure-badge"><span>{{ 'account.addCard.securePayment' | translate }}</span><span>{{ 'account.addCard.secureCheckout' | translate }} {{ 'account.addCard.paycomet' | translate }} {{ 'account.addCard.byBank' | translate }}</span></div>
    </div>
  `,
  styles: [`
    .form-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem}.secure-badge{display:flex;justify-content:space-between;margin-top:.65rem;padding:.5rem .75rem;border:1px solid var(--color-border);border-radius:var(--radius-md);font-size:.72rem;color:var(--color-text-muted)}
  `],
})
export class PaymentAddComponent {}
