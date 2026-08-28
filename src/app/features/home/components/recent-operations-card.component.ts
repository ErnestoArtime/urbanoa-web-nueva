import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { OperationType, OPERATION_TYPE_LABELS } from '../../../shared/models/operation-type';
import type { Operation } from '../../../shared/models/operation';

@Component({
  selector: 'app-recent-operations-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslatePipe, OperationIconComponent],
  template: `
    <div class="card operation-history-card">
      <p class="card-title">{{ 'dashboard.recentOps' | translate }}</p>
      <ul class="list" style="margin-top:0.5rem;border-radius:var(--radius-sm);overflow:hidden">
        @for (op of operations(); track op.id) {
          <a [routerLink]="['/app/operations/detail', op.id]" class="list-item">
            <app-operation-icon [type]="op.type" />
            <div class="list-item-content">
              @if (isFinishParking(op)) {
                <div class="list-item-title">{{ 'ops.type.parkingEnd' | translate }}</div>
              } @else {
                <div class="list-item-title">{{ OPERATION_TYPE_LABELS[op.type] | translate }}</div>
              }
              <div class="list-item-subtitle">
                {{ op.date }}{{ operationTime(op) ? ' · ' + operationTime(op) : '' }}{{ op.zone ? ' — ' + op.zone : '' }}
              </div>
              @if (op.plate) {
                <div class="operation-meta">
                  {{ op.plate }}
                  @if (isParking(op) && op.durationLabel) {
                    <span> · {{ op.durationLabel }}</span>
                  }
                </div>
              }
            </div>
            <span [class]="op.amount > 0 ? 'operation-amount operation-amount-credit' : 'operation-amount operation-amount-debit'">
              {{ op.amount > 0 ? '+' : '' }}{{ op.amount | number: '1.2-2' }} €
            </span>
          </a>
        }
      </ul>
      <button type="button" class="btn-text view-all-link" (click)="viewAll.emit()">{{ 'dashboard.viewAll' | translate }}</button>
    </div>
  `,
  styles: [
    `
      .operation-history-card .list-item {
        display: flex;
        align-items: center;
        border-bottom-color: #e1e6d9;
      }
      .operation-history-card .list-item:hover {
        background: #f1f4ea;
      }
      .operation-history-card .operation-meta {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .operation-history-card .operation-amount {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 4.25rem;
        padding: 0.28rem 0.55rem;
        border-radius: var(--radius-pill);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        line-height: 1;
        white-space: nowrap;
      }
      .operation-history-card .operation-amount-credit {
        background: #e8f5e9;
        color: var(--color-success);
      }
      .operation-history-card .operation-amount-debit {
        background: var(--color-error-bg);
        color: var(--color-error);
      }
      .operation-history-card .card-title {
        margin-bottom: 0.35rem;
      }
      .view-all-link {
        display: block;
        margin-top: 1rem;
        text-align: right;
      }
    `,
  ],
})
export class RecentOperationsCardComponent {
  readonly operations = input.required<Operation[]>();
  readonly viewAll = output<void>();
  readonly OPERATION_TYPE_LABELS = OPERATION_TYPE_LABELS;

  isFinishParking(op: { type: OperationType; plate: string | null }): boolean {
    return op.type === OperationType.REFUND && !!op.plate;
  }

  isParking(op: Operation): boolean {
    return op.type === OperationType.PARKING || op.type === OperationType.PARKING_EXTENSION;
  }

  operationTime(op: Operation): string {
    return op.startTime ?? op.endTime ?? '';
  }
}
