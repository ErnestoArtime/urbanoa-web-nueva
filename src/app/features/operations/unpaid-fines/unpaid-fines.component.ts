import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';

@Component({
  selector: 'app-unpaid-fines',
  imports: [RouterLink, TranslatePipe, DetailPanelHeaderComponent],
  template: `
    <div class="page">
      <h1 class="page-title">{{ 'ops.unpaidFines.title' | translate }}</h1>
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
    </div>
  `,
})
export class UnpaidFinesComponent {
  private readonly unpaidFinesService = inject(UnpaidFinesService);
  readonly fines = this.unpaidFinesService.fines;
}
