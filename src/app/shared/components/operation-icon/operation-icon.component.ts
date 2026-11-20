import { AppIconComponent } from '../../icons/app-icon.component';
import { Component, input } from '@angular/core';
import { OperationType } from '../../models/operation-type';

@Component({
  selector: 'app-operation-icon',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <span class="operation-icon" [attr.data-type]="type()" aria-hidden="true">
      @switch (type()) {
        @case (types.PARKING) {
          <app-icon name="parking" [stroke]="false" />
        }
        @case (types.PARKING_EXTENSION) {
          <app-icon name="extend" [stroke]="false" />
        }
        @case (types.REFUND) {
          <app-icon name="operationUnpark" [stroke]="false" />
        }
        @case (types.FINE_PAYMENT) {
          <app-icon name="fine" [stroke]="false" />
        }
        @case (types.UNPAID_FINES) {
          <app-icon name="fine" [stroke]="false" />
        }
        @case (types.TOP_UP) {
          <app-icon name="topUp" [stroke]="false" />
        }
        @case (types.BALANCE_REFUND) {
          <app-icon name="refundAmount" [stroke]="false" />
        }
        @default {
          <app-icon name="fine" [stroke]="false" />
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
