import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-onboarding-user',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <h1 class="page-title">{{ 'onboarding.user.title' | translate }}</h1>
      <p class="page-subtitle">{{ 'onboarding.user.subtitle' | translate }}</p>
      <div class="form-group"><label class="form-label">{{ 'account.profile.name' | translate }}</label><input class="form-input" /></div>
      <div class="form-group"><label class="form-label">{{ 'account.profile.surname' | translate }}</label><input class="form-input" /></div>
      <div class="form-group"><label class="form-label">{{ 'onboarding.user.secondSurname' | translate }}</label><input class="form-input" /></div>
      <div class="form-group"><label class="form-label">{{ 'account.profile.nif' | translate }}</label><input class="form-input" /></div>
      <div class="form-group"><label class="form-label">{{ 'account.profile.phone' | translate }}</label><input class="form-input" type="tel" /></div>
      <a routerLink="/onboarding/payment" class="btn btn-primary btn-block mt-2">{{ 'onboarding.next' | translate }}</a>
      <a routerLink="/auth/login" class="btn btn-ghost btn-block mt-1">{{ 'common.cancel' | translate }}</a>
    </div>
  `,
})
export class OnboardingUserComponent {}
