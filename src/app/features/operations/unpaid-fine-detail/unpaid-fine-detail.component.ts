import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FineStatus, UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { WalletService } from '../../../core/services/wallet.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-unpaid-fine-detail',
  imports: [RouterLink, DecimalPipe, TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    @if (!paid()) {
      <div class="page">
        <app-detail-panel-header [title]="'ops.fineDetail.title' | translate" backRoute="/app/operations/unpaid-fines" />
        @if (fine) {
          @if (fine.status === fineStatus.PAYABLE && fine.discountPercent) {
            <aside class="early-payment-banner">
              <span class="discount-badge">−{{ fine.discountPercent }}%</span>
              <div>
                <strong>{{ 'ops.fineDetail.earlyPayment.title' | translate }}</strong>
                <p>{{ 'ops.fineDetail.earlyPayment.description' | translate: { date: fine.earlyPaymentDeadline ?? '' } }}</p>
              </div>
            </aside>
          }
          @if (fine.status !== fineStatus.PAYABLE) {
            <aside class="fine-status-banner" [class.expired]="fine.status === fineStatus.EXPIRED">
              <strong>{{ ('ops.fineDetail.status.' + fine.status) | translate }}</strong>
              <p>{{ ('ops.fineDetail.statusMessage.' + fine.status) | translate }}</p>
            </aside>
          }
          <div class="fine-ticket-shell mt-2">
            <article class="fine-ticket-card">
              <div class="fine-ticket-accent"></div>
              <div class="fine-ticket-body">
                <p>
                  <strong>{{ 'ops.fineDetail.plate' | translate }}</strong> {{ fine.plate }}
                </p>
                <p class="mt-1">
                  <strong>{{ 'ops.fineDetail.fineNumber' | translate }}</strong> {{ fine.fineNumber }}
                </p>
                @if (fine.article) {
                  <p class="mt-1"><strong>{{ 'ops.fineDetail.article' | translate }}</strong> {{ fine.article }}</p>
                }
                @if (fine.vehicleMake || fine.vehicleColor) {
                  <p class="mt-1"><strong>{{ 'ops.fineDetail.vehicle' | translate }}</strong> {{ fine.vehicleMake }} {{ fine.vehicleColor }}</p>
                }
                <p class="mt-1">
                  <strong>{{ 'ops.fineDetail.location' | translate }}</strong> {{ fine.location }}
                </p>
                <p class="mt-1">
                  <strong>{{ 'ops.fineDetail.date' | translate }}</strong> {{ fine.date }}
                </p>
                @if (fine.processingDate) {
                  <p class="mt-1"><strong>{{ 'ops.fineDetail.processingDate' | translate }}</strong> {{ fine.processingDate }}</p>
                }
                @if (fine.contractName) {
                  <p class="mt-1"><strong>{{ 'ops.fineDetail.contract' | translate }}</strong> {{ fine.contractName }}</p>
                }
              </div>
              <div class="fine-ticket-cut"></div>
              <div class="fine-ticket-total">
                <strong>{{ 'ops.fineDetail.amount' | translate }}</strong>
                <div class="amount-stack">
                  @if (fine.originalAmount) {
                    <del>{{ fine.originalAmount }}</del>
                  }
                  <span>{{ fine.amount }}</span>
                </div>
              </div>
            </article>
          </div>
          @if (fine.status === fineStatus.PAYABLE) {
          <div class="mt-2 card payment-breakdown-card">
            <div class="payment-breakdown-row">
              <span class="payment-breakdown-label">{{ 'ops.fineDetail.availableBalance' | translate }}</span>
              <span class="payment-breakdown-value">{{ walletService.balance() | number: '1.2-2' }} €</span>
            </div>
          </div>
          @if (insufficientFunds()) {
            <fieldset class="payment-card-selector">
              <legend>{{ 'ops.fineDetail.cardForPayment' | translate }}</legend>
              @for (card of walletService.cards(); track card.id) {
                <label class="payment-card-option" [class.selected]="selectedCardId() === card.id"
                  ><input
                    type="radio"
                    name="fine-card"
                    [checked]="selectedCardId() === card.id"
                    (change)="selectedCardId.set(card.id)"
                  /><span
                    ><strong>{{ card.brand }} •••• {{ card.last4 }}</strong
                    ><small>{{ 'ops.fineDetail.expires' | translate: { date: card.expiryDate } }}</small></span
                  ></label
                >
              }
            </fieldset>
          }
          <button
            type="button"
            class="btn btn-primary btn-block mt-2"
            (click)="pay()"
            [disabled]="insufficientFunds() && !selectedCardId()"
          >
            {{ 'ops.fineDetail.pay' | translate }} {{ fine.amount }}
          </button>
          }
        } @else {
          <p class="mt-2 text-muted">{{ 'ops.unpaidFines.notFound' | translate }}</p>
          <a routerLink="/app/operations/unpaid-fines" class="btn btn-primary btn-block mt-2">{{ 'ops.unpaidFines.back' | translate }}</a>
        }
      </div>
    } @else {
      <app-result-modal
        type="success"
        [title]="'ops.fineDetail.paid' | translate"
        [message]="successMessage()"
        [primaryText]="'ops.unpaidFines.back' | translate"
        (primaryAction)="onBackToFines()"
      />
    }
  `,
  styles: [
    `
      .fine-ticket-shell {
        border-radius: 16px;
        filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.14));
      }
      .early-payment-banner {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        margin-top: 1rem;
        padding: 0.8rem 0.9rem;
        border: 1px solid color-mix(in srgb, var(--color-primary) 28%, transparent);
        border-radius: var(--radius-lg);
        background: var(--color-active);
      }
      .fine-status-banner {
        margin-top: 1rem;
        padding: 0.85rem 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        background: var(--color-active);
      }
      .fine-status-banner.expired { color: var(--color-error); background: var(--color-error-bg); }
      .fine-status-banner p { margin: 0.25rem 0 0; font-size: var(--text-sm); }
      .early-payment-banner strong {
        display: block;
        color: var(--color-primary-dark);
        font-size: var(--text-sm);
      }
      .early-payment-banner p {
        margin: 0.15rem 0 0;
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .discount-badge {
        flex: 0 0 auto;
        padding: 0.45rem 0.55rem;
        border-radius: 12px;
        color: #fff;
        background: var(--color-primary);
        font-weight: var(--font-bold);
      }
      .fine-ticket-card {
        --ticket-notch-r: 10px;
        --ticket-cut-y: 116px;
        position: relative;
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: 16px;
        background: var(--color-surface);
        box-shadow: none;
        -webkit-mask:
          radial-gradient(circle at 0 var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px)) left
            top / 51% 100% no-repeat,
          radial-gradient(circle at 100% var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px))
            right top / 51% 100% no-repeat;
        mask:
          radial-gradient(circle at 0 var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px)) left
            top / 51% 100% no-repeat,
          radial-gradient(circle at 100% var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px))
            right top / 51% 100% no-repeat;
      }
      .fine-ticket-accent {
        height: 10px;
        border-radius: 16px 16px 0 0;
        background: linear-gradient(90deg, #8f84f3 0%, #7971de 48%, #7469d2 100%);
      }
      .fine-ticket-body {
        padding: 1rem 1.2rem 0.6rem;
      }
      .fine-ticket-body p {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        color: var(--color-text-muted);
      }
      .fine-ticket-body strong {
        color: var(--color-text);
      }
      .fine-ticket-cut {
        position: relative;
        height: 20px;
        display: flex;
        align-items: center;
        margin: 0 calc(var(--ticket-notch-r) + 5px);
        background-image: linear-gradient(to right, rgba(149, 156, 146, 0.62) 50%, transparent 0);
        background-position: center;
        background-repeat: repeat-x;
        background-size: 8px 3px;
      }
      .fine-ticket-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1.2rem 1rem;
      }
      .fine-ticket-total span {
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
      }
      .amount-stack {
        display: flex;
        align-items: baseline;
        gap: 0.55rem;
      }
      .amount-stack del {
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }
      .payment-breakdown-card {
        padding: 0.75rem;
      }
      .payment-breakdown-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.3rem 0;
      }
      .payment-breakdown-label {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
      }
      .payment-breakdown-value {
        font-weight: var(--font-bold);
        font-size: var(--text-sm);
      }
      .payment-breakdown-value.wallet-amount {
        color: var(--color-primary);
      }
      .payment-breakdown-value.card-amount {
        color: var(--color-error);
      }
      .payment-breakdown-divider {
        height: 1px;
        background: var(--color-border);
        margin: 0.2rem 0;
      }
    `,
  ],
})
export class UnpaidFineDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly unpaidFinesService = inject(UnpaidFinesService);
  private readonly translationService = inject(TranslationService);
  readonly walletService = inject(WalletService);
  readonly fineStatus = FineStatus;

  readonly fineId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly fine = this.unpaidFinesService.getFine(this.fineId);
  readonly paid = signal(false);
  readonly selectedCardId = signal(this.walletService.defaultCardId());
  readonly numericAmount = computed(() => {
    if (!this.fine) return 0;
    return this.fine.amountValue;
  });
  readonly walletAmount = computed(() => Math.min(this.walletService.balance(), this.numericAmount()));
  readonly cardAmount = computed(() => Math.max(0, this.numericAmount() - this.walletAmount()));

  readonly capturedWalletAmount = signal(0);
  readonly capturedCardAmount = signal(0);

  readonly successMessage = computed(() => {
    const wallet = this.capturedWalletAmount();
    const card = this.capturedCardAmount();
    const params = {
      plate: this.fine?.plate ?? '',
      location: this.fine?.location ?? '',
      wallet: wallet.toFixed(2).replace('.', ','),
      card: card.toFixed(2).replace('.', ','),
    };
    if (card > 0) {
      return this.translationService.translate('ops.fineDetail.paidWithWalletAndCard', params);
    }
    return this.translationService.translate('ops.fineDetail.paidWithWallet', params);
  });

  readonly insufficientFunds = () => {
    if (!this.fine) return false;
    return this.walletService.balance() < this.numericAmount();
  };

  async pay(): Promise<void> {
    if (!this.fine) return;
    const walletAmt = this.walletAmount();
    const cardAmt = this.cardAmount();
    const ok = await this.unpaidFinesService.payFine(this.fineId, this.selectedCardId());
    if (ok) {
      this.capturedWalletAmount.set(walletAmt);
      this.capturedCardAmount.set(cardAmt);
      this.paid.set(true);
    }
  }

  onBackToFines(): void {
    void this.router.navigate(['/app/operations/unpaid-fines']);
  }
}
