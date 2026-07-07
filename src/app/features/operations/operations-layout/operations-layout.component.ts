import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DateRangeFilterComponent, type DateRange } from '../../../shared/components/date-range-filter/date-range-filter.component';
import { OperationType, OPERATION_TYPE_LABELS } from '../../../shared/models/operation-type';
import { UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { OperationsService, type ActiveOperation } from '../../../core/services/operations.service';
import { NavigationToCarService } from '../../../core/services/navigation-to-car.service';
import type { Operation } from '../../../shared/models/operation';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';

@Component({
  selector: 'app-operations-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    DecimalPipe,
    DateRangeFilterComponent,
    OperationIconComponent,
    SplitViewComponent,
    AppIconComponent,
  ],
  template: `
    <app-split-view [hideList]="isDetailRoute()" [hideDetail]="!isDetailRoute()">
      <div splitList class="page" style="padding-bottom:0">
        <h1 class="page-title">{{ 'ops.title' | translate }}</h1>

        <section class="current-section">
          <p class="section-label">{{ 'ops.inProgress' | translate }}</p>
          @if (activeTicket(); as active) {
            <article class="active-operation">
              <div class="active-operation-head">
                <app-icon name="vehicle" class="car-icon" [stroke]="false" />
                <div>
                  <strong>{{ active.plate }}</strong
                  ><small>{{ active.zone }}</small>
                </div>
                <span class="running-badge">{{ active.timeRemaining }}</span>
              </div>
              <div class="active-times">
                <span>{{ 'ops.endsAt' | translate }}</span
                ><strong>{{ active.endTime }}</strong>
              </div>
              <div class="go-to-car-row">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  [disabled]="!hasCoordinates(active)"
                  (click)="onGoToCar(active)"
                >
                  <app-icon name="goToCar" class="action-btn-icon" [stroke]="false" />
                  {{ 'dashboard.howToGetThere' | translate }}
                </button>
              </div>
              <div class="active-actions">
                <button type="button" class="btn btn-danger btn-sm" (click)="onUnpark()">{{ 'dashboard.unpark' | translate }}</button>
                <a routerLink="/app/parking/time-steps" class="btn btn-primary btn-sm">{{ 'dashboard.extendTime' | translate }}</a>
              </div>
            </article>
          } @else {
            <article class="active-operation empty-active-operation">
              <p>{{ 'ops.noActive' | translate }}</p>
            </article>
          }
        </section>

        <section class="actions-section">
          <a
            routerLink="/app/operations/unpaid-fines"
            [class.active]="isUnpaidFinesRoute()"
            [attr.aria-current]="isUnpaidFinesRoute() ? 'page' : null"
            class="list-item action-item"
          >
            <div class="list-item-content">
              <div class="list-item-title">
                {{ 'ops.unpaidFines.title' | translate: { count: '' + unpaidFinesCount() } }}
              </div>
            </div>
            <span class="list-item-chevron">›</span>
          </a>
          <a
            routerLink="/app/operations/report"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: false }"
            ariaCurrentWhenActive="page"
            class="list-item action-item"
          >
            <div class="list-item-content">
              <div class="list-item-title">{{ 'ops.report' | translate }}</div>
            </div>
            <span class="list-item-chevron">›</span>
          </a>
        </section>

        <section class="history-filter-panel">
          <p class="section-label history-label">Historial</p>
          <app-date-range-filter (rangeChange)="onRangeChange($event)" />
        </section>

        <ul class="list history-list">
          @for (group of groupedHistory(); track group.label) {
            <li class="history-group-label">{{ group.label }}</li>
            @for (op of group.items; track op.id) {
              <a [routerLink]="['/app/operations/detail', op.id]" class="list-item" routerLinkActive="active">
                <app-operation-icon [type]="op.type" />
                <div class="list-item-content">
                  @if (isFinishParking(op)) {
                    <div class="list-item-title finish-op-title">{{ 'ops.detail.parkingEnd' | translate }}</div>
                  } @else {
                    <div class="list-item-title">
                      {{ OPERATION_TYPE_LABELS[op.type] | translate }}
                    </div>
                  }
                  <div class="list-item-subtitle">{{ op.date }}{{ op.zone ? ' — ' + op.zone : '' }}</div>
                </div>
                <span [class]="op.amount > 0 ? 'badge badge-success' : ''">
                  {{ op.amount > 0 ? '+' : '' }}{{ op.amount | number: '1.2-2' }} €
                </span>
              </a>
            }
          }
          @if (groupedHistory().length === 0) {
            <li class="list-item" style="justify-content:center;color:var(--color-muted)">
              {{ 'ops.empty' | translate }}
            </li>
          }
        </ul>
      </div>
    </app-split-view>
  `,
  styles: [
    `
      .list-item.active {
        background: rgba(93, 154, 150, 0.16);
        color: var(--color-primary-dark);
        box-shadow: inset 4px 0 0 var(--color-primary);
      }
      .op-icon {
        font-size: var(--text-base);
        margin-right: 0.25rem;
      }
      .section-label {
        margin: 0.85rem 0 0.4rem;
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .history-filter-panel {
        margin: 1rem 0 0.7rem;
        padding: 0.8rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-background);
      }
      .history-label {
        margin: 0 0 0.25rem;
      }
      .history-list {
        margin: 0;
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      .history-group-label {
        list-style: none;
        padding: 0.65rem 0.8rem 0.4rem;
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: var(--color-background);
      }
      .finish-op-title {
        color: var(--color-primary-dark);
        font-weight: var(--font-bold);
      }
      .active-operation {
        overflow: hidden;
        border: 1px solid var(--color-primary-light);
        border-top: 5px solid var(--color-primary);
        border-radius: var(--radius-md);
        background: var(--color-surface);
        box-shadow: var(--shadow-sm);
      }
      .empty-active-operation {
        border-top-width: 1px;
        padding: 0.8rem;
        color: var(--color-text-muted);
      }
      .active-operation-head {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.65rem;
        padding: 0.75rem;
      }
      .active-operation-head div {
        display: flex;
        flex-direction: column;
      }
      .active-operation-head small {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .car-icon {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--color-accent-soft);
        color: var(--color-primary);
      }
      .running-badge {
        padding: 0.28rem 0.5rem;
        border-radius: 999px;
        background: var(--color-active);
        color: var(--color-primary-dark);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
      }
      .active-times {
        display: flex;
        justify-content: space-between;
        padding: 0.55rem 0.75rem;
        border-top: 1px dashed var(--color-border);
        font-size: var(--text-sm);
      }
      .go-to-car-row {
        padding: 0.55rem 0.75rem;
        border-top: 1px dashed var(--color-border);
      }
      .go-to-car-row .btn {
        width: 100%;
        border-radius: 999px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        color: var(--color-text);
      }
      .active-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        padding: 0.65rem 0.75rem;
        background: rgba(93, 154, 150, 0.07);
      }
      .actions-section {
        margin-top: 1rem;
        padding: 0.75rem 1.25rem;
        background: var(--color-surface);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border);
      }
      .action-item {
        background: transparent;
        border-radius: var(--radius-sm);
        margin: 0 -0.75rem;
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--color-border);
      }
      .action-item:last-child {
        border-bottom: none;
      }
      .action-item:hover {
        background: var(--color-background);
      }
      .action-item.active {
        position: relative;
        background: var(--color-active);
        color: var(--color-primary-dark);
        box-shadow: inset 4px 0 0 var(--color-primary);
      }
      .action-item.active .list-item-title {
        font-weight: var(--font-extra);
      }
      .action-item.active .list-item-chevron {
        color: var(--color-primary);
        font-weight: var(--font-extra);
      }
      :host ::ng-deep .history-filter-panel .date-filter {
        padding: 0.35rem 0 0;
      }
      :host ::ng-deep .history-filter-panel .date-filter-chips {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.4rem;
        margin-bottom: 0.65rem;
      }
      :host ::ng-deep .history-filter-panel .chip {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        padding: 0.35rem 0.4rem;
        white-space: nowrap;
      }
      :host ::ng-deep .history-filter-panel .date-filter-cal-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.55rem;
      }
      :host ::ng-deep .history-filter-panel .date-filter-toggle {
        width: 100%;
        justify-content: center;
        min-height: 38px;
      }
      :host ::ng-deep .history-filter-panel .date-filter-inputs {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 0.55rem;
        width: 100%;
      }
      :host ::ng-deep .history-filter-panel .date-picker-field {
        min-width: 0;
      }
      :host ::ng-deep .history-filter-panel .date-display {
        min-width: 0;
        width: 100%;
      }
      :host ::ng-deep .history-filter-panel .date-filter-clear {
        grid-column: 1/-1;
        justify-self: end;
      }
    `,
  ],
})
export class OperationsLayoutComponent {
  private readonly router = inject(Router);
  private readonly operationsService = inject(OperationsService);
  private readonly navigationToCar = inject(NavigationToCarService);
  private readonly operations = this.operationsService.operations;
  private readonly rangeFilter = signal<DateRange>({ from: '', to: '' });
  private readonly unpaidFinesService = inject(UnpaidFinesService);
  readonly unpaidFinesCount = () => this.unpaidFinesService.fines().length;
  readonly OperationType = OperationType;
  readonly OPERATION_TYPE_LABELS = OPERATION_TYPE_LABELS;
  readonly activeTicket = this.operationsService.activeOperation;
  readonly filteredOps = computed(() => this.applyFilter(this.operations()));
  readonly groupedHistory = computed(() => this.groupByPeriod(this.filteredOps()));

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  isDetailRoute = () => {
    const path = this.url().split('?')[0].replace(/\/$/, '');
    return path !== '/app/operations';
  };

