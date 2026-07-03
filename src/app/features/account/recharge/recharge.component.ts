import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-account-recharge',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  template: `
    @if (!recharged()) {
      <div class="page">
        <h1 class="page-title">Recargar saldo</h1>
        <p class="page-subtitle">Saldo actual: {{ balance() | number:'1.2-2' }} €</p>

        <div class="chip-row">
          @for (a of amounts; track a) {
            <button type="button" class="chip" [class.active]="a === selected()" (click)="selected.set(a)">{{ a }} €</button>
          }
        </div>
        <div class="form-group mt-2">
          <label class="form-label">Otro importe</label>
          <input class="form-input" type="number" [(ngModel)]="customAmount" />
        </div>

        <p class="section-title mt-2">Tarjeta para recargar</p>
        <div class="card-option" [class.active]="true">
          <span class="card-brand-icon">
            <img [src]="cardBrandAsset()" [alt]="card.brand" />
          </span>
          <span class="card-option-info">
            <strong>{{ card.brand }} •••• {{ card.last4 }}</strong>
            <small>{{ card.cardholderName }} · Expira {{ card.expiryDate }}</small>
          </span>
        </div>

        <p class="text-muted mt-2">Saldo tras la recarga: {{ balance() + effectiveAmount() | number:'1.2-2' }} €</p>
        <button type="button" class="btn btn-primary btn-block mt-2" (click)="doRecharge()" [disabled]="effectiveAmount() <= 0">
          Recargar {{ effectiveAmount() | number:'1.2-2' }} €
        </button>
      </div>
    } @else {
      <div class="page text-center">
        <div class="success-icon">✓</div>
        <h1 class="page-title">Recarga realizada</h1>
        <p class="page-subtitle">Se han añadido {{ lastAmount | number:'1.2-2' }} € a tu monedero.</p>
        <p class="mt-2" style="font-size:1.5rem;font-weight:700;color:var(--color-primary)">{{ balance() | number:'1.2-2' }} €</p>
      </div>
    }
  `,
  styles: [
    `
    .card-option { display:flex; align-items:center; gap:.65rem; padding:.7rem .75rem; border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); }
    .card-option.active { border-color:var(--color-primary); background:var(--color-accent-soft); }
    .card-brand-icon { width:38px; height:28px; display:grid; place-items:center; flex-shrink:0; }
    .card-brand-icon img { display:block; max-width:38px; max-height:25px; }
    .card-option-info { display:flex; flex-direction:column; }
    .card-option-info strong { font-size:.9rem; }
    .card-option-info small { font-size:.75rem; color:var(--color-text-muted); }
    .section-title { font-size:.72rem; font-weight:700; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:.04em; margin-bottom:.3rem; }
  `,
  ],
})
export class AccountRechargeComponent {
  private readonly walletService = inject(WalletService);
  readonly balance = this.walletService.balance;
  readonly card = this.walletService.mainCard;
  readonly selected = signal(20);
  readonly customAmount = signal<number | null>(null);
  readonly amounts = [5, 10, 20, 50];
  lastAmount = 0;
  readonly recharged = signal(false);

  readonly effectiveAmount = () => this.customAmount() ?? this.selected();

  cardBrandAsset(): string {
    return this.card.brand.toLowerCase().includes('master') ? '/assets/payment/mastercard.svg' : '/assets/payment/visa.svg';
  }

  doRecharge(): void {
    const amount = this.effectiveAmount();
    if (amount <= 0) return;
    this.walletService.addBalance(amount);
    this.lastAmount = amount;
    this.recharged.set(true);
  }
}
