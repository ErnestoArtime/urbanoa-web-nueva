import { WalletManagerModalComponent } from '../../account/wallet-manager-modal/wallet-manager-modal.component';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PaymentSummaryComponent } from '../../../shared/components/payment-summary/payment-summary.component';
import { SwipeToPayComponent } from '../../../shared/components/swipe-to-pay/swipe-to-pay.component';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingFlowQuery, readParkingFlowQuery } from '../parking-flow.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';
import { ParkingApiService } from '../../../core/services/parking-api.service';
import { ParkingTicketStoreService } from '../../../core/services/parking-ticket-store.service';
import { OperationsService } from '../../../core/services/operations.service';
import { OpsApiError } from '../../../core/api/ops-api.types';
import { Operation } from '../../../shared/models/operation';
import { OperationType } from '../../../shared/models/operation-type';
import { parseOpsDate } from '../../../core/utils/ops-date';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-parking-confirm',
  imports: [
    WalletManagerModalComponent,
    ResultModalComponent,
    RouterLink,
    LoaderComponent,
    PaymentSummaryComponent,
    SwipeToPayComponent,
    TranslatePipe,
  ],
  template: `
    <div class="page flow-page confirm-page has-sticky-actions">
      <app-loader [visible]="loading()" [message]="'parking.confirm.loading' | translate" imageSrc="/assets/brand/login-logo.jpg" />
      <a routerLink="/app/parking/time-steps" [queryParams]="query()" class="back-link">{{ 'parking.confirm.back' | translate }}</a>
      <h1 class="page-title">{{ 'parking.confirm.title' | translate }}</h1>
      @if (submitError()) {
        <p class="submit-error" role="alert">{{ submitError() }}</p>
      }

      <div class="card summary">
        <div class="zone-heading">
          <span [style.background]="sectorColor()"></span>
          <div>
            <strong>{{ query().zone }}</strong>
            <p>{{ query().street }} · {{ query().cityName }}</p>
          </div>
        </div>
        <p>
          <span>{{ 'parking.confirm.vehicle' | translate }}</span
          ><strong>{{ query().plate }}</strong>
        </p>
        <p>
          <span>{{ 'parking.confirm.duration' | translate }}</span
          ><strong>{{ query().duration }} · hasta {{ query().endTime }}</strong>
        </p>
        <p>
          <span>{{ 'parking.confirm.tariff' | translate }}</span
          ><strong>{{ query().tariff }}</strong>
        </p>
        <p class="total-row">
          <span>{{ 'parking.confirm.amount' | translate }}</span
          ><strong>{{ query().amount }}</strong>
        </p>
      </div>

      <app-payment-summary [wallet]="wallet()" [totalAmount]="totalAmount()">
        <section class="payment-selector" [class.empty-payment]="requiresCard() && !walletService.cards().length">
          <p class="wallet-priority">
            {{ 'payment.walletPriority' | translate: { balance: walletService.balance().toFixed(2).replace('.', ',') } }}
          </p>
          @if (requiresCard() && walletService.cards().length > 1) {
            <p class="card-needed">{{ 'payment.chooseCard' | translate: { amount: cardAmount().toFixed(2).replace('.', ',') } }}</p>
            @for (card of walletService.cards(); track card.id) {
              <label class="payment-option" [class.selected]="selectedCard().id === card.id">
                <input
                  type="radio"
                  name="parking-payment"
                  [value]="card.id"
                  [checked]="selectedCard().id === card.id"
                  (change)="selectedCardId.set(card.id)"
                />
                <span>{{ card.brand }} •••• {{ card.last4 }}</span
                ><small>{{ 'payment.cardExpiry' | translate: { date: card.expiryDate } }}</small>
              </label>
            }
          }
        </section>
      </app-payment-summary>

      <div class="sticky-actions" [attr.aria-busy]="loading()">
        <app-swipe-to-pay
          #swipePay
          [disabled]="loading() || walletService.loading() || walletManagerOpen()"
          [label]="loading() ? ('parking.confirm.loading' | translate) : undefined"
          [completedLabel]="loading() ? ('parking.confirm.loading' | translate) : undefined"
          (complete)="onSwipeComplete()"
        />
      </div>

      <button type="button" class="btn btn-ghost change-payment" [disabled]="loading()" (click)="walletManagerOpen.set(true)">
        {{ 'parking.confirm.changePayment' | translate }}
      </button>
      @if (walletManagerOpen()) {
        <app-wallet-manager-modal (closed)="walletManagerOpen.set(false)" />
      }
      @if (paymentAlertOpen()) {
        <app-result-modal
          type="warning"
          [title]="'payment.insufficient.title' | translate"
          [message]="'payment.insufficient.message' | translate"
          [primaryText]="'parking.confirm.changePayment' | translate"
          [secondaryText]="'common.cancel' | translate"
          (primaryAction)="openPaymentMethods()"
          (secondaryAction)="paymentAlertOpen.set(false)"
        />
      }
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
        width: 100%;
        margin-top: 0.7rem;
        text-align: center;
        font-size: var(--text-xs);
      }
      .payment-selector {
        display: grid;
        gap: 0.5rem;
        margin-top: 0.8rem;
      }
      .payment-selector.empty-payment {
        margin: 0 0 0.5rem;
      }
      .payment-selector.empty-payment .wallet-priority {
        color: var(--color-text);
        font-size: var(--text-sm);
        line-height: 1.5;
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
      .submit-error {
        margin-bottom: 0.8rem;
        padding: 0.75rem 0.9rem;
        border-radius: var(--radius-md);
        background: var(--color-error-bg);
        color: var(--color-error);
      }
      .sticky-actions {
        margin-top: 1rem;
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
export class ParkingConfirmComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ParkingFlowStore);
  readonly walletService = inject(WalletService);
  private readonly parkingApi = inject(ParkingApiService);
  private readonly ticketStore = inject(ParkingTicketStoreService);
  private readonly operations = inject(OperationsService);
  @ViewChild(SwipeToPayComponent) swipePay!: SwipeToPayComponent;
  private readonly initialQuery = readParkingFlowQuery(this.route);
  readonly query = computed(() =>
    this.store.hasMinimumParkingData() ? ({ ...this.initialQuery, ...this.store.fromStore() } as ParkingFlowQuery) : this.initialQuery,
  );
  readonly selectedCardId = signal(this.walletService.defaultCardId());
  readonly selectedCard = computed(
    () => this.walletService.cards().find((card) => card.id === this.selectedCardId()) ?? this.walletService.mainCard,
  );
  readonly wallet = computed(() => ({
    balance: this.walletService.balance(),
    mainCard: this.selectedCard(),
  }));
  readonly walletManagerOpen = signal(false);
  readonly paymentAlertOpen = signal(false);
  readonly loading = signal(false);
  readonly submitError = signal<string | null>(null);
  private confirmationPending = false;

  readonly totalAmount = computed(() => {
    const raw = this.query().amount?.replace('€', '').replace(',', '.').trim();
    return raw ? parseFloat(raw) : 0;
  });
  readonly cardAmount = computed(() => Math.max(0, this.totalAmount() - this.walletService.balance()));
  readonly requiresCard = computed(() => this.cardAmount() > 0);

  async ngOnInit(): Promise<void> {
    if (!this.walletService.loading()) await this.walletService.load();
    if (!this.selectedCardId()) this.selectedCardId.set(this.walletService.defaultCardId());
  }

  sectorColor(): string {
    return this.query().sectorColor ? `#${this.query().sectorColor.replace('#', '')}` : 'var(--color-primary)';
  }

  async onSwipeComplete(): Promise<void> {
    if (this.confirmationPending || this.walletService.loading() || this.walletManagerOpen()) return;
    const amount = this.totalAmount();
    const cards = this.walletService.cards();
    if (this.requiresCard() && !cards.length) {
      this.paymentAlertOpen.set(true);
      this.swipePay.reset();
      return;
    }
    if (this.requiresCard()) {
      const selected = cards.find((card) => card.id === this.selectedCardId()) ?? this.selectedCard();
      if (!selected?.id) return;
      this.selectedCardId.set(selected.id);
    }
    const walletAmount = Math.min(amount, this.walletService.balance());
    this.confirmationPending = true;
    this.loading.set(true);
    this.submitError.set(null);
    const attemptStartedAt = this.parkingApi.serverNow();
    const confirmation = {
      contractId: Number(this.query().cityId || 0),
      plate: this.query().plate,
      sector: Number(this.query().sectorId || 0),
      quantity: Math.round(amount * 100),
      tariffType: Number(this.query().tariffType || 0),
      date: this.parkingApi.opsDate(this.parkingApi.serverNow()),
      time: Number(this.query().minutes || 0),
      latitude: Number(this.query().latitude || 0),
      longitude: Number(this.query().longitude || 0),
      street: this.query().street,
      payMethodId: Number(this.selectedCardId() || 0),
    };
    const result =
      this.query().mode === 'extension'
        ? await this.parkingApi.confirmExtension({ ...confirmation, latitude: 0, longitude: 0, street: '' })
        : await this.parkingApi.confirmParking(confirmation);
    if (!result.success) {
      const recovered = this.shouldRecoverOperation(result.error)
        ? await this.recoverConfirmedOperation(attemptStartedAt, amount)
        : undefined;
      if (recovered) {
        await this.finishConfirmation(walletAmount, recovered.id, recovered);
        return;
      }
      this.submitError.set(result.error instanceof Error ? result.error.message : 'No se pudo confirmar la operación.');
      this.loading.set(false);
      this.confirmationPending = false;
      this.swipePay.reset();
      return;
    }
    if (result.challengeUrl) {
      window.location.assign(result.challengeUrl);
      return;
    }

    await this.finishConfirmation(walletAmount, result.operationId);
  }

  openPaymentMethods(): void {
    this.paymentAlertOpen.set(false);
    this.walletManagerOpen.set(true);
  }

  private async finishConfirmation(walletAmount: number, operationId?: number | string, recovered?: Operation): Promise<void> {
    const paymentQuery = {
      ...this.query(),
      operationId: operationId ?? '',
      ...(recovered?.startTime ? { startTime: recovered.startTime } : {}),
      ...(recovered?.endTime ? { endTime: recovered.endTime } : {}),
      paymentWalletAmount: walletAmount.toFixed(2),
      paymentCardAmount: this.cardAmount().toFixed(2),
      paymentCardId: this.requiresCard() ? this.selectedCardId() : '',
      paymentCardLabel: this.requiresCard() ? `${this.selectedCard().brand} •••• ${this.selectedCard().last4}` : '',
    };

    const ticketId = Number(this.query().ticketId || 0);
    if (ticketId > 0) {
      this.ticketStore.save({
        plate: this.query().plate,
        ticketId,
        sectorId: Number(this.query().sectorId || 0) || undefined,
        contractId: Number(this.query().cityId || 0) || undefined,
      });
    }

    await this.router.navigate(['/app/parking/success'], { queryParams: paymentQuery });
    this.loading.set(false);
    this.confirmationPending = false;
  }

  private shouldRecoverOperation(error: unknown): boolean {
    return (
      error instanceof OpsApiError &&
      (error.backendError?.code === -13 ||
        error.kind === 'timeout' ||
        error.kind === 'abort' ||
        error.kind === 'transport' ||
        error.kind === 'invalid-response' ||
        (error.kind === 'http' && (error.status ?? 0) >= 500))
    );
  }

  private async recoverConfirmedOperation(attemptStartedAt: Date, amount: number): Promise<Operation | undefined> {
    const query = this.query();
    const expectedType = query.mode === 'extension' ? OperationType.PARKING_EXTENSION : OperationType.PARKING;
    const contractId = Number(query.cityId || 0);
    const sectorId = Number(query.sectorId || 0);
    const normalizedPlate = this.normalizePlate(query.plate);
    const recoveryWindowMs = 10 * 60_000;
    const retryDelaysMs = [0, 500, 1_500, 3_000];

    for (const delayMs of retryDelaysMs) {
      if (delayMs) await this.waitForRecoveryRetry(delayMs);
      await this.operations.load();
      if (this.operations.source() !== 'remote') continue;

      const recovered = this.operations
        .operations()
        .filter(
          (operation) =>
            operation.type === expectedType &&
            this.normalizePlate(operation.plate ?? '') === normalizedPlate &&
            (!contractId || operation.contractId === undefined || operation.contractId === contractId) &&
            (!sectorId || operation.sectorId === undefined || operation.sectorId === sectorId) &&
            Math.abs(Math.abs(operation.amount) - amount) < 0.01 &&
            operation.operationDate &&
            Math.abs(parseOpsDate(operation.operationDate).getTime() - attemptStartedAt.getTime()) <= recoveryWindowMs,
        )
        .sort((left, right) => parseOpsDate(right.operationDate!).getTime() - parseOpsDate(left.operationDate!).getTime())[0];
      if (recovered) return recovered;
    }
    return undefined;
  }

  private waitForRecoveryRetry(delayMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private normalizePlate(plate: string): string {
    return plate.replace(/\s+/g, '').toLocaleUpperCase('es');
  }
}
