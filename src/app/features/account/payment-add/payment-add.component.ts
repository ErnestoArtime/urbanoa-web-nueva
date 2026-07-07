import { Component, computed, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';

type CardBrand = 'visa' | 'mastercard' | 'amex' | null;

@Component({
  selector: 'app-payment-add',
  imports: [RouterLink, TranslatePipe, AppIconComponent, NgStyle, DetailPanelHeaderComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header backRoute="/app/account/payment-methods" title="Añadir tarjeta" [backDesktop]="true" />
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.addCard.cardholder' | translate }}</label
          ><input class="form-input" [placeholder]="'account.addCard.cardholder' | translate" />
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
            ><select class="form-input">
              <option value="">{{ 'account.addCard.month' | translate }}</option>
              @for (m of months(); track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>&nbsp;</label
            ><select class="form-input">
              <option value="">{{ 'account.addCard.year' | translate }}</option>
              @for (y of years(); track y.value) {
                <option [value]="y.value">{{ y.label }}</option>
              }
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>{{ 'account.addCard.cvc' | translate }}</label
          ><input class="form-input" [placeholder]="'account.addCard.cvc' | translate" maxlength="4" />
        </div>
        <div class="form-group">
          <label>{{ 'account.addCard.alias' | translate }}</label
          ><input class="form-input" [placeholder]="'account.addCard.alias' | translate" />
        </div>
        <button class="btn btn-primary btn-block">{{ 'account.addCard.button' | translate }}</button>
      </div>
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
  private readonly rawCardNumber = signal('');

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
}
