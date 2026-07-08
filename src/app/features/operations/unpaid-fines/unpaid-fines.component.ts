import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-unpaid-fines',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <h1 class="page-title">{{ 'ops.unpaidFines.title' | translate: { count: '' + fines().length } }}</h1>
      @if (fines().length > 0) {
        <ul class="list card" style="padding:0;overflow:hidden">
          @for (fine of fines(); track fine.id) {
            <a [routerLink]="['/app/operations/unpaid-fine-detail', fine.id]" class="list-item">
              <div class="list-item-content">
                <div class="list-item-title">{{ fine.plate }} — {{ fine.location }}</div>
                <div class="list-item-subtitle">{{ fine.date }}</div>
              </div>
              <span class="badge badge-error">{{ fine.amount }}</span>
            </a>
          }
        </ul>
      } @else {
        <div class="card empty-fines">
          <p>Todas las denuncias han sido pagadas.</p>
          <p class="text-muted">No tienes denuncias pendientes por pagar.</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .empty-fines {
        text-align: center;
        padding: 2rem 1rem;
      }
      .empty-fines p {
        margin: 0;
      }
      .empty-fines p:first-child {
        font-weight: var(--font-bold);
        margin-bottom: 0.3rem;
      }
    `,
  ],
})
export class UnpaidFinesComponent {
  private readonly unpaidFinesService = inject(UnpaidFinesService);
  readonly fines = this.unpaidFinesService.fines;
}
