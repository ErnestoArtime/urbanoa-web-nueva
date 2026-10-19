import { formatEuro } from '../../../core/utils/euro-format';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';

import { Component, effect, input, output, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { OperationsService } from '../../../core/services/operations.service';
import { PaymentChallengeService } from '../../../core/services/payment-challenge.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { WalletService } from '../../../core/services/wallet.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { isCardUsable } from '../../../core/utils/card-expiry';
import { isPaymentOutcomeUnknown } from '../../../core/utils/payment-error';

@Component({
  selector: 'app-account-recharge',
  imports: [EuroPipe, ReactiveFormsModule, RouterLink, TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent, LoaderComponent],
  template: `
    <app-loader [visible]="saving()" [message]="'common.loading' | translate" />
    <div class="page account-static-page account-form-page">
      @if (!embedded()) {
        <app-detail-panel-header [title]="'account.recharge.title' | translate" backRoute="/app/account/payment-methods" />
      } @else {
        <h2>{{ 'account.recharge.title' | translate }}</h2>
      }
      @if (walletService.source() === 'error') {
        <p class="data-notice" role="alert">{{ 'account.recharge.serviceError' | translate }}</p>
      }
      @if (submitError(); as error) {
        <p class="data-notice" role="alert">{{ error }}</p>
      }
      @if (!usableCards().length) {
        <div class="card empty-recharge-state">
          <p class="card-title">{{ 'dashboard.cardEmptyTitle' | translate }}</p>
          <p class="text-muted">{{ 'dashboard.cardEmptyDetail' | translate }}</p>
          @if (embedded()) {
            <button type="button" class="btn btn-primary btn-block mt-2" (click)="addCard.emit()">
              {{ 'account.addCard' | translate }}
            </button>
          } @else {
            <a routerLink="/app/account/payment-methods/add" class="btn btn-primary btn-block mt-2">{{ 'account.addCard' | translate }}</a>
          }
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="confirm()" novalidate>
          <div class="card">
            <p class="text-muted">
              {{ 'account.recharge.currentBalance' | translate }} <strong>{{ walletService.balance() | euro }}</strong>
            </p>
            <fieldset class="recharge-options">
              <legend>{{ 'account.recharge.amountQuestion' | translate }}</legend>
              @for (amount of rechargeAmounts; track amount) {
                <label class="recharge-option" [class.active]="selectedAmount() === amount">
                  <input type="radio" formControlName="amount" [value]="amount" />{{ amount | euro }}
                </label>
              }
            </fieldset>
            @if (amountControl.invalid && amountControl.touched) {
              <p class="form-error">{{ 'validation.amount' | translate }}</p>
            }
          </div>
          <fieldset class="payment-card-selector mt-1">
            <legend>{{ 'account.recharge.cardForRecharge' | translate }}</legend>
            <div role="radiogroup" [attr.aria-label]="'account.recharge.cardForRecharge' | translate">
              @for (card of walletService.cards(); track card.id) {
                <label class="payment-card-option" [class.selected]="selectedCardId() === card.id" [class.disabled]="!isCardUsable(card)">
                  <input type="radio" formControlName="cardId" [value]="card.id" [disabled]="!isCardUsable(card)" />
                  <span
                    ><strong>{{ card.brand }} •••• {{ card.last4 }}</strong
                    ><small>{{ card.cardholderName }} · {{ 'account.recharge.expires' | translate }} {{ card.expiryDate }}</small></span
                  >
                </label>
              }
            </div>
            @if (cardControl.invalid && cardControl.touched) {
              <p class="form-error">{{ 'validation.required' | translate }}</p>
            }
          </fieldset>
          <div class="card mt-1">
            <p>
              {{ 'account.recharge.balanceAfter' | translate }} <strong>{{ balanceAfterRecharge() | euro }}</strong>
            </p>
          </div>
          <button type="submit" class="btn btn-primary btn-block mt-2" [disabled]="saving() || paymentUncertain()">
            {{ (saving() ? 'common.loading' : 'account.recharge.button') | translate }}
          </button>
        </form>
      }
      @if (done()) {
        <app-result-modal
          type="success"
          [title]="'account.recharge.success' | translate"
          [message]="'account.recharge.successDetail' | translate: { amount: formatEuro(selectedAmount()) }"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="done.set(false)"
        />
      }
    </div>
  `,
  styleUrl: './recharge.component.css',
})
export class AccountRechargeComponent {
  readonly formatEuro = formatEuro;
  readonly cardId = input('');
  readonly addCard = output<void>();
  readonly embedded = input(false);
  readonly back = output<void>();

  readonly walletService = inject(WalletService);
  private readonly route = inject(ActivatedRoute);
  private readonly operationsService = inject(OperationsService);
  private readonly paymentChallenge = inject(PaymentChallengeService);
  private readonly authService = inject(AuthService);
  private readonly translationService = inject(TranslationService);
  private readonly fb = inject(FormBuilder);
  readonly rechargeAmounts = [1, 2, 5, 10, 20, 30, 40] as const;
  readonly done = signal(false);
  readonly saving = signal(false);
  readonly submitError = signal<string | null>(
    this.paymentChallenge.hasPendingPayment() ? this.translationService.translate('payment.uncertain.message') : null,
  );
  readonly paymentUncertain = signal(this.paymentChallenge.hasPendingPayment());
  readonly isCardUsable = isCardUsable;
  readonly usableCards = () => this.walletService.cards().filter((card) => isCardUsable(card));
  private readonly queryCardId = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('cardId'))), {
    initialValue: this.route.snapshot.queryParamMap.get('cardId'),
  });
  readonly form = this.fb.nonNullable.group({
    amount: [1, [Validators.required, Validators.min(1)]],
    cardId: [this.initialCardId(), Validators.required],
  });
  private readonly syncSelectedCard = effect(() => {
    const cardId = this.queryCardId();
    if (cardId && this.usableCards().some((card) => card.id === cardId)) {
      this.form.controls.cardId.setValue(cardId);
    }
  });

  private readonly syncCard = effect(() => {
    if (this.usableCards().some((card) => card.id === this.cardId())) this.form.controls.cardId.setValue(this.cardId());
  });

  selectedAmount(): number {
    return Number(this.form.controls.amount.value) || 0;
  }

  balanceAfterRecharge(): number {
    const balanceInCents = Math.round(this.walletService.balance() * 100);
    const amountInCents = Math.round(this.selectedAmount() * 100);
    return (balanceInCents + amountInCents) / 100;
  }

  selectedCardId(): string {
    return this.form.controls.cardId.value;
  }

  get amountControl() {
    return this.form.controls.amount;
  }

  get cardControl() {
    return this.form.controls.cardId;
  }

  async confirm(): Promise<void> {
    if (this.done() || this.saving()) return;
    if (this.paymentUncertain() || this.paymentChallenge.hasPendingPayment()) {
      this.paymentUncertain.set(true);
      this.submitError.set(this.translationService.translate('payment.uncertain.message'));
      return;
    }
    if (!this.usableCards().some((card) => card.id === this.selectedCardId())) {
      this.form.controls.cardId.setErrors({ unavailable: true });
      this.form.controls.cardId.markAsTouched();
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const amount = this.selectedAmount();
    this.submitError.set(null);
    this.saving.set(true);
    this.paymentChallenge.begin({ kind: 'recharge', returnUrl: '/app/account/payment-methods/recharge', amount, status: 'uncertain' });
    try {
      const result = await this.walletService.recharge(amount, this.selectedCardId());
      if (result.challengeUrl) {
        this.paymentUncertain.set(true);
        this.paymentChallenge.beginRecharge({ amount, ...(result.order ? { order: result.order } : {}) });
        try {
          this.authService.preparePaymentRedirect(result.challengeUrl);
          window.location.assign(result.challengeUrl);
        } catch (error) {
          this.paymentChallenge.begin({
            kind: 'recharge',
            returnUrl: '/app/account/payment-methods/recharge',
            amount,
            status: 'uncertain',
            ...(result.order ? { order: result.order } : {}),
          });
          throw error;
        }
        return;
      }
      if (!result.success) {
        if (isPaymentOutcomeUnknown(result.error)) {
          this.paymentUncertain.set(true);
          this.submitError.set(this.translationService.translate('payment.uncertain.message'));
        } else {
          this.paymentChallenge.clear();
          this.submitError.set(this.translationService.translate('account.recharge.serviceError'));
        }
        return;
      }
      this.paymentChallenge.clear();
      this.done.set(true);
      void this.operationsService.load().catch(() => undefined);
    } catch {
      if (!this.done()) this.paymentUncertain.set(true);
      this.submitError.set(this.translationService.translate(this.done() ? 'errors.server' : 'payment.uncertain.message'));
    } finally {
      this.saving.set(false);
    }
  }

  private initialCardId(): string {
    const requested = this.queryCardId();
    return requested && this.usableCards().some((card) => card.id === requested)
      ? requested
      : (this.walletService.defaultCard?.()?.id ?? this.walletService.defaultCardId());
  }
}
