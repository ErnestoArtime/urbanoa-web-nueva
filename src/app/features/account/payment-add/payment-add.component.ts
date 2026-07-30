import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { WalletService } from '../../../core/services/wallet.service';

type CardBrand = 'visa' | 'mastercard' | 'amex' | null;

@Component({
  selector: 'app-payment-add',
  imports: [TranslatePipe, AppIconComponent, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header
        backRoute="/app/account/payment-methods"
        [title]="'account.addCard.title' | translate"
        [backDesktop]="true"
      />

      <div class="payment-form">
        <div class="form-group">
          <label>{{ 'account.addCard.cardholder' | translate }}</label>
          <input
            class="form-input"
            [class.invalid]="submitted() && !cardholder().trim()"
            [value]="cardholder()"
            (input)="cardholder.set(valueOf($event))"
          />
          @if (submitted() && !cardholder().trim()) {
            <p class="form-error">{{ 'account.addCard.cardholderRequired' | translate }}</p>
          }
        </div>

        <div class="form-group">
          <label>{{ 'account.addCard.cardNumber' | translate }}</label>
          <div class="card-input-wrapper">
            <input
              #cardInput
              class="form-input card-number-input"
              inputmode="numeric"
              autocomplete="cc-number"
              (input)="onCardInput(cardInput)"
              maxlength="19"
              [class.invalid]="submitted() && rawCardNumber().length < 15"
            />
            @if (cardBrand(); as brand) {
              <span class="card-brand-icon">
                @if (brand === 'amex') {
                  <app-icon name="card" [size]="28" [stroke]="false" />
                } @else {
                  <img [src]="'/assets/payment/' + brand + '.svg'" [alt]="brand" />
                }
              </span>
            }
            @if (rawCardNumber().length >= 15) {
              <span class="valid-card" [attr.aria-label]="'account.addCard.validNumber' | translate">✓</span>
            }
          </div>
        </div>

        <div class="expiry-row">
          <div class="form-group">
            <label>{{ 'account.addCard.expiry' | translate }}</label>
            <select
              class="form-input"
              [class.invalid]="submitted() && !expiryMonth()"
              [value]="expiryMonth()"
              (change)="expiryMonth.set(valueOf($event))"
            >
              <option value="">{{ 'account.addCard.month' | translate }}</option>
              @for (m of months(); track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <select
              class="form-input"
              [class.invalid]="submitted() && !expiryYear()"
              [value]="expiryYear()"
              (change)="expiryYear.set(valueOf($event))"
              [attr.aria-label]="'account.addCard.year' | translate"
            >
              <option value="">{{ 'account.addCard.year' | translate }}</option>
              @for (y of years(); track y.value) {
                <option [value]="y.value">{{ y.label }}</option>
              }
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>{{ 'account.addCard.cvc' | translate }}</label>
          <input
            class="form-input"
            inputmode="numeric"
            autocomplete="cc-csc"
            [class.invalid]="submitted() && cvc().length < 3"
            [value]="cvc()"
            (input)="cvc.set(digitsOf($event, 4))"
            maxlength="4"
          />
          @if (submitted() && cvc().length < 3) {
            <p class="form-error">{{ 'account.addCard.cvcInvalid' | translate }}</p>
          }
        </div>

        <div class="form-group">
          <label>{{ 'account.addCard.alias' | translate }}</label>
          <input class="form-input" [value]="alias()" (input)="alias.set(valueOf($event))" />
        </div>

        @if (submitted() && !valid()) {
          <p class="form-error form-summary">{{ 'account.addCard.requiredFields' | translate }}</p>
        }
        <button type="button" class="btn btn-primary btn-block" (click)="save()">
          {{ 'account.addCard.button' | translate }}
        </button>
      </div>

      <div class="secure-checkout">
        <div class="secure-brand-row">
          <span class="secure-shield" aria-hidden="true">✓</span>
          <div class="checkout-brand">
            <span>{{ 'account.addCard.secureCheckout' | translate }}</span>
            <strong>{{ 'account.addCard.paycomet' | translate }}</strong>
          </div>
          <span class="bank-name">{{ 'account.addCard.byBank' | translate }}</span>
        </div>
        <div class="accepted-cards" [attr.aria-label]="'account.addCard.acceptedCards' | translate">
          <img src="/assets/payment/visa.svg" alt="Visa" />
          <img src="/assets/payment/mastercard.svg" alt="Mastercard" />
          <span>AMEX</span><span>DINERS</span><span>JCB</span><span>UnionPay</span>
        </div>
        <p class="merchant-details">
          GERTEK SDAD. DE GESTIONES Y SERVICIOS, S.A.<br />Dirección: Gregorio De La Revilla 27, 2º<br />48010 - Bilbao (España)<br />Teléfono:
          944399809<br />Email: soporte&#64;arinpark.eus<br />CIF: A95158895
        </p>
      </div>

      @if (saved()) {
        <app-result-modal
          type="success"
          [title]="'account.addCard.successTitle' | translate"
          [message]="'account.addCard.successDetail' | translate"
          [primaryText]="'account.addCard.backToPaymentMethods' | translate"
          (primaryAction)="goBack()"
        />
      }
    </div>
  `,
  styles: [
    `
      .payment-form {
        margin-top: 1rem;
      }
      .form-group {
        position: relative;
        margin-bottom: 0.9rem;
      }
      .form-group label {
        position: absolute;
        z-index: 2;
        top: -0.58rem;
        left: 1rem;
        padding: 0 0.35rem;
        background: var(--color-background);
        color: var(--color-primary);
        font-size: var(--text-xs);
        line-height: 1.1;
      }
      .form-input {
        width: 100%;
        min-height: 46px;
        border: 1.5px solid var(--color-primary);
        border-radius: 5px;
        background: var(--color-surface);
        font-size: var(--text-base);
      }
      .form-input.invalid {
        border-color: var(--color-error);
      }
      .form-error {
        margin-top: 0.3rem;
        color: var(--color-error);
        font-size: var(--text-xs);
      }
      .form-summary {
        margin-bottom: 0.65rem;
        text-align: center;
      }
      select.form-input {
        color: var(--color-text-muted);
      }
      .card-input-wrapper {
        position: relative;
      }
      .card-number-input {
        padding: 0 3.2rem 0 5.3rem;
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
      }
      .card-brand-icon {
        position: absolute;
        left: 0.8rem;
        top: 50%;
        translate: 0 -50%;
        display: flex;
        align-items: center;
        height: 28px;
        color: var(--color-primary);
      }
      .card-brand-icon img {
        display: block;
        width: 58px;
        height: 25px;
        object-fit: contain;
      }
      .valid-card {
        position: absolute;
        right: 1rem;
        top: 50%;
        translate: 0 -50%;
        color: #14ae35;
        font-size: 2rem;
        font-weight: 700;
      }
      .expiry-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
      }
      .expiry-row .form-group:first-child .form-input {
        border-radius: 5px 0 0 5px;
      }
      .expiry-row .form-group:last-child .form-input {
        border-left: 0;
        border-radius: 0 5px 5px 0;
      }
      .btn {
        min-height: 40px;
        border-radius: 999px;
        padding-block: 0.45rem;
        font-size: var(--text-sm);
      }
      .secure-checkout {
        margin: 2.5rem auto 0;
        text-align: center;
        color: var(--color-text-muted);
      }
      .secure-brand-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
      }
      .secure-shield {
        display: grid;
        place-items: center;
        width: 48px;
        height: 56px;
        color: #fff;
        background: #1474e6;
        font-size: 1.65rem;
        font-weight: 800;
        clip-path: polygon(50% 0, 100% 18%, 88% 75%, 50% 100%, 12% 75%, 0 18%);
      }
      .checkout-brand {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        line-height: 1.05;
      }
      .checkout-brand span {
        font-size: var(--text-sm);
        font-weight: 300;
      }
      .checkout-brand strong {
        color: var(--color-text);
        font-size: 1.3rem;
        letter-spacing: 0.08em;
        font-weight: 500;
      }
      .bank-name {
        padding-left: 0.8rem;
        border-left: 1px solid var(--color-text);
        color: var(--color-text);
        font-size: var(--text-xs);
      }
      .accepted-cards {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        margin: 0.7rem 0;
      }
      .accepted-cards img {
        width: 34px;
        height: 22px;
        object-fit: contain;
      }
      .accepted-cards span {
        color: #2772af;
        font-size: 0.55rem;
        font-weight: 800;
      }
      .merchant-details {
        margin: 1.4rem auto 0;
        color: #b8b8b4;
        font-size: var(--text-2xs);
        line-height: 1.5;
      }
      @media (max-width: 520px) {
        .account-static-page {
          padding-inline: 1rem;
        }
        .payment-form {
          margin-top: 1.25rem;
        }
        .form-input {
          min-height: 48px;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .secure-checkout {
          margin-top: 2rem;
        }
        .checkout-brand strong {
          font-size: 1.2rem;
        }
      }
    `,
  ],
})
export class PaymentAddComponent {
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);
  readonly rawCardNumber = signal('');
  readonly cardholder = signal('');
  readonly expiryMonth = signal('');
  readonly expiryYear = signal('');
  readonly cvc = signal('');
  readonly alias = signal('');
  readonly submitted = signal(false);
  readonly saved = signal(false);
  readonly valid = computed(
    () =>
      !!this.cardholder().trim() &&
      this.rawCardNumber().length >= 15 &&
      !!this.expiryMonth() &&
      !!this.expiryYear() &&
      this.cvc().length >= 3,
  );
  readonly cardBrand = computed<CardBrand>(() => {
    const digits = this.rawCardNumber();
    if (/^4/.test(digits)) return 'visa';
    if (/^5[1-5]/.test(digits) || /^2(?:2[2-9]\d|2[3-9]\d|[3-6]\d{2}|7[0-1]\d|720)\d/.test(digits)) return 'mastercard';
    if (/^3[47]/.test(digits)) return 'amex';
    return null;
  });
  readonly formattedCardNumber = computed(() =>
    this.rawCardNumber()
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim(),
  );
  readonly months = computed(() =>
    Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1).padStart(2, '0'), label: String(index + 1).padStart(2, '0') })),
  );
  readonly years = computed(() =>
    Array.from({ length: 11 }, (_, index) => ({
      value: String(new Date().getFullYear() + index),
      label: String(new Date().getFullYear() + index),
    })),
  );

  onCardInput(input: HTMLInputElement): void {
    const cursor = input.selectionStart ?? 0;
    const digitsBefore = input.value.substring(0, cursor).replace(/\D/g, '').length;
    this.rawCardNumber.set(input.value.replace(/\D/g, ''));
    const formatted = this.formattedCardNumber();
    let newPosition = 0;
    for (let digit = 0; digit < digitsBefore && newPosition < formatted.length; newPosition++) if (formatted[newPosition] !== ' ') digit++;
    input.value = formatted;
    input.setSelectionRange(newPosition, newPosition);
  }

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
  digitsOf(event: Event, maxLength: number): string {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(0, maxLength);
    input.value = value;
    return value;
  }
  save(): void {
    this.submitted.set(true);
    if (!this.valid()) return;
    const brand = this.cardBrand() === 'mastercard' ? 'Mastercard' : this.cardBrand() === 'amex' ? 'Amex' : 'Visa';
    this.walletService.addCard({
      brand,
      last4: this.rawCardNumber().slice(-4),
      expiryDate: `${this.expiryMonth()}/${this.expiryYear().slice(-2)}`,
      cardholderName: this.cardholder().trim(),
    });
    this.saved.set(true);
  }
  goBack(): void {
    void this.router.navigate(['/app/account/payment-methods']);
  }
}
