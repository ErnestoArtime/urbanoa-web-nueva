import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_UNPAID_FINES } from '../../../shared/mock-data';

@Component({
  selector: 'app-unpaid-fines',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Multas impagadas</h1>
      <ul class="list card" style="padding:0;overflow:hidden">
        @for (fine of fines; track fine.id) {
          <a routerLink="/app/operations/unpaid-fine-detail" class="list-item">
            <div class="list-item-content">
              <div class="list-item-title">{{ fine.plate }} — {{ fine.location }}</div>
              <div class="list-item-subtitle">{{ fine.date }}</div>
            </div>
            <span class="badge badge-error">{{ fine.amount }}</span>
          </a>
        }
      </ul>
    </div>
  `,
})
export class UnpaidFinesComponent {
  readonly fines = MOCK_UNPAID_FINES;
}
