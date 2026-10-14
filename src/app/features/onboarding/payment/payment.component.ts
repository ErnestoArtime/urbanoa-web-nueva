import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PaymentAddComponent } from '../../account/payment-add/payment-add.component';

@Component({
  selector: 'app-onboarding-payment',
  imports: [RouterLink, TranslatePipe, PaymentAddComponent],
  template: `
    @if (addingCard()) {
      <button type="button" class="btn btn-ghost" (click)="addingCard.set(false)">{{ 'common.back' | translate }}</button>
      <app-payment-add [embedded]="true" (added)="continue()" (back)="addingCard.set(false)" />
    } @else {
      <div class="page">
        <h1 class="page-title">{{ 'onboarding.payment.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'onboarding.payment.subtitle' | translate: { brand: brand.name } }}</p>
        <div class="card mt-2">
          <p class="card-title">{{ 'onboarding.payment.cardTitle' | translate }}</p>
          <p class="card-subtitle">{{ 'onboarding.payment.cardSubtitle' | translate }}</p>
        </div>
        <button type="button" (click)="addingCard.set(true)" class="btn btn-primary btn-block mt-2">
          {{ 'onboarding.payment.addCard' | translate }}
        </button>
        <a routerLink="/onboarding/location" class="btn btn-ghost btn-block mt-1">{{ 'onboarding.payment.skip' | translate }}</a>
      </div>
    }
  `,
})
export class OnboardingPaymentComponent {
  readonly brand = APP_BRAND;
  readonly addingCard = signal(false);
  private readonly router = inject(Router);

  continue(): void {
    void this.router.navigate(['/onboarding/location']);
  }
}
