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
  styles: [`
    :host { display:flex; height:100%; width:100%; }
    .empty-state { flex:1; display:flex; align-items:center; justify-content:center; padding:2rem; color:var(--color-text-muted); text-align:center; }
  `],
})
export class OperationsEmptyComponent {}
