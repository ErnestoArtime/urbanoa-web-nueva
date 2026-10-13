import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { OperationType } from '../../../shared/models/operation-type';
import { formatFineDate } from '../../../shared/utils/fine-date';

@Component({
  selector: 'app-unpaid-fines',
  imports: [RouterLink, TranslatePipe, OperationIconComponent, AppIconComponent],
  template: `
    <div class="page">
      <h1 class="page-title">{{ 'ops.unpaidFines.title' | translate: { count: fines().length } }}</h1>
      @if (fines().length > 0) {
        <ul class="fine-list">
          @for (fine of fines(); track fine.id) {
            <li>
              <a [routerLink]="['/app/operations/unpaid-fine-detail', fine.id]" class="fine-list-card">
                <div class="fine-list-header">
                  <div class="fine-list-heading">
                    <app-operation-icon [type]="operationType.UNPAID_FINES" />
                    <div>
                      <strong>{{ 'ops.fineDetail.sanction' | translate }}</strong>
                      <span>{{ 'ops.fineDetail.plate' | translate }}: {{ fine.plate }}</span>
                    </div>
                  </div>
                  <strong class="fine-list-amount">{{ fine.amount }}</strong>
                </div>
                <div class="fine-list-location">
                  <app-icon name="location" [size]="24" [stroke]="false" />
                  <span
                    >{{ fine.zoneName || ('ops.fineDetail.location' | translate) }}<small>{{ fine.location }}</small></span
                  >
                </div>
                <div class="fine-list-date">
                  <app-icon name="dateRange" [size]="24" [stroke]="false" />
                  <span>{{ displayDate(fine.date) }}</span>
                </div>
              </a>
            </li>
          }
        </ul>
      } @else {
        <div class="card empty-fines">
          <p>{{ 'ops.unpaidFines.allPaid' | translate }}</p>
          <p class="text-muted">{{ 'ops.unpaidFines.nonePending' | translate }}</p>
        </div>
      }
    </div>
  `,
  styleUrl: './unpaid-fines.component.css',
})
export class UnpaidFinesComponent {
  private readonly unpaidFinesService = inject(UnpaidFinesService);
  readonly fines = this.unpaidFinesService.fines;
  readonly operationType = OperationType;
  readonly displayDate = formatFineDate;
}
