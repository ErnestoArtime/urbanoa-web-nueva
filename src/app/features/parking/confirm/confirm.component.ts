import { RuntimeStyleDirective } from '../../../shared/directives/runtime-style.directive';
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
import { isPaymentOutcomeUnknown } from '../../../core/utils/payment-error';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { isCardUsable } from '../../../core/utils/card-expiry';
import { TranslationService } from '../../../core/services/translation.service';
import { PaymentChallengeService } from '../../../core/services/payment-challenge.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-parking-confirm',
  imports: [
    RuntimeStyleDirective,
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
          <span [appRuntimeStyle]="{ background: sectorColor() }"></span>
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
          ><strong
            >{{ query().duration }}
            @if (query().startDayLabel; as startDayLabel) {
              · desde {{ dayLabel(startDayLabel) }} ({{ query().startTime }})
            }
            @if (query().endDayLabel; as endDayLabel) {
              · hasta {{ dayLabel(endDayLabel) }} ({{ query().endTime }})
            }
          </strong>
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
        <section class="payment-selector" [class.empty-payment]="requiresCard() && !usableCards().length">
          <p class="wallet-priority">
            {{ 'payment.walletPriority' | translate: { balance: walletService.balance().toFixed(2).replace('.', ',') } }}
          </p>
          @if (requiresCard() && usableCards().length > 1) {
            <p class="card-needed">{{ 'payment.chooseCard' | translate: { amount: cardAmount().toFixed(2).replace('.', ',') } }}</p>
            @for (card of walletService.cards(); track card.id) {
              <label class="payment-option" [class.selected]="selectedCard().id === card.id" [class.disabled]="!isCardUsable(card)">
                <input
                  type="radio"
                  name="parking-payment"
                  [value]="card.id"
                  [checked]="selectedCard().id === card.id"
                  [disabled]="!isCardUsable(card)"
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
          [disabled]="loading() || walletService.loading() || walletManagerOpen() || paymentUncertain()"
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
  styleUrl: './confirm.component.css',
})
export class ParkingConfirmComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ParkingFlowStore);
  readonly walletService = inject(WalletService);
  private readonly parkingApi = inject(ParkingApiService);
  private readonly ticketStore = inject(ParkingTicketStoreService);
  private readonly operations = inject(OperationsService);
  private readonly translations = inject(TranslationService);
  private readonly paymentChallenge = inject(PaymentChallengeService);
  private readonly authService = inject(AuthService);
  @ViewChild(SwipeToPayComponent) swipePay!: SwipeToPayComponent;
  private readonly initialQuery = readParkingFlowQuery(this.route);
  readonly query = computed(() =>
    this.store.hasMinimumParkingData() ? ({ ...this.initialQuery, ...this.store.fromStore() } as ParkingFlowQuery) : this.initialQuery,
  );
  readonly selectedCardId = signal(this.walletService.defaultCardId());
  readonly isCardUsable = isCardUsable;
  readonly usableCards = computed(() => this.walletService.cards().filter((card) => isCardUsable(card)));
  readonly selectedCard = computed(
    () => this.usableCards().find((card) => card.id === this.selectedCardId()) ?? this.walletService.mainCard,
  );
  readonly wallet = computed(() => ({
    balance: this.walletService.balance(),
    mainCard: this.selectedCard(),
  }));
  readonly walletManagerOpen = signal(false);
  readonly paymentAlertOpen = signal(false);
  readonly loading = signal(false);
  readonly submitError = signal<string | null>(
    this.paymentChallenge.hasPendingPayment() ? this.translations.translate('payment.uncertain.message') : null,
  );
  readonly paymentUncertain = signal(this.paymentChallenge.hasPendingPayment());
  private confirmationPending = false;

  readonly totalAmount = computed(() => {
    const raw = this.query().amount?.replace('€', '').replace(',', '.').trim();
    return raw ? parseFloat(raw) : 0;
  });
  readonly cardAmount = computed(() => Math.max(0, this.totalAmount() - this.walletService.balance()));
  readonly requiresCard = computed(() => this.cardAmount() > 0);

  dayLabel(value?: string): string {
    if (!value) return '';
    return value.startsWith('ops.') ? this.translations.translate(value) : value;
  }

  async ngOnInit(): Promise<void> {
    if (!this.walletService.loading()) await this.walletService.load();
    if (!this.selectedCardId()) this.selectedCardId.set(this.walletService.defaultCardId());
  }

  sectorColor(): string {
    return this.query().sectorColor ? `#${this.query().sectorColor.replace('#', '')}` : 'var(--color-primary)';
  }

  async onSwipeComplete(): Promise<void> {
    if (this.confirmationPending || this.walletService.loading() || this.walletManagerOpen()) return;
    if (this.paymentUncertain() || this.paymentChallenge.hasPendingPayment()) {
      this.paymentUncertain.set(true);
      this.submitError.set(this.translations.translate('payment.uncertain.message'));
      this.swipePay.reset();
      return;
    }
    const amount = this.totalAmount();
    const cards = this.usableCards();
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
    this.paymentChallenge.begin({
      kind: this.query().mode === 'extension' ? 'parking-extension' : 'parking',
      returnUrl: '/app/operations',
      amount,
      status: 'uncertain',
    });
    try {
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
        reference: this.query().mode === 'extension' ? this.query().opBaseId || '' : '',
      };
      const result =
        this.query().mode === 'extension'
          ? await this.parkingApi.confirmExtension({ ...confirmation, latitude: 0, longitude: 0, street: '' })
          : await this.parkingApi.confirmParking(confirmation);
      if (!result.success) {
        if (isPaymentOutcomeUnknown(result.error)) {
          this.paymentUncertain.set(true);
          this.submitError.set(this.translations.translate('payment.uncertain.message'));
          await this.operations.load();
        } else {
          this.paymentChallenge.clear();
          this.submitError.set(this.translations.translate('parking.confirm.operationError'));
        }
        return;
      }
      if (result.challengeUrl) {
        this.paymentUncertain.set(true);
        this.paymentChallenge.begin({
          kind: this.query().mode === 'extension' ? 'parking-extension' : 'parking',
          returnUrl: '/app/operations',
          amount,
        });
        try {
          this.authService.preparePaymentRedirect(result.challengeUrl);
          window.location.assign(result.challengeUrl);
        } catch (error) {
          this.paymentChallenge.begin({
            kind: this.query().mode === 'extension' ? 'parking-extension' : 'parking',
            returnUrl: '/app/operations',
            amount,
            status: 'uncertain',
          });
          throw error;
        }
        return;
      }

      await this.finishConfirmation(walletAmount, result.operationId);
      this.paymentChallenge.clear();
    } catch {
      this.paymentUncertain.set(true);
      this.submitError.set(this.translations.translate('payment.uncertain.message'));
    } finally {
      this.loading.set(false);
      this.confirmationPending = false;
      this.swipePay.reset();
    }
  }

  openPaymentMethods(): void {
    this.paymentAlertOpen.set(false);
    this.walletManagerOpen.set(true);
  }

  private async finishConfirmation(walletAmount: number, operationId?: number | string): Promise<void> {
    const paymentQuery = {
      ...this.query(),
      operationId: operationId ?? '',
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

    const navigated = await this.router.navigate(['/app/parking/success'], { queryParams: paymentQuery });
    if (navigated === false) throw new Error('Confirmation navigation cancelled');
    this.loading.set(false);
    this.confirmationPending = false;
  }
}
