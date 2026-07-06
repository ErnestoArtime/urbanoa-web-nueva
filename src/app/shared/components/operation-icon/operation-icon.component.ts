import { Component, computed, input } from '@angular/core';
import { AppIconComponent } from '../../icons/app-icon.component';
import { OperationType } from '../../models/operation-type';

@Component({
  selector: 'app-operation-icon',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <span class="operation-icon" [attr.data-type]="type()" aria-hidden="true">
      <app-icon [name]="iconName()" [stroke]="false" />
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
        background: var(--color-accent-soft);
        color: var(--color-primary);
      }
      svg {
        width: 21px;
        height: 21px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .operation-icon[data-type='4'] {
        background: var(--color-error-bg);
        color: var(--color-error);
      }
      .operation-icon[data-type='5'],
      .operation-icon[data-type='8'],
      .operation-icon[data-type='3'] {
        background: #e4f3e9;
        color: var(--color-success);
      }
    `,
  ],
})
export class OperationIconComponent {
  readonly type = input.required<OperationType>();
  readonly types = OperationType;

  readonly iconName = computed(() => {
    const map: Record<number, string> = {
      [OperationType.PARKING]: 'operationParking',
      [OperationType.PARKING_EXTENSION]: 'operationExtension',
      [OperationType.REFUND]: 'operationRefund',
      [OperationType.FINE_PAYMENT]: 'operationFine',
      [OperationType.TOP_UP]: 'operationTopUp',
      [OperationType.BALANCE_REFUND]: 'operationBalanceRefund',
    };
    return map[this.type()] ?? 'operationDefault';
  });
}
