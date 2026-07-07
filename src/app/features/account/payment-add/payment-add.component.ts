import { Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { Router } from '@angular/router';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { WalletService } from '../../../core/services/wallet.service';

type CardBrand = 'visa' | 'mastercard' | 'amex' | null;

@Component({
  selector: 'app-payment-add',
  imports: [TranslatePipe, AppIconComponent, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header backRoute="/app/account/payment-methods" title="Añadir tarjeta" [backDesktop]="true" />
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.addCard.cardholder' | translate }}</label
          ><input class="form-input" [class.invalid]="submitted() && !cardholder().trim()" [value]="cardholder()"
            (input)="cardholder.set(valueOf($event))" [placeholder]="'account.addCard.cardholder' | translate" />
          @if (submitted() && !cardholder().trim()) { <p class="form-error">El titular es obligatorio.</p> }
        </div>
        <div class="form-group">
          <label>{{ 'account.addCard.cardNumber' | translate }}</label>
          <div class="card-input-wrapper">
            <input
              #cardInput
              class="form-input card-number-input"
              placeholder="1234 5678 9012 3456"
              (input)="onCardInput(cardInput)"
              maxlength="19"
              [class.invalid]="submitted() && rawCardNumber().length < 15"
            />
            @if (cardBrand(); as brand) {
              <span class="card-brand-icon">
                @if (brand === 'amex') {
                  <app-icon name="card" [size]="22" [stroke]="false" />
                } @else {
                  <img [src]="'/assets/payment/' + brand + '.svg'" [alt]="brand" />
                }
              </span>
            }
          </div>
        </div>
        <div class="expiry-row">
          <div class="form-group">
            <label>{{ 'account.addCard.expiry' | translate }}</label
            ><select class="form-input" [class.invalid]="submitted() && !expiryMonth()" [value]="expiryMonth()" (change)="expiryMonth.set(valueOf($event))">
              <option value="">{{ 'account.addCard.month' | translate }}</option>
              @for (m of months(); track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>&nbsp;</label
            ><select class="form-input" [class.invalid]="submitted() && !expiryYear()" [value]="expiryYear()" (change)="expiryYear.set(valueOf($event))">
              <option value="">{{ 'account.addCard.year' | translate }}</option>
              @for (y of years(); track y.value) {
                <option [value]="y.value">{{ y.label }}</option>
              }
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>{{ 'account.addCard.cvc' | translate }}</label
          ><input class="form-input" [class.invalid]="submitted() && cvc().length < 3" [value]="cvc()"
            (input)="cvc.set(digitsOf($event, 4))" [placeholder]="'account.addCard.cvc' | translate" maxlength="4" />
          @if (submitted() && cvc().length < 3) { <p class="form-error">Introduce un CVC válido.</p> }
        </div>
        <div class="form-group">
          <label>{{ 'account.addCard.alias' | translate }}</label
          ><input class="form-input" [value]="alias()" (input)="alias.set(valueOf($event))" [placeholder]="'account.addCard.alias' | translate" />
        </div>
        @if (submitted() && !valid()) {
          <p class="form-error form-summary">Revisa los campos obligatorios de la tarjeta.</p>
        }
        <button type="button" class="btn btn-primary btn-block" (click)="save()">{{ 'account.addCard.button' | translate }}</button>
      </div>
      @if (saved()) {
        <app-result-modal type="success" title="Tarjeta añadida" message="La tarjeta se ha guardado correctamente."
          primaryText="Volver a métodos de pago" (primaryAction)="goBack()" />
      }
      <div class="secure-badge">
        <app-icon name="lock" [size]="16" [stroke]="false" />
        <div>
          <span class="secure-title">{{ 'account.addCard.securePayment' | translate }}</span>
          <span class="secure-subtitle"
            >{{ 'account.addCard.secureCheckout' | translate }} {{ 'account.addCard.paycomet' | translate }}
            {{ 'account.addCard.byBank' | translate }}</span
          >
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .card-input-wrapper {
        position: relative;
      }
      .form-input.invalid{border-color:var(--color-error)}.form-error{margin-top:.3rem;color:var(--color-error);font-size:var(--text-xs)}
      .form-summary{margin-bottom:.65rem;text-align:center}
      .card-number-input {
        letter-spacing: 0.08em;
        font-variant-numeric: tabular-nums;
        padding-right: 2.5rem;
      }
      .card-brand-icon {
        position: absolute;
        right: 0.6rem;
        top: 50%;
        translate: 0 -50%;
        display: flex;
        align-items: center;
        height: 22px;
      }
      .card-brand-icon img {
        height: 18px;
        width: auto;
        display: block;
      }
      .expiry-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
      .secure-badge {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-top: 0.65rem;
        padding: 0.65rem 0.75rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-muted);
      }
      .secure-badge > div {
        display: flex;
        flex-wrap: wrap;
        column-gap: 0.25rem;
      }
      .secure-title {
        font-weight: var(--font-bold);
        font-size: var(--text-xs);
      }
      .secure-subtitle {
        font-size: var(--text-2xs);
        opacity: 0.75;
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
    const d = this.rawCardNumber();
    if (/^4/.test(d)) return 'visa';
    if (/^5[1-5]/.test(d) || /^2(?:2[2-9]\d|2[3-9]\d|[3-6]\d{2}|7[0-1]\d|720)\d/.test(d)) return 'mastercard';
    if (/^3[47]/.test(d)) return 'amex';
    return null;
  });

  readonly formattedCardNumber = computed(() => {
    const digits = this.rawCardNumber();
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  });

  readonly months = computed(() =>
    Array.from({ length: 12 }, (_, i) => {
      const n = i + 1;
      return { value: String(n).padStart(2, '0'), label: String(n).padStart(2, '0') };
    }),
  );
  readonly years = computed(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => {
      const y = current + i;
      return { value: String(y), label: String(y) };
    });
  });

  onCardInput(input: HTMLInputElement) {
    const cursor = input.selectionStart ?? 0;
    const raw = input.value.replace(/\D/g, '');
    const digitsBefore = input.value.substring(0, cursor).replace(/\D/g, '').length;
    this.rawCardNumber.set(raw);
    const formatted = this.formattedCardNumber();
    let newPos = 0;
    for (let d = 0; d < digitsBefore && newPos < formatted.length; newPos++) {
      if (formatted[newPos] !== ' ') d++;
    }
    input.value = formatted;
    input.setSelectionRange(newPos, newPos);
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
