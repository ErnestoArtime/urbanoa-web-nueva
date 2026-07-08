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
          <div class="fine-ticket-shell mt-2">
            <article class="fine-ticket-card">
              <div class="fine-ticket-accent"></div>
              <div class="fine-ticket-body">
                <p>
                  <strong>{{ 'ops.fineDetail.plate' | translate }}</strong> {{ fine.plate }}
                </p>
                <p class="mt-1">
                  <strong>{{ 'ops.fineDetail.location' | translate }}</strong> {{ fine.location }}
                </p>
                <p class="mt-1">
                  <strong>{{ 'ops.fineDetail.date' | translate }}</strong> {{ fine.date }}
                </p>
              </div>
              <div class="fine-ticket-cut"></div>
              <div class="fine-ticket-total">
                <strong>{{ 'ops.fineDetail.amount' | translate }}</strong>
                <span>{{ fine.amount }}</span>
              </div>
            </article>
          </div>
          <div class="mt-2 card" style="padding:0.75rem">
            <p style="font-size: var(--text-sm);color:var(--color-muted)">{{ 'ops.fineDetail.availableBalance' | translate }}</p>
            <p style="font-size: var(--text-xl);font-weight: var(--font-bold)">{{ walletService.balance() | number: '1.2-2' }} €</p>
          </div>
          @if (insufficientFunds()) {
            <fieldset class="payment-card-selector">
              <legend>Tarjeta para completar el pago</legend>
              @for (card of walletService.cards(); track card.id) {
                <label class="payment-card-option" [class.selected]="selectedCardId() === card.id"
                  ><input
                    type="radio"
                    name="fine-card"
                    [checked]="selectedCardId() === card.id"
                    (change)="selectedCardId.set(card.id)"
                  /><span
                    ><strong>{{ card.brand }} •••• {{ card.last4 }}</strong
                    ><small>Caduca {{ card.expiryDate }}</small></span
                  ></label
                >
              }
            </fieldset>
          }
          <button
            type="button"
            class="btn btn-primary btn-block mt-2"
            (click)="pay()"
            [disabled]="insufficientFunds() && !selectedCardId()"
          >
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
  styles: [
    `
      .fine-ticket-shell {
        border-radius: 16px;
        filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.14));
      }
      .fine-ticket-card {
        --ticket-notch-r: 10px;
        --ticket-cut-y: 116px;
        position: relative;
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: 16px;
        background: var(--color-surface);
        box-shadow: none;
        -webkit-mask:
          radial-gradient(circle at 0 var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px)) left
            top / 51% 100% no-repeat,
          radial-gradient(circle at 100% var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px))
            right top / 51% 100% no-repeat;
        mask:
          radial-gradient(circle at 0 var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px)) left
            top / 51% 100% no-repeat,
          radial-gradient(circle at 100% var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px))
            right top / 51% 100% no-repeat;
      }
      .fine-ticket-accent {
        height: 10px;
        border-radius: 16px 16px 0 0;
        background: linear-gradient(90deg, #8f84f3 0%, #7971de 48%, #7469d2 100%);
      }
      .fine-ticket-body {
        padding: 1rem 1.2rem 0.6rem;
      }
      .fine-ticket-body p {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        color: var(--color-text-muted);
      }
      .fine-ticket-body strong {
        color: var(--color-text);
      }
      .fine-ticket-cut {
        position: relative;
        height: 20px;
        display: flex;
        align-items: center;
        margin: 0 calc(var(--ticket-notch-r) + 5px);
        background-image: linear-gradient(to right, rgba(149, 156, 146, 0.62) 50%, transparent 0);
        background-position: center;
        background-repeat: repeat-x;
        background-size: 8px 3px;
      }
      .fine-ticket-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1.2rem 1rem;
      }
      .fine-ticket-total span {
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
      }
    `,
  ],
})
export class UnpaidFineDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly unpaidFinesService = inject(UnpaidFinesService);
  readonly walletService = inject(WalletService);

  readonly fineId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly fine = this.unpaidFinesService.getFine(this.fineId);
  readonly paid = signal(false);
  readonly selectedCardId = signal(this.walletService.defaultCardId());

  readonly insufficientFunds = () => {
    if (!this.fine) return false;
    const amount = Number.parseFloat(this.fine.amount.replace(',', '.').replace(/[^0-9.,]/g, ''));
    return this.walletService.balance() < amount;
  };

  pay(): void {
    if (!this.fine) return;
    const ok = this.unpaidFinesService.payFine(this.fineId, this.selectedCardId());
    if (ok) this.paid.set(true);
  }

  onBackToFines(): void {
    void this.router.navigate(['/app/operations/unpaid-fines']);
  }
}
