import { Component, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import type { WalletMovement } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-wallet-movement-list',
  imports: [DatePipe, DecimalPipe],
  template: `
    <section class="card">
      <h2 class="section-title">{{ title() }}</h2>
      @for (movement of movements().slice(0, limit()); track movement.id) {
        <div class="wallet-movement">
          <div class="movement-info">
            <strong>{{ movement.description }}</strong>
            <span>{{ movement.date | date: 'dd/MM/yyyy' }}</span>
          </div>
          <strong class="movement-amount" [class.positive]="movement.amount > 0">
            {{ movement.amount > 0 ? '+' : '' }}{{ movement.amount | number: '1.2-2' }} €
          </strong>
        </div>
      } @empty {
        <p class="empty">Todavía no hay movimientos en el monedero.</p>
      }
    </section>
  `,
  styles: `
    :host{display:block;margin-top:1.25rem}.section-title{margin:0 0 .35rem;font-size:var(--text-sm);font-weight:var(--font-extra)}
    .wallet-movement{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.65rem 0;border-bottom:1px solid var(--color-border)}
    .wallet-movement:last-child{border-bottom:0}.movement-info{display:flex;min-width:0;flex-direction:column;gap:2px}
    .movement-info strong{overflow:hidden;font-size:var(--text-sm);text-overflow:ellipsis;white-space:nowrap}
    .movement-info span,.empty{font-size:var(--text-xs);color:var(--color-text-muted)}
    .movement-amount{flex:none;font-size:var(--text-sm);color:var(--color-error)}.movement-amount.positive{color:var(--color-success)}
  `,
})
export class WalletMovementListComponent {
  readonly movements = input.required<WalletMovement[]>();
  readonly title = input('Últimos movimientos');
  readonly limit = input(5);
}
