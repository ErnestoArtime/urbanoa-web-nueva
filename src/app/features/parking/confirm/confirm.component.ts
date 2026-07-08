import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PaymentSummaryComponent } from '../../../shared/components/payment-summary/payment-summary.component';
import { SwipeToPayComponent } from '../../../shared/components/swipe-to-pay/swipe-to-pay.component';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingFlowQuery, readParkingFlowQuery } from '../parking-flow.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-parking-confirm',
  imports: [RouterLink, LoaderComponent, PaymentSummaryComponent, SwipeToPayComponent, TranslatePipe],
  template: `
    <div class="page flow-page confirm-page has-sticky-actions">
      <app-loader [visible]="loading()" [message]="'parking.confirm.loading' | translate" imageSrc="/assets/brand/login-logo.jpg" />
      <a routerLink="/app/parking/time-steps" [queryParams]="query" class="back-link">{{ 'parking.confirm.back' | translate }}</a>
      <h1 class="page-title">{{ 'parking.confirm.title' | translate }}</h1>

      <div class="card summary">
        <div class="zone-heading">
          <span [style.background]="sectorColor()"></span>
          <div>
            <strong>{{ query.zone }}</strong>
            <p>{{ query.street }} · {{ query.cityName }}</p>
          </div>
        </div>
        <p>
          <span>{{ 'parking.confirm.vehicle' | translate }}</span
          ><strong>{{ query.plate }}</strong>
        </p>
        <p>
          <span>{{ 'parking.confirm.duration' | translate }}</span
          ><strong>{{ query.duration }} · hasta {{ query.endTime }}</strong>
        </p>
        <p>
          <span>{{ 'parking.confirm.tariff' | translate }}</span
          ><strong>{{ query.tariff }}</strong>
        </p>
        <p class="total-row">
          <span>{{ 'parking.confirm.amount' | translate }}</span
          ><strong>{{ query.amount }}</strong>
        </p>
      </div>

      <section class="card payment-selector">
        <p class="payment-selector-title">Forma de pago</p>
        <p class="wallet-priority">
          El saldo del monedero se utilizará primero: {{ walletService.balance().toFixed(2).replace('.', ',') }} € disponibles.
        </p>
        @if (requiresCard()) {
          <p class="card-needed">Selecciona una tarjeta para abonar los {{ cardAmount().toFixed(2).replace('.', ',') }} € restantes.</p>
          @for (card of walletService.cards(); track card.id) {
            <label class="payment-option" [class.selected]="selectedCardId() === card.id">
              <input
                type="radio"
                name="parking-payment"
                [value]="card.id"
                [checked]="selectedCardId() === card.id"
                (change)="selectedCardId.set(card.id)"
              />
              <span>{{ card.brand }} •••• {{ card.last4 }}</span
              ><small>Caduca {{ card.expiryDate }}</small>
            </label>
          }
        }
      </section>

      <app-payment-summary [wallet]="wallet()" [totalAmount]="totalAmount()" />

      <div class="sticky-actions">
        <app-swipe-to-pay (complete)="onSwipeComplete()" />
      </div>

      <a routerLink="/app/account/payment-methods" class="change-payment">{{ 'parking.confirm.changePayment' | translate }}</a>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .flow-page {
        max-width: 680px;
      }
      .back-link {
        display: inline-block;
        margin-bottom: 0.65rem;
      }
      .flow-step {
        color: var(--color-primary);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .page-title {
        margin-bottom: 0.8rem;
      }
      .summary {
        padding: 0.85rem 1rem;
      }
      .summary > p {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.48rem 0;
        border-bottom: 1px solid var(--color-border);
      }
      .summary > p span {
        color: var(--color-text-muted);
      }
      .summary > p.total-row {
        border-bottom: none;
        padding-bottom: 0;
      }
      .summary > p.total-row strong {
        color: var(--color-primary);
        font-size: var(--text-lg);
      }
      .zone-heading {
        display: flex;
        gap: 0.8rem;
        padding-bottom: 0.4rem;
      }
      .zone-heading > span {
        width: 8px;
        border-radius: 99px;
      }
      .zone-heading p {
        color: var(--color-text-muted);
      }
      .change-payment {
        display: block;
        margin-top: 0.7rem;
        text-align: center;
        font-size: var(--text-xs);
      }
      .payment-selector {
        display: grid;
        gap: 0.5rem;
        margin-top: 0.8rem;
      }
      .payment-selector-title {
        font-weight: var(--font-bold);
      }
      .payment-option {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.6rem;
        padding: 0.65rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        cursor: pointer;
      }
      .payment-option.selected {
        border-color: var(--color-primary);
        background: var(--color-active);
      }
      .payment-option input {
        accent-color: var(--color-primary);
      }
      .payment-option small {
        color: var(--color-text-muted);
      }
      .wallet-priority,
      .card-needed {
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }
      @media (min-width: 960px) and (max-height: 950px) {
        .confirm-page {
          padding-top: 1rem;
          padding-bottom: 0.8rem;
        }
        .back-link {
          margin-bottom: 0.35rem;
        }
        .page-title {
          font-size: var(--text-xl);
          margin-bottom: 0.55rem;
        }
        .summary {
          padding: 0.65rem 0.9rem;
        }
        .summary > p {
          padding: 0.34rem 0;
        }
        .zone-heading {
          padding-bottom: 0.25rem;
        }
      }
    `,
  ],
})
export class ParkingConfirmComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ParkingFlowStore);
  readonly walletService = inject(WalletService);
  readonly query: ParkingFlowQuery = this.store.hasMinimumParkingData() ? this.store.fromStore() : readParkingFlowQuery(this.route);
  readonly selectedCardId = signal(this.walletService.defaultCardId());
  readonly selectedCard = computed(
    () => this.walletService.cards().find((card) => card.id === this.selectedCardId()) ?? this.walletService.mainCard,
  );
  readonly wallet = computed(() => ({
    balance: this.walletService.balance(),
    mainCard: this.selectedCard(),
  }));
  readonly loading = signal(false);

  readonly totalAmount = computed(() => {
    const raw = this.query.amount?.replace('€', '').replace(',', '.').trim();
    return raw ? parseFloat(raw) : 0;
  });
  readonly cardAmount = computed(() => Math.max(0, this.totalAmount() - this.walletService.balance()));
  readonly requiresCard = computed(() => this.cardAmount() > 0);

  sectorColor(): string {
    return this.query.sectorColor ? `#${this.query.sectorColor.replace('#', '')}` : 'var(--color-primary)';
  }

  onSwipeComplete(): void {
    if (this.loading()) return;
    const amount = this.totalAmount();
    if (this.requiresCard() && !this.walletService.cards().some((card) => card.id === this.selectedCardId())) return;
    const walletAmount = Math.min(amount, this.walletService.balance());
    const paid = walletAmount <= 0 || this.walletService.debit(walletAmount, 'Estacionamiento', 'parking-payment');
    if (!paid) return;

    this.loading.set(true);
    setTimeout(() => void this.router.navigate(['/app/parking/success'], { queryParams: this.query }), 1500);
  }
}