  isUnpaidFinesRoute = () => {
    const path = this.url().split('?')[0];
    return path.startsWith('/app/operations/unpaid-fines') || path.startsWith('/app/operations/unpaid-fine-detail');
  };

  onRangeChange(range: DateRange): void {
    this.rangeFilter.set(range);
  }

  onUnpark(): void {
    this.operationsService.unparkActiveOperation();
  }

  onGoToCar(active: ActiveOperation): void {
    this.navigationToCar.open({
      latitude: active.latitude,
      longitude: active.longitude,
      label: active.plate,
    });
  }

  hasCoordinates(active: ActiveOperation): boolean {
    return Number.isFinite(active.latitude) && Number.isFinite(active.longitude);
  }

  isFinishParking(op: Operation): boolean {
    return op.type === OperationType.PARKING_END;
  }

  private applyFilter(list: Operation[]): Operation[] {
    const { from, to } = this.rangeFilter();
    const history = list.filter((op) => op.type !== OperationType.UNPAID_FINES);
    const sorted = [...history].sort((a, b) => this.toDateValue(b.date) - this.toDateValue(a.date));

    if (!from && !to) {
      return sorted;
    }

    return sorted.filter((op) => {
      const opDate = this.parseDate(op.date);
      if (from && opDate < this.parseDate(from)) return false;
      if (to && opDate > this.parseDate(to)) return false;
      return true;
    });
  }

  private groupByPeriod(list: Operation[]): { label: string; items: Operation[] }[] {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    const day = (startOfWeek.getDay() + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const groups: Record<string, Operation[]> = {
      Hoy: [],
      Ayer: [],
      'Esta semana': [],
      'Este mes': [],
      Anteriores: [],
    };

    for (const op of list) {
      const d = this.parseDate(op.date);
      if (d >= startOfToday) {
        groups['Hoy'].push(op);
      } else if (d >= startOfYesterday) {
        groups['Ayer'].push(op);
      } else if (d >= startOfWeek) {
        groups['Esta semana'].push(op);
      } else if (d >= startOfMonth) {
        groups['Este mes'].push(op);
      } else {
        groups['Anteriores'].push(op);
      }
    }

    return Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => ({ label, items }));
  }

  private toDateValue(d: string): number {
    return this.parseDate(d).getTime();
  }

  private parseDate(d: string): Date {
    if (d.includes('/')) {
      const [day, month, year] = d.split('/').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0, 0);
    }
    const [year, month, day] = d.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
}
