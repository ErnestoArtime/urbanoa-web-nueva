import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-unpaid-fine-detail',
  imports: [RouterLink, DecimalPipe],
  template: `
    @if (!paid()) {
      <div class="page">
        <h1 class="page-title">Detalle de denuncia</h1>
        @if (fine) {
          <div class="card mt-2">
            <p><strong>Matrícula:</strong> {{ fine.plate }}</p>
            <p class="mt-1"><strong>Ubicación:</strong> {{ fine.location }}</p>
            <p class="mt-1"><strong>Fecha:</strong> {{ fine.date }}</p>
            <p class="mt-1"><strong>Importe:</strong> {{ fine.amount }}</p>
          </div>
          <div class="mt-2 card" style="padding:0.75rem">
            <p style="font-size:0.8rem;color:var(--color-muted)">Saldo disponible</p>
            <p style="font-size:1.25rem;font-weight:700">{{ walletService.balance() | number:'1.2-2' }} €</p>
          </div>
          @if (insufficientFunds()) {
            <p class="mt-1" style="color:var(--color-error);font-size:0.875rem">Saldo insuficiente para pagar esta denuncia.</p>
          }
          <button type="button" class="btn btn-primary btn-block mt-2" (click)="pay()" [disabled]="insufficientFunds()">
            Pagar {{ fine.amount }}
          </button>
        } @else {
          <p class="mt-2 text-muted">Denuncia no encontrada.</p>
          <a routerLink="/app/operations/unpaid-fines" class="btn btn-primary btn-block mt-2">Volver a denuncias</a>
        }
      </div>
    } @else {
      <div class="page text-center">
        <div class="success-icon">✓</div>
        <h1 class="page-title">Denuncia pagada</h1>
        <p class="page-subtitle">La denuncia de {{ fine?.plate }} en {{ fine?.location }} ha sido pagada.</p>
        <p class="mt-2" style="font-size:1.25rem;font-weight:700;color:var(--color-primary)">{{ walletService.balance() | number:'1.2-2' }} €</p>
        <a routerLink="/app/operations/unpaid-fines" class="btn btn-primary btn-block mt-2">Volver a denuncias</a>
      </div>
    }
  `,
})
export class UnpaidFineDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly unpaidFinesService = inject(UnpaidFinesService);
  readonly walletService = inject(WalletService);

  readonly fineId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly fine = this.unpaidFinesService.getFine(this.fineId);
  readonly paid = signal(false);

  readonly insufficientFunds = () => {
    if (!this.fine) return false;
    const amount = Number.parseFloat(this.fine.amount.replace(',', '.').replace(/[^0-9.,]/g, ''));
    return this.walletService.balance() < amount;
  };

  pay(): void {
    if (!this.fine) return;
    this.unpaidFinesService.payFine(this.fineId);
    this.paid.set(true);
  }
}
