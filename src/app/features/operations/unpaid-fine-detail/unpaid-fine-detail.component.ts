import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { canMoveFineToHistory, FineStatus, UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { WalletService } from '../../../core/services/wallet.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { TranslationService } from '../../../core/services/translation.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { OperationsService } from '../../../core/services/operations.service';
import { OperationType } from '../../../shared/models/operation-type';
import { OpsApiError } from '../../../core/api/ops-api.types';
import { apiErrorKey } from '../../../core/http/api-error-key';
import { isCardUsable } from '../../../core/utils/card-expiry';
import { LocationMap } from '../../../shared/components/location-map/location-map';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { formatFineDate } from '../../../shared/utils/fine-date';

@Component({
  selector: 'app-unpaid-fine-detail',
  imports: [RouterLink, DecimalPipe, TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent, LocationMap, AppIconComponent, OperationIconComponent],
  template: `
    @if (errorMessage(); as error) {
      <app-result-modal
        type="error"
        [title]="'ops.fineDetail.errorTitle' | translate"
        [message]="error"
        [primaryText]="'common.close' | translate"
        (primaryAction)="dismissError()"
      />
    } @else if (acknowledged()) {
      <app-result-modal
        type="success"
        [title]="'ops.fineDetail.acknowledgedTitle' | translate"
        [message]="'ops.fineDetail.acknowledgedMessage' | translate"
        [primaryText]="'ops.unpaidFines.back' | translate"
        (primaryAction)="onBackToFines()"
      />
    } @else if (!paid()) {
      <div class="page fine-detail-page">
        <app-detail-panel-header [title]="'ops.fineDetail.title' | translate" backRoute="/app/operations/unpaid-fines" />
        @if (fine) {
          <div class="fine-detail-scroll">
            <section class="fine-detail-intro">
              <div class="fine-detail-kind">
                <app-operation-icon [type]="operationType.UNPAID_FINES" />
                <strong>{{ 'ops.fineDetail.sanction' | translate }}</strong>
              </div>
              <strong class="fine-detail-amount">{{ fine.amount }}</strong>
            </section>
            @if (fine.status === fineStatus.PAYABLE && fine.earlyPaymentDeadline) {
              <div class="fine-detail-row">
                <span class="fine-detail-row-icon"><app-icon name="schedule" [stroke]="false" /></span>
                <div><span>{{ 'ops.fineDetail.earlyPaymentEnd' | translate }}</span><strong>{{ displayDate(fine.earlyPaymentDeadline) }}</strong></div>
              </div>
            }
            @if (fine.status !== fineStatus.PAYABLE) {
              @if (fine.earlyPaymentDeadline) {
                <div class="fine-detail-row">
                  <span class="fine-detail-row-icon"><app-icon name="schedule" [stroke]="false" /></span>
                  <div><span>{{ 'ops.fineDetail.earlyPaymentEnd' | translate }}</span><strong>{{ displayDate(fine.earlyPaymentDeadline) }}</strong></div>
                </div>
              }
              <div class="fine-detail-message">
                <span class="fine-detail-row-icon"><app-icon name="warning" [stroke]="false" /></span>
                <p>{{ 'ops.fineDetail.statusMessage.' + fine.status | translate }}</p>
              </div>
            }
            <section class="fine-detail-info" aria-label="Detalle de la sanción">
              <div class="fine-detail-row"><span class="fine-detail-row-icon">#</span><div><span>{{ 'ops.fineDetail.fineNumber' | translate }}</span><strong>{{ fine.fineNumber }}</strong></div></div>
              <div class="fine-detail-row"><span class="fine-detail-row-icon"><app-icon name="vehicle" [stroke]="false" /></span><div><span>{{ 'ops.fineDetail.plate' | translate }}</span><strong>{{ fine.plate }}</strong></div></div>
              <div class="fine-detail-row"><span class="fine-detail-row-icon"><app-icon name="dateRange" [stroke]="false" /></span><div><span>{{ 'ops.detail.datetime' | translate }}</span><strong>{{ displayDate(fine.date) }}</strong></div></div>
              <div class="fine-detail-row"><span class="fine-detail-row-icon"><app-icon name="location" [stroke]="false" /></span><div><span>{{ fine.zoneName || ('ops.fineDetail.location' | translate) }}</span><strong>{{ fine.location }}</strong></div></div>
            </section>
            @if (fineCoordinates(); as coordinates) {
              <app-location-map
                [latitude]="coordinates.latitude"
                [longitude]="coordinates.longitude"
                [label]="'ops.detail.fineMapAria' | translate"
              />
            }
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
                    <label class="payment-card-option" [class.selected]="selectedCardId() === card.id" [class.disabled]="!isCardUsable(card)"
                      ><input
                        type="radio"
                        name="fine-card"
                        [checked]="selectedCardId() === card.id"
                        [disabled]="!isCardUsable(card)"
                        (change)="selectedCardId.set(card.id)"
                      /><span
                        ><strong>{{ card.brand }} •••• {{ card.last4 }}</strong
                        ><small>{{ 'ops.fineDetail.expires' | translate: { date: card.expiryDate } }}</small></span
                      ></label
                    >
                  }
                </fieldset>
              }
            }
          </div>
          <footer class="fine-detail-footer">
            @if (fine.status === fineStatus.PAYABLE) {
              <button type="button" class="btn btn-primary btn-block" (click)="pay()" [disabled]="insufficientFunds() && !selectedCardId()">
                {{ 'ops.fineDetail.pay' | translate }} {{ fine.amount }}
              </button>
            } @else if (canMoveToHistory()) {
              <button type="button" class="btn btn-primary btn-block fine-understood-button" (click)="acknowledgeExpired()" [disabled]="movingToHistory()">
                {{ 'ops.fineDetail.understood' | translate }}
              </button>
            }
          </footer>
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
      :host {
        display: block;
        height: 100%;
        min-height: 0;
      }
      .fine-detail-page {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        padding: 0;
        overflow: hidden;
      }
      .fine-detail-page app-detail-panel-header {
        flex: 0 0 auto;
      }
      .fine-detail-scroll {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        padding: 0.4rem 1.4rem 1.5rem;
      }
      .fine-detail-intro {
        padding: 0.9rem 0 1.1rem;
      }
      .fine-detail-kind {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .fine-detail-amount {
        display: block;
        color: #813832;
        font-size: clamp(2rem, 8vw, 2.5rem);
        line-height: 1;
      }
      .fine-detail-row {
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr);
        gap: 1rem;
        align-items: start;
        padding: 0.75rem 0;
      }
      .fine-detail-row-icon {
        display: grid;
        width: 30px;
        height: 30px;
        place-items: center;
        color: var(--color-text-muted);
        font-size: 1.6rem;
        line-height: 1;
      }
      .fine-detail-row > div {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
      }
      .fine-detail-row span:not(.fine-detail-row-icon) {
        color: var(--color-text-muted);
      }
      .fine-detail-row strong {
        font-size: var(--text-base);
        font-weight: var(--font-normal);
        line-height: 1.45;
        overflow-wrap: anywhere;
      }
      .fine-detail-message {
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr);
        gap: 1rem;
        align-items: start;
        padding: 0.8rem 0 1rem;
        color: var(--color-error);
      }
      .fine-detail-message p {
        margin: 0;
        line-height: 1.5;
      }
      .fine-detail-message .fine-detail-row-icon {
        color: var(--color-error);
      }
      .fine-detail-footer {
        position: sticky;
        bottom: 0;
        z-index: 20;
        flex: 0 0 auto;
        padding: 0.75rem 1.4rem calc(0.75rem + env(safe-area-inset-bottom));
        border-top: 1px solid var(--color-border);
        background: var(--color-surface);
        box-shadow: 0 -8px 20px rgba(30, 43, 35, 0.08);
      }
      .fine-detail-footer .btn {
        margin: 0;
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
      .fine-understood-button {
        display: block;
        width: 100%;
        margin: 1.25rem 0 0;
        padding: 1rem 1.25rem;
        border: 0;
        border-radius: 999px;
        color: #fff;
        background: var(--color-primary-dark, #007b78);
        font: inherit;
        font-weight: var(--font-bold);
        cursor: pointer;
      }
      .fine-understood-button:disabled {
        opacity: 0.65;
        cursor: wait;
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
  readonly operationType = OperationType;

  private readonly params = toSignal(this.route.paramMap);
  get fineId(): string {
    return this.params()?.get('id') ?? '';
  }
  get fine() {
    return this.unpaidFinesService.getFine(this.fineId);
  }
  readonly paid = signal(false);
  readonly acknowledged = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly movingToHistory = signal(false);
  readonly canMoveToHistory = computed(() => {
    const fine = this.fine;
    return Boolean(fine && canMoveFineToHistory({ type: OperationType.UNPAID_FINES, fineStatus: fine.status, timePeriod: fine.timePeriod }));
  });
  readonly selectedCardId = signal(this.walletService.defaultCardId());
  readonly isCardUsable = isCardUsable;
  readonly usableCards = computed(() => this.walletService.cards().filter((card) => isCardUsable(card)));
  readonly numericAmount = computed(() => {
    if (!this.fine) return 0;
    return this.fine.amountValue;
  });
  readonly fineCoordinates = computed(() => {
    const fine = this.fine;
    if (!fine) return null;
    const { latitude, longitude } = fine;
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude!) > 90 ||
      Math.abs(longitude!) > 180 ||
      (latitude === 0 && longitude === 0)
    )
      return null;
    return { latitude: latitude!, longitude: longitude! };
  });
  readonly walletAmount = computed(() => Math.min(this.walletService.balance(), this.numericAmount()));
  readonly cardAmount = computed(() => Math.max(0, this.numericAmount() - this.walletAmount()));

  readonly capturedWalletAmount = signal(0);
  readonly capturedCardAmount = signal(0);
  private readonly paidFine = signal<{ plate: string; location: string } | undefined>(undefined);

  constructor() {
    const operationsService = inject(OperationsService);
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((id) => {
        this.paid.set(false);
        this.acknowledged.set(false);
        this.errorMessage.set(null);
        this.selectedCardId.set(this.walletService.defaultCardId());
        if (id) void operationsService.loadDetail(id);
      });
  }

  readonly displayDate = formatFineDate;

  readonly successMessage = computed(() => {
    const wallet = this.capturedWalletAmount();
    const card = this.capturedCardAmount();
    const params = {
      plate: this.paidFine()?.plate ?? '',
      location: this.paidFine()?.location ?? '',
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
    return this.walletService.balance() < this.numericAmount() || !this.usableCards().length;
  };

  async pay(): Promise<void> {
    const fine = this.fine;
    if (!fine) return;
    const walletAmt = this.walletAmount();
    const cardAmt = this.cardAmount();
    const result = await this.unpaidFinesService.payFine(fine.id, this.selectedCardId());
    if (this.fineId !== fine.id) return;
    if (result.challengeUrl) {
      window.location.assign(result.challengeUrl);
      return;
    }
    if (result.success) {
      this.paidFine.set(fine);
      this.capturedWalletAmount.set(walletAmt);
      this.capturedCardAmount.set(cardAmt);
      this.paid.set(true);
      return;
    }
    this.errorMessage.set(this.failureMessage('ops.fineDetail.payFailed', result.error));
  }

  async acknowledgeExpired(): Promise<void> {
    if (!this.fine) return;
    this.movingToHistory.set(true);
    try {
      const result = await this.unpaidFinesService.acknowledgeExpired(this.fineId);
      if (result.success) {
        this.acknowledged.set(true);
        return;
      }
      this.errorMessage.set(this.failureMessage('ops.fineDetail.actionFailed', result.error));
    } finally {
      this.movingToHistory.set(false);
    }
  }

  onBackToFines(): void {
    void this.router.navigate(['/app/operations/unpaid-fines']);
  }

  dismissError(): void {
    this.errorMessage.set(null);
  }

  private failureMessage(key: string, error?: OpsApiError): string {
    return this.translationService.translate(key, { message: this.localizedError(error) });
  }

  private localizedError(error?: OpsApiError): string {
    if (!error) return this.translationService.translate('errors.server');
    if (error.backendError) return error.message;
    return this.translationService.translate(apiErrorKey(error));
  }
}
