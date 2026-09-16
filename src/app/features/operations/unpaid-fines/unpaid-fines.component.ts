import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { OperationType } from '../../../shared/models/operation-type';

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
                  <span>{{ fine.date }}</span>
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
  styles: [
    `
      .fine-list {
        width: 100%;
        display: grid;
        gap: 0.8rem;
        margin: 1rem 0 0;
        padding: 0;
        list-style: none;
      }
      .fine-list-card {
        display: block;
        padding: 1.25rem;
        border: 1px solid var(--color-border);
        border-radius: 14px;
        background: var(--color-surface);
        color: inherit;
        box-shadow: 0 2px 5px rgba(35, 44, 42, 0.14);
        text-decoration: none;
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }
      .fine-list-card:hover,
      .fine-list-card:focus-visible {
        border-color: var(--color-primary);
        box-shadow: 0 3px 10px rgba(35, 44, 42, 0.18);
      }
      .fine-list-header,
      .fine-list-heading,
      .fine-list-location,
      .fine-list-date {
        display: flex;
        align-items: center;
      }
      .fine-list-header {
        justify-content: space-between;
        gap: 1rem;
      }
      .fine-list-heading {
        min-width: 0;
        gap: 1rem;
      }
      .fine-list-heading > div,
      .fine-list-location > span {
        display: flex;
        min-width: 0;
        flex-direction: column;
      }
      .fine-list-heading strong {
        font-size: var(--text-lg);
        line-height: 1.4;
        font-weight: var(--font-bold);
      }
      .fine-list-heading span {
        font-size: var(--text-base);
        line-height: 1.5;
      }
      .fine-list-heading span,
      .fine-list-location,
      .fine-list-date {
        color: var(--color-text-muted);
      }
      .fine-list-amount {
        flex: 0 0 auto;
        color: var(--color-text);
        font-size: var(--text-lg);
      }
      .fine-list-location {
        gap: 1rem;
        margin-top: 1.5rem;
        color: var(--color-text);
      }
      .fine-list-location app-icon,
      .fine-list-date app-icon {
        display: grid;
        place-items: center;
        flex: 0 0 36px;
        color: var(--color-text-muted);
      }
      .fine-list-location span {
        font-size: var(--text-base);
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .fine-list-location small {
        margin-top: 0.15rem;
        color: var(--color-text-muted);
        font-size: var(--text-base);
      }
      .fine-list-date {
        gap: 1rem;
        margin-top: 1.5rem;
        color: var(--color-text);
        font-size: var(--text-base);
        line-height: 1.5;
      }
      @media (max-width: 480px) {
        .fine-list-card {
          padding: 1rem;
        }
        .fine-list-header {
          gap: 0.5rem;
        }
        .fine-list-heading {
          gap: 0.75rem;
        }
        .fine-list-location,
        .fine-list-date {
          gap: 0.75rem;
        }
      }
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
  readonly operationType = OperationType;
}
