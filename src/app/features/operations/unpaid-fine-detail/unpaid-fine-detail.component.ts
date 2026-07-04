import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { WalletService } from '../../../core/services/wallet.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-unpaid-fine-detail',
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  template: `
    @if (!paid()) {
      <div class="page">
        <h1 class="page-title">{{ 'ops.fineDetail.title' | translate }}</h1>
        @if (fine) {
          <div class="card mt-2">
            <p><strong>{{ 'ops.fineDetail.plate' | translate }}</strong> {{ fine.plate }}</p>
            <p class="mt-1"><strong>{{ 'ops.fineDetail.location' | translate }}</strong> {{ fine.location }}</p>
            <p class="mt-1"><strong>{{ 'ops.fineDetail.date' | translate }}</strong> {{ fine.date }}</p>
            <p class="mt-1"><strong>{{ 'ops.fineDetail.amount' | translate }}</strong> {{ fine.amount }}</p>
          </div>
          <div class="mt-2 card" style="padding:0.75rem">
            <p style="font-size: var(--text-sm);color:var(--color-muted)">{{ 'ops.fineDetail.availableBalance' | translate }}</p>
            <p style="font-size: var(--text-xl);font-weight: var(--font-bold)">{{ walletService.balance() | number:'1.2-2' }} €</p>
          </div>
          @if (insufficientFunds()) {
            <p class="mt-1" style="color:var(--color-error);font-size:0.875rem">{{ 'ops.fineDetail.insufficientBalance' | translate }}</p>
          }
          <button type="button" class="btn btn-primary btn-block mt-2" (click)="pay()" [disabled]="insufficientFunds()">
            {{ 'ops.fineDetail.pay' | translate }} {{ fine.amount }}
          </button>
        } @else {
          <p class="mt-2 text-muted">{{ 'ops.unpaidFines.notFound' | translate }}</p>
          <a routerLink="/app/operations/unpaid-fines" class="btn btn-primary btn-block mt-2">{{ 'ops.unpaidFines.back' | translate }}</a>
        }
      </div>
    } @else {
      <div class="page text-center">
        <div class="success-icon">✓</div>
        <h1 class="page-title">{{ 'ops.fineDetail.paid' | translate }}</h1>
        <p class="page-subtitle">{{ 'ops.fineDetail.paidDetail' | translate:{plate: fine?.plate ?? '', location: fine?.location ?? ''} }}</p>
        <p class="mt-2" style="font-size: var(--text-xl);font-weight: var(--font-bold);color:var(--color-primary)">{{ walletService.balance() | number:'1.2-2' }} €</p>
        <a routerLink="/app/operations/unpaid-fines" class="btn btn-primary btn-block mt-2">{{ 'ops.unpaidFines.back' | translate }}</a>
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
