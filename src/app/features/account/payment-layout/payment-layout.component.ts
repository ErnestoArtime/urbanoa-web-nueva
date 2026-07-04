import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { MOCK_USER } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-payment-layout',
  imports: [RouterLink, RouterOutlet, TranslatePipe],
  template: `
    <div class="split-view">
      <div class="split-view-list" [class.split-hidden]="isChildRoute()">
        <div class="page">
          <div class="wallet-card mb-2">
            <p style="opacity:0.9">{{ 'account.wallet' | translate }}</p>
            <p class="wallet-balance">{{ user.balance }} €</p>
          </div>
          <p class="section-title">{{ 'account.cards' | translate }}</p>
          <div class="card">💳 Visa •••• 4242 <span class="badge badge-primary">{{ 'account.cardPrimary' | translate }}</span></div>
          <div class="row mt-2">
            <a routerLink="/app/account/recharge" class="btn btn-primary btn-sm">{{ 'dashboard.recharge' | translate }}</a>
            <a routerLink="/app/account/refund" class="btn btn-secondary btn-sm">{{ 'account.withdrawBalance' | translate }}</a>
          </div>
          <a routerLink="/app/account/payment-methods/add" class="btn btn-secondary btn-block mt-2">{{ 'account.addCard' | translate }}</a>
        </div>
      </div>
      <div class="split-view-detail" [class.split-hidden]="!isChildRoute()">
        <router-outlet />
      </div>
    </div>
  `,
  styles: `@media (min-width:960px){.split-view-detail.split-hidden{display:flex!important}}`,
})
export class PaymentLayoutComponent {
  readonly user = MOCK_USER;
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  isChildRoute = () => this.url().includes('/payment-methods/add');
}
