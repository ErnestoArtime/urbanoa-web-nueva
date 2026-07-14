import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-onboarding-payment',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <p class="page-subtitle">{{ 'onboarding.payment.subtitle' | translate: { brand: brand.name } }}</p>
      <div class="card mt-2">
        <p class="card-title">{{ 'onboarding.payment.cardTitle' | translate }}</p>
        <p class="card-subtitle">{{ 'onboarding.payment.cardSubtitle' | translate }}</p>
      </div>
      <a routerLink="/onboarding/location" class="btn btn-primary btn-block mt-2">{{ 'account.addCard' | translate }}</a>
      <a routerLink="/onboarding/location" class="btn btn-ghost btn-block mt-1">{{ 'onboarding.payment.skip' | translate }}</a>
    </div>
  `,
})
export class OnboardingPaymentComponent {
  readonly brand = APP_BRAND;
}
