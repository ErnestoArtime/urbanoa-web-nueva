import { Component, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-tax-data',
  imports: [TranslatePipe],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.taxData.title' | translate }}</h1>
      <div class="card">
        <div class="form-group"><label>{{ 'account.taxData.nif' | translate }} <span class="text-error">*</span></label><input class="form-input" [placeholder]="'account.taxData.nif' | translate"/><small class="form-error">{{ 'account.taxData.nifRequired' | translate }}</small></div>
        <div class="form-group"><label>{{ 'account.taxData.street' | translate }} <span class="text-error">*</span></label><input class="form-input" [placeholder]="'account.taxData.street' | translate"/><small class="form-error">{{ 'account.taxData.streetRequired' | translate }}</small></div>
        <div class="form-group"><label>{{ 'account.taxData.number' | translate }} <span class="text-error">*</span></label><input class="form-input" [placeholder]="'account.taxData.numberRequired' | translate"/></div>
        <div class="form-group"><label>{{ 'account.taxData.floor' | translate }}</label><input class="form-input" [placeholder]="'account.taxData.floor' | translate"/></div>
        <div class="form-group"><label>{{ 'account.taxData.city' | translate }} <span class="text-error">*</span></label><input class="form-input" [placeholder]="'account.taxData.city' | translate"/><small class="form-error">{{ 'account.taxData.cityRequired' | translate }}</small></div>
        <div class="form-group"><label>{{ 'account.taxData.province' | translate }} <span class="text-error">*</span></label><input class="form-input" [placeholder]="'account.taxData.province' | translate"/><small class="form-error">{{ 'account.taxData.provinceRequired' | translate }}</small></div>
        <div class="form-group"><label>{{ 'account.taxData.postalCode' | translate }} <span class="text-error">*</span></label><input class="form-input" [placeholder]="'account.taxData.postalCode' | translate"/><small class="form-error">{{ 'account.taxData.postalCodeRequired' | translate }}</small></div>
        <button class="btn btn-primary btn-block">{{ 'common.save' | translate }}</button>
      </div>
      @if (saved()) {
        <div class="toast"><strong>{{ 'account.taxData.saveSuccess' | translate }}</strong><br>{{ 'account.taxData.saveSuccessDetail' | translate }}</div>
      }
    </div>
  `,
  styles: ['.toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);padding:.65rem 1.25rem;border-radius:999px;background:var(--color-primary-dark);color:#fff;z-index:2000;text-align:center}'],
})
export class AccountTaxDataComponent {
  readonly saved = signal(false);
}
