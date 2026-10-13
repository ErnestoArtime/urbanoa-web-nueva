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
        @case (types.UNPAID_FINES) {
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
  styleUrl: './operation-icon.component.css',
})
export class OperationIconComponent {
  readonly type = input.required<OperationType>();
  readonly types = OperationType;
}
