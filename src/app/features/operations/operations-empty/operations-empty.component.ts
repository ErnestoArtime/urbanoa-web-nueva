import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-operations-empty',
  imports: [TranslatePipe],
  template: `
    <div class="empty-state">
      <p>{{ 'ops.empty' | translate }}</p>
    </div>
  `,
  styleUrl: './operations-empty.component.css',
})
export class OperationsEmptyComponent {}
