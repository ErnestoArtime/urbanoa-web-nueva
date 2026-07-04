import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-empty',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="empty-state">
      <p>{{ 'account.selectOption' | translate }}</p>
    </div>
  `,
  styles: [`
    .empty-state {
      height: 100%;
      min-height: 380px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-muted);
      padding: 1.5rem;
      text-align: center;
    }
  `],
})
export class AccountEmptyComponent {}
