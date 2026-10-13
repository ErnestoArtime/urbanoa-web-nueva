import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { OperationType, OPERATION_TYPE_LABELS } from '../../../shared/models/operation-type';
import type { Operation } from '../../../shared/models/operation';
import { isAcknowledgedFine } from '../../../core/services/unpaid-fines.service';

@Component({
  selector: 'app-recent-operations-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslatePipe, OperationIconComponent],
  template: `
    <div class="card operation-history-card">
      <p class="card-title">{{ 'dashboard.recentOps' | translate }}</p>
      <ul class="list recent-operations-list">
        @for (op of operations(); track op.id) {
          <a [routerLink]="['/app/operations/detail', op.id]" class="list-item" [class.historic-fine-item]="isHistoricFine(op)">
            <app-operation-icon [type]="op.type" />
            <div class="list-item-content">
              @if (isFinishParking(op)) {
                <div class="list-item-title">{{ 'ops.type.parkingEndRefund' | translate }}</div>
              } @else {
                <div class="list-item-title">
                  {{ isHistoricFine(op) ? ('ops.fineDetail.sanction' | translate) : (OPERATION_TYPE_LABELS[op.type] | translate) }}
                  @if (isHistoricFine(op)) {
                    <span class="historic-fine-badge">{{ 'ops.fineDetail.historic' | translate }}</span>
                  }
                  @if (op.timePeriod === 2) {
                    <span class="badge badge-warning">{{ 'ops.active' | translate }}</span>
                  }
                </div>
              }
              <div class="list-item-subtitle">
                {{ op.zone }}{{ op.cityName ? ' · ' + op.cityName : '' }}{{ op.ticketName ? ' · ' + op.ticketName : '' }}
                @if (isFreeParking(op)) {
                  <span> · {{ 'parking.tickets.free' | translate }}</span>
                }
              </div>
              @if (op.plate) {
                <div class="operation-meta">
                  {{ op.plate }}
                  @if (isParking(op) && op.durationLabel) {
                    <span> · {{ op.durationLabel }}</span>
                  }
                </div>
              }
              @if (op.type === OperationType.TOP_UP && op.cardLabel) {
                <div class="operation-meta">{{ op.cardLabel }}</div>
              }
            </div>
            <div class="operation-price-date">
              <span class="operation-date">{{ op.date }}</span>
              @if (operationTime(op)) {
                <span class="operation-time">{{ operationTime(op) }}</span>
              }
              <span [class]="op.amount > 0 ? 'operation-amount operation-amount-credit' : 'operation-amount operation-amount-debit'">
                {{ op.amount > 0 ? '+' : '' }}{{ op.amount | number: '1.2-2' }} €
              </span>
            </div>
          </a>
        }
      </ul>
      <button type="button" class="btn-text view-all-link" (click)="viewAll.emit()">{{ 'dashboard.viewAll' | translate }}</button>
    </div>
  `,
  styleUrl: './recent-operations-card.component.css',
})
export class RecentOperationsCardComponent {
  readonly operations = input.required<Operation[]>();
  readonly viewAll = output<void>();
  readonly OPERATION_TYPE_LABELS = OPERATION_TYPE_LABELS;
  readonly OperationType = OperationType;

  isFinishParking(op: { type: OperationType; plate: string | null }): boolean {
    return op.type === OperationType.REFUND && !!op.plate;
  }

  isParking(op: Operation): boolean {
    return op.type === OperationType.PARKING || op.type === OperationType.PARKING_EXTENSION;
  }

  isFreeParking(op: Operation): boolean {
    return this.isParking(op) && Math.abs(op.amount) < 0.005;
  }

  operationTime(op: Operation): string {
    return op.operationTime ?? op.startTime ?? op.endTime ?? '';
  }

  isHistoricFine(op: Operation): boolean {
    return isAcknowledgedFine(op);
  }
}
