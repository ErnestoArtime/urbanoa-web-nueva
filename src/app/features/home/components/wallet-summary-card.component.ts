import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { APP_BRAND } from '../../../shared/constants/app-brand';

@Component({
  selector: 'app-wallet-summary-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslatePipe, AppIconComponent],
  template: `
    <div class="card wallet-shell-card">
      <div class="wallet-card-inline">
        <p class="wallet-inline-title">{{ 'account.wallet' | translate }}</p>
        <p class="wallet-inline-balance">{{ balance() | number: '1.2-2' }} €</p>
        <span class="wallet-inline-brand">ap</span>
        <span class="wallet-inline-mark" aria-hidden="true">{{ brand.name }}</span>
      </div>
      <div class="wallet-main-card-row">
        <app-icon name="card" class="wallet-card-icon" [stroke]="false" />
        <div>
          <p class="wallet-main-label">{{ 'dashboard.mainCard' | translate }}</p>
          <p class="wallet-main-value">{{ mainCard().brand }} Debit ·{{ mainCard().last4 }}</p>
          <p class="wallet-main-expiry">{{ mainCard().cardholderName }} {{ mainCard().expiryDate }}</p>
        </div>
      </div>
      <div class="row mt-2 wallet-actions" style="gap:0.5rem;flex-wrap:wrap">
        <button type="button" class="btn btn-secondary btn-sm" (click)="recharge.emit()">{{ 'dashboard.recharge' | translate }}</button>
        <a routerLink="/app/account/payment-methods" class="btn btn-primary btn-sm">{{ 'dashboard.manageCards' | translate }}</a>
      </div>
    </div>
  `,
  styles: [
    `
    .wallet-shell-card { background: var(--card-bg); }
    .wallet-card-inline {
      position:relative;
      width: 100%;
      max-width: 225px;
      border-radius: 10px;
      padding: .95rem 1rem .75rem;
      color:#fff;
      background: linear-gradient(135deg, #4fa6a0 0%, #3f8f8b 55%, #357e7b 100%);
      box-shadow: 0 6px 14px rgba(40, 105, 103, 0.25);
      margin-bottom: .8rem;
      overflow:hidden;
    }
    .wallet-inline-title { font-size: var(--text-md); font-weight: var(--font-bold); opacity:.95; }
    .wallet-inline-balance { font-size: var(--text-display); font-weight: var(--font-bold); letter-spacing: .01em; margin-top: .22rem; }
    .wallet-inline-mark {
      position:absolute;
      right:.85rem;
      top:.35rem;
      font-size: var(--text-display)
      font-weight: var(--font-extra);
      opacity:.09;
      transform:rotate(-19deg);
      pointer-events:none;
      white-space:nowrap;
    }
    .wallet-inline-brand {
      position:absolute;
      right:.55rem;
      bottom:.42rem;
      font-size: var(--text-md);
      font-weight: var(--font-bold);
      opacity:.82;
      text-transform:lowercase;
    }
    .wallet-main-card-row { display:flex; align-items:center; gap:.65rem; }
    .wallet-card-icon {
      width:20px;
      height:20px;
      color:var(--color-primary);
      flex-shrink:0;
    }
    .wallet-card-icon svg { width:100%; height:100%; fill:currentColor; }
    .wallet-main-label { color:#49544c; font-size: var(--text-sm); font-weight: var(--font-bold); }
    .wallet-main-value { font-size: var(--text-base); font-weight: var(--font-bold); line-height: var(--line-tight); margin-top:.1rem; }
    .wallet-main-expiry { color:var(--color-text-muted); font-size: var(--text-md); margin-top:.14rem; }
    .wallet-actions .btn { min-width: 136px; }
    .wallet-actions .btn-primary { background:#2f6f71; }
  `,
  ],
})
export class WalletSummaryCardComponent {
  readonly balance = input.required<number>();
  readonly mainCard = input.required<{ brand: string; last4: string; cardholderName: string; expiryDate: string }>();
  readonly recharge = output<void>();
  readonly brand = APP_BRAND;
}
