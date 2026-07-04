import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-payment-empty',
  imports: [TranslatePipe],
  template: `<div class="split-view-detail-empty"><p>{{ 'account.empty' | translate }}</p></div>`,
})
export class PaymentEmptyComponent {}
