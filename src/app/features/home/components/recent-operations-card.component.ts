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
      <p class="card-title">Historial de operaciones</p>
      <ul class="list" style="margin-top:0.5rem;border-radius:var(--radius-sm);overflow:hidden">
        @for (op of operations(); track op.id) {
          <a [routerLink]="['/app/operations/detail', op.id]" class="list-item">
            <app-operation-icon [type]="op.type" />
            <div class="list-item-content">
              @if (isFinishParking(op)) {
                <div class="list-item-title">Fin de estacionamiento</div>
              } @else {
                <div class="list-item-title">{{ OPERATION_TYPE_LABELS[op.type] | translate }}</div>
              }
              <div class="list-item-subtitle">{{ op.date }}{{ op.zone ? ' — ' + op.zone : '' }}</div>
            </div>
            <span [class]="op.amount > 0 ? 'badge badge-success' : 'badge'">
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
        background: #fbfcf6;
        border-bottom-color: #e1e6d9;
      }
      .operation-history-card .list-item:hover {
        background: #f1f4ea;
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
    return op.type === OperationType.BALANCE_REFUND && !!op.plate;
  }
}
