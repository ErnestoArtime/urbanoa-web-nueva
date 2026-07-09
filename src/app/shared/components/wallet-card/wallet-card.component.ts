import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WalletService } from '../../../core/services/wallet.service';
import { APP_BRAND } from '../../constants/app-brand';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-wallet-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="wallet-card shared-wallet-card">
      <p class="wallet-watermark">{{ brand.name }}</p>
      <div class="wallet-card-content">
        <p class="wallet-title">{{ 'account.wallet' | translate }}</p>
        <p class="wallet-balance">{{ balanceLabel() }}</p>
        @if (mainCard(); as card) {
          <p class="wallet-card-meta">{{ card.brand }} •••• {{ card.last4 }} · {{ card.expiryDate }}</p>
        }
      </div>
      <div class="wallet-actions">
        <a routerLink="/app/account/recharge" class="btn btn-primary btn-sm">{{ 'dashboard.recharge' | translate }}</a>
        <a routerLink="/app/account/payment-methods" class="btn btn-secondary btn-sm">{{ 'dashboard.manageCards' | translate }}</a>
      </div>
    </section>
  `,
  styles: [
    `
      .shared-wallet-card {
        position: relative;
        overflow: hidden;
        min-height: 160px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: var(--space-4);
      }
      .wallet-watermark {
        position: absolute;
        right: var(--space-4);
        bottom: var(--space-3);
        color: rgba(255, 255, 255, 0.16);
        font-size: 2.4rem;
        font-weight: var(--font-extra);
        pointer-events: none;
      }
      .wallet-card-content,
      .wallet-actions {
        position: relative;
        z-index: 1;
      }
      .wallet-title {
        font-size: var(--text-sm);
        font-weight: var(--font-bold);
        opacity: 0.95;
      }
      .wallet-balance {
        margin-top: var(--space-1);
        font-size: var(--text-display);
        font-weight: var(--font-bold);
        line-height: var(--line-tight);
      }
      .wallet-card-meta {
        margin-top: var(--space-1);
        font-size: var(--text-sm);
        opacity: 0.85;
      }
      .wallet-actions {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .wallet-actions .btn-secondary {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.55);
        color: #fff;
      }
    `,
  ],
})
export class WalletCardComponent {
  private readonly walletService = inject(WalletService);
  readonly brand = APP_BRAND;
  readonly mainCard = this.walletService.defaultCard;
  readonly balanceLabel = computed(() => `${this.walletService.balance().toFixed(2).replace('.', ',')} €`);
}
