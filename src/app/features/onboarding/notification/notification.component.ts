import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-onboarding-notification',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <p class="page-subtitle">{{ 'onboarding.notification.subtitle' | translate }}</p>
      <a routerLink="/onboarding/ready" class="btn btn-primary btn-block mt-2">{{ 'onboarding.notification.activate' | translate }}</a>
      <a routerLink="/app" class="btn btn-ghost btn-block mt-1">{{ 'common.cancel' | translate }}</a>
    </div>
  `,
})
export class OnboardingNotificationComponent {}
