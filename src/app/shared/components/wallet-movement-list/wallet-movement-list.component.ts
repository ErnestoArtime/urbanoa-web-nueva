import { Component, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import type { WalletMovement } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-wallet-movement-list',
  imports: [DatePipe, DecimalPipe, TranslatePipe],
  template: `
    <section class="card">
      <h2 class="section-title">{{ title() | translate }}</h2>
      @for (movement of movements().slice(0, limit()); track movement.id) {
        <div class="wallet-movement">
          <div class="movement-info">
            <strong>{{ movement.descriptionKey | translate: movement.descriptionParams }}</strong>
            <span>{{ movement.date | date: 'dd/MM/yyyy' : 'Europe/Madrid' }}</span>
          </div>
          <strong class="movement-amount" [class.positive]="movement.amount > 0">
            {{ movement.amount > 0 ? '+' : '' }}{{ movement.amount | number: '1.2-2' }} €
          </strong>
        </div>
      } @empty {
        <p class="empty">{{ 'wallet.movements.empty' | translate }}</p>
      }
    </section>
  `,
  styleUrl: './wallet-movement-list.component.css',
})
export class WalletMovementListComponent {
  readonly movements = input.required<WalletMovement[]>();
  readonly title = input('account.movements');
  readonly limit = input(5);
}
