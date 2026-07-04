import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MOCK_WALLET } from '../../../shared/mock-data';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PaymentSummaryComponent } from '../../../shared/components/payment-summary/payment-summary.component';
import { SwipeToPayComponent } from '../../../shared/components/swipe-to-pay/swipe-to-pay.component';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingFlowQuery, readParkingFlowQuery } from '../parking-flow.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-parking-confirm',
  imports: [RouterLink, LoaderComponent, PaymentSummaryComponent, SwipeToPayComponent, TranslatePipe],
  template: `
    <div class="page flow-page confirm-page has-sticky-actions">
      <app-loader [visible]="loading()" [message]="'parking.confirm.loading' | translate" imageSrc="/assets/brand/login-logo.jpg" />
      <a routerLink="/app/parking/time-steps" [queryParams]="query" class="back-link">{{ 'parking.confirm.back' | translate }}</a>
      <p class="flow-step">{{ 'parking.confirm.step' | translate }}</p>
      <h1 class="page-title">{{ 'parking.confirm.title' | translate }}</h1>

      <div class="card summary">
        <div class="zone-heading"><span [style.background]="sectorColor()"></span><div><strong>{{ query.zone }}</strong><p>{{ query.street }} · {{ query.cityName }}</p></div></div>
        <p><span>{{ 'parking.confirm.vehicle' | translate }}</span><strong>{{ query.plate }}</strong></p>
        <p><span>{{ 'parking.confirm.duration' | translate }}</span><strong>{{ query.duration }} · hasta {{ query.endTime }}</strong></p>
        <p><span>{{ 'parking.confirm.tariff' | translate }}</span><strong>{{ query.tariff }}</strong></p>
        <p class="total-row"><span>{{ 'parking.confirm.amount' | translate }}</span><strong>{{ query.amount }}</strong></p>
      </div>

      <app-payment-summary [wallet]="wallet" [totalAmount]="totalAmount()" />

      <div class="sticky-actions">
        <app-swipe-to-pay (onComplete)="onSwipeComplete()" />
      </div>

      <a routerLink="/app/account/payment-methods" class="change-payment">{{ 'parking.confirm.changePayment' | translate }}</a>
    </div>
  `,
  styles: [`
    :host{display:block}.flow-page{max-width:680px}.back-link{display:inline-block;margin-bottom:.65rem}.flow-step{color:var(--color-primary);font-size:var(--text-xs);font-weight:var(--font-extra);text-transform:uppercase;letter-spacing:.04em}.page-title{margin-bottom:.8rem}.summary{padding:.85rem 1rem}.summary>p{display:flex;justify-content:space-between;gap:1rem;padding:.48rem 0;border-bottom:1px solid var(--color-border)}.summary>p span{color:var(--color-text-muted)}.summary>p.total-row{border-bottom:none;padding-bottom:0}.summary>p.total-row strong{color:var(--color-primary);font-size:var(--text-lg)}.zone-heading{display:flex;gap:.8rem;padding-bottom:.4rem}.zone-heading>span{width:8px;border-radius:99px}.zone-heading p{color:var(--color-text-muted)}.change-payment{display:block;margin-top:.7rem;text-align:center;font-size:var(--text-xs)}
    @media(min-width:960px) and (max-height:950px){.confirm-page{padding-top:1rem;padding-bottom:.8rem}.back-link{margin-bottom:.35rem}.page-title{font-size:var(--text-xl);margin-bottom:.55rem}.summary{padding:.65rem .9rem}.summary>p{padding:.34rem 0}.zone-heading{padding-bottom:.25rem}}
  `],
})
export class ParkingConfirmComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ParkingFlowStore);
  readonly query: ParkingFlowQuery = this.store.hasMinimumParkingData()
    ? this.store.fromStore()
    : readParkingFlowQuery(this.route);
  readonly wallet = MOCK_WALLET;
  readonly loading = signal(false);

  readonly totalAmount = computed(() => {
    const raw = this.query.amount?.replace('€', '').replace(',', '.').trim();
    return raw ? parseFloat(raw) : 0;
  });

  sectorColor(): string { return this.query.sectorColor ? `#${this.query.sectorColor.replace('#', '')}` : 'var(--color-primary)'; }

  onSwipeComplete(): void {
    this.loading.set(true);
    setTimeout(() => void this.router.navigate(['/app/parking/success'], { queryParams: this.query }), 1500);
  }
}
