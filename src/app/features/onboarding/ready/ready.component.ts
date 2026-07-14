import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-onboarding-ready',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page text-center">
      <div class="success-icon">✓</div>
      <h1 class="page-title">{{ 'onboarding.ready.title' | translate }}</h1>
      <p class="page-subtitle">{{ 'onboarding.ready.subtitle' | translate: { brand: brand.name } }}</p>
      <a routerLink="/app" class="btn btn-primary btn-block mt-2">{{ 'onboarding.ready.start' | translate }}</a>
    </div>
  `,
})
export class OnboardingReadyComponent {
  readonly brand = APP_BRAND;
}
