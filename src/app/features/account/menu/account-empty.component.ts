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
  styleUrl: './account-empty.component.css',
})
export class AccountEmptyComponent {}
