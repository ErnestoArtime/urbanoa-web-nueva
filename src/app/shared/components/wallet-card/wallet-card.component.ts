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
  styleUrl: './wallet-card.component.css',
})
export class WalletCardComponent {
  private readonly walletService = inject(WalletService);
  readonly brand = APP_BRAND;
  readonly mainCard = this.walletService.defaultCard;
  readonly balanceLabel = computed(() => `${this.walletService.balance().toFixed(2).replace('.', ',')} €`);
}
