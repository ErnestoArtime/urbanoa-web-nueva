import { Component, computed, input } from '@angular/core';
import type { Wallet } from '../../mock-data';

export type PaymentMethod = 'balance' | 'card' | 'mixed';

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  template: `
    <div class="card payment-section">
      <p class="section-label">Método de pago</p>
      @if (method() === 'balance') {
        <div class="payment-summary">
          <div class="payment-summary-row">
            <span class="payment-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7.5h14a2 2 0 0 1 2 2v8H6a3 3 0 0 1-3-3v-9a2.5 2.5 0 0 1 2.5-2.5H17v4.5"/><path d="M15 12h5"/><circle cx="15" cy="12" r=".7"/></svg></span>
            <div class="payment-summary-info">
              <strong>Monedero</strong>
              <small>{{ wallet().balance.toFixed(2) }} € disponibles · Se usará todo</small>
            </div>
          </div>
        </div>
      } @else if (method() === 'card') {
        <div class="payment-summary">
          <div class="payment-summary-row">
            <span class="card-brand"><img [src]="cardBrandAsset()" [alt]="wallet().mainCard.brand" /></span>
            <div class="payment-summary-info">
              <strong>{{ wallet().mainCard.brand }} •••• {{ wallet().mainCard.last4 }}</strong>
              <small>Expira {{ wallet().mainCard.expiryDate }}</small>
            </div>
          </div>
        </div>
      } @else {
        <div class="payment-summary">
          <div class="payment-summary-row">
            <span class="payment-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="14" height="10" rx="2"/><path d="M7 9h6M8 19h11a2 2 0 0 0 2-2V9"/></svg></span>
            <div class="payment-summary-info">
              <strong>Combinado</strong>
              <small>Monedero + tarjeta</small>
            </div>
          </div>
          <div class="payment-breakdown">
            <span>Monedero <em>Se usará primero</em></span><strong>-{{ wallet().balance.toFixed(2) }} €</strong>
          </div>
          <div class="payment-breakdown">
            <span>{{ wallet().mainCard.brand }} •••• {{ wallet().mainCard.last4 }}</span><strong>-{{ remaining() }} €</strong>
          </div>
          <div class="payment-breakdown payment-breakdown-total">
            <span>Total</span><strong>{{ totalFormatted() }}</strong>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .payment-section{padding:.65rem;margin-top:.7rem}.section-label{font-size:var(--text-xs);font-weight:var(--font-bold);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em;margin:0 .35rem .3rem}.payment-summary{padding:.35rem .55rem}.payment-summary-row{display:flex;align-items:center;gap:.7rem}.payment-summary-info{flex:1;display:flex;flex-direction:column}.payment-summary-info small{color:var(--color-text-muted);font-size:var(--text-xs)}.payment-breakdown{display:flex;justify-content:space-between;align-items:center;padding:.4rem 0;border-bottom:1px solid var(--color-border);font-size:var(--text-sm);margin-left:2.8rem}.payment-breakdown em{color:var(--color-text-muted);font-style:normal;font-size:var(--text-2xs)}.payment-breakdown-total{border-bottom:none;padding-top:.5rem;font-weight:var(--font-bold)}.payment-breakdown-total span{color:var(--color-text-muted)}.payment-icon,.card-brand{width:38px;height:28px;display:grid;place-items:center;flex:none}.payment-icon svg{width:24px;height:24px;fill:none;stroke:var(--color-primary);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.card-brand img{display:block;max-width:38px;max-height:25px}
  `],
})
export class PaymentSummaryComponent {
  readonly wallet = input.required<Wallet>();
  readonly totalAmount = input.required<number>();

  readonly method = computed<PaymentMethod>(() => {
    const balance = this.wallet().balance;
    const total = this.totalAmount();
    if (total <= 0) return 'balance';
    if (balance <= 0) return 'card';
    if (balance >= total) return 'balance';
    return 'mixed';
  });

  readonly remaining = computed(() => {
    const total = this.totalAmount();
    const balance = this.wallet().balance;
    if (total <= balance) return '0,00';
    return (total - balance).toFixed(2).replace('.', ',');
  });

  readonly totalFormatted = computed(() => {
    return this.totalAmount().toFixed(2).replace('.', ',') + ' €';
  });

  cardBrandAsset(): string {
    return this.wallet().mainCard.brand.toLowerCase().includes('master') ? '/assets/payment/mastercard.svg' : '/assets/payment/visa.svg';
  }
}
