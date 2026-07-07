import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { WalletService } from '../../../core/services/wallet.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-unpaid-fine-detail',
  imports: [RouterLink, DecimalPipe, TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    @if (!paid()) {
      <div class="page">
        <app-detail-panel-header title="Detalle de denuncia" backRoute="/app/operations/unpaid-fines" />
        @if (fine) {
          <div class="card mt-2">
            <p>
              <strong>{{ 'ops.fineDetail.plate' | translate }}</strong> {{ fine.plate }}
            </p>
            <p class="mt-1">
              <strong>{{ 'ops.fineDetail.location' | translate }}</strong> {{ fine.location }}
            </p>
            <p class="mt-1">
              <strong>{{ 'ops.fineDetail.date' | translate }}</strong> {{ fine.date }}
            </p>
            <p class="mt-1">
              <strong>{{ 'ops.fineDetail.amount' | translate }}</strong> {{ fine.amount }}
            </p>
          </div>
          <div class="mt-2 card" style="padding:0.75rem">
            <p style="font-size: var(--text-sm);color:var(--color-muted)">{{ 'ops.fineDetail.availableBalance' | translate }}</p>
            <p style="font-size: var(--text-xl);font-weight: var(--font-bold)">{{ walletService.balance() | number: '1.2-2' }} €</p>
          </div>
          @if (insufficientFunds()) {
            <p class="form-error">{{ 'ops.fineDetail.insufficientBalance' | translate }}</p>
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
      <app-result-modal
        type="success"
        title="Denuncia pagada"
        [message]="'La denuncia de ' + (fine?.plate ?? '') + ' en ' + (fine?.location ?? '') + ' ha sido pagada.'"
        primaryText="Volver a denuncias"
        (primaryAction)="onBackToFines()"
      />
    }
  `,
})
export class UnpaidFineDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
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
    const ok = this.unpaidFinesService.payFine(this.fineId);
    if (ok) this.paid.set(true);
  }

  onBackToFines(): void {
    void this.router.navigate(['/app/operations/unpaid-fines']);
  }
}
