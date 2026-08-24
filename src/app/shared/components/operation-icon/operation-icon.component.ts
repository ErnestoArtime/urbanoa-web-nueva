import { Component, input } from '@angular/core';
import {
  LucideBanknoteArrowDown,
  LucideBanknoteArrowUp,
  LucideCircleStop,
  LucideClockPlus,
  LucideReceiptText,
  LucideSquareParking,
} from '@lucide/angular';
import { OperationType } from '../../models/operation-type';

@Component({
  selector: 'app-operation-icon',
  standalone: true,
  imports: [LucideSquareParking, LucideClockPlus, LucideBanknoteArrowDown, LucideReceiptText, LucideBanknoteArrowUp, LucideCircleStop],
  template: `
    <span class="operation-icon" [attr.data-type]="type()" aria-hidden="true">
      @switch (type()) {
        @case (types.PARKING) {
          <svg lucideSquareParking></svg>
        }
        @case (types.PARKING_EXTENSION) {
          <svg lucideClockPlus></svg>
        }
        @case (types.REFUND) {
          <svg lucideCircleStop></svg>
        }
        @case (types.FINE_PAYMENT) {
          <svg lucideReceiptText></svg>
        }
        @case (types.TOP_UP) {
          <svg lucideBanknoteArrowUp></svg>
        }
        @case (types.BALANCE_REFUND) {
          <svg lucideBanknoteArrowDown></svg>
        }
        @default {
          <svg lucideReceiptText></svg>
        }
      }
    </span>
  `,
  styles: [
    `
      .operation-icon {
        display: grid;
        place-items: center;
        flex: 0 0 36px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #d8f1f2;
        color: var(--color-primary);
      }
      svg {
        width: 21px;
        height: 21px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .operation-icon[data-type='2'] {
        background: #dff2ef;
        color: #2b7675;
      }
      .operation-icon[data-type='3'],
      .operation-icon[data-type='8'] {
        background: #e4f3e9;
        color: var(--color-success);
      }
      .operation-icon[data-type='4'] {
        background: var(--color-error-bg);
        color: var(--color-error);
      }
      .operation-icon[data-type='5'] {
        background: #e7f6ea;
        color: var(--color-success);
      }
    `,
  ],
})
export class OperationIconComponent {
  readonly type = input.required<OperationType>();
  readonly types = OperationType;
}
