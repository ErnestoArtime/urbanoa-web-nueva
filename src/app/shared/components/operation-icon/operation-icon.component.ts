import { Component, input } from '@angular/core';
import { OperationType } from '../../models/operation-type';

@Component({
  selector: 'app-operation-icon',
  standalone: true,
  template: `
    <span class="operation-icon" [attr.data-type]="type()" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        @switch (type()) {
          @case (types.PARKING) { <path d="M6 20V9l2-5h8l2 5v11M5 12h14M8 16h.01M16 16h.01M7 20v-2h10v2"/> }
          @case (types.PARKING_EXTENSION) { <path d="M5 20V9l2-5h7l2 5v3M4 12h13M7 16h.01M14 20a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-7v2l1.5 1"/> }
          @case (types.REFUND) { <path d="M9 7H5v-4M5 7a8 8 0 1 1-1 8M12 8v8M15 10.5c0-1.4-1.3-2.5-3-2.5s-3 1-3 2.3c0 3.5 6 1.4 6 4.2 0 1.4-1.3 2.5-3 2.5s-3-1.1-3-2.5"/> }
          @case (types.FINE_PAYMENT) { <path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V5a2 2 0 0 1 2-2Zm2 5h6M9 12h6M9 16h3"/> }
          @case (types.TOP_UP) { <path d="M4 7h16v12H4zM4 10h16M8 15h4M18 3v4M16 5h4"/> }
          @case (types.BALANCE_REFUND) { <path d="M9 7H5v-4M5 7a8 8 0 1 1-1 8M12 8v8M9 12h6"/> }
          @default { <path d="M12 3 3 7v6c0 4.5 3.8 7.5 9 8 5.2-.5 9-3.5 9-8V7l-9-4Zm0 5v5M12 17h.01"/> }
        }
      </svg>
    </span>
  `,
  styles: [`
    .operation-icon{display:grid;place-items:center;flex:0 0 36px;width:36px;height:36px;border-radius:50%;background:var(--color-accent-soft);color:var(--color-primary)}svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.operation-icon[data-type="4"]{background:var(--color-error-bg);color:var(--color-error)}.operation-icon[data-type="5"],.operation-icon[data-type="8"],.operation-icon[data-type="3"]{background:#e4f3e9;color:var(--color-success)}
  `],
})
export class OperationIconComponent {
  readonly type = input.required<OperationType>();
  readonly types = OperationType;
}
