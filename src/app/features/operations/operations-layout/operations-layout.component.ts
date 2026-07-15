import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DateRangeFilterComponent, type DateRange } from '../../../shared/components/date-range-filter/date-range-filter.component';
import { OperationType, OPERATION_TYPE_LABELS } from '../../../shared/models/operation-type';
import { UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { OperationsService, type ActiveParking } from '../../../core/services/operations.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { NavigationToCarService } from '../../../core/services/navigation-to-car.service';
import type { Operation } from '../../../shared/models/operation';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { ParkingTicketCardComponent } from '../../../shared/components/parking-ticket-card/parking-ticket-card.component';

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
    ParkingTicketCardComponent,
    ResultModalComponent,
  ],
  template: `
    <app-split-view [hideList]="isDetailRoute()" [hideDetail]="!isDetailRoute()">
      <div splitList class="page">
        <h1 class="page-title">{{ 'ops.title' | translate }}</h1>

        <section class="current-section">
          <p class="section-label">
            {{ 'ops.inProgress' | translate }}
            @if (activeParkingsCount() > 1) {
              <span class="active-parkings-count">{{ activeParkingsCount() }}</span>
            }
          </p>
          @if (activeParkings().length > 0) {
            @for (parking of activeParkings(); track parking.id) {
              <app-parking-ticket-card
                [parking]="parking"
                variant="operations-current"
                (leaveParking)="onUnpark($event.id)"
                (extendTime)="onExtend()"
                (goToCar)="onGoToCar($event)"
              />
              @if (!$last) {
                <div class="parking-separator"></div>
              }
            }
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
                {{ 'ops.unpaidFines.title' | translate: { count: unpaidFinesCount() } }}
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
          <p class="section-label history-label">{{ 'dashboard.recentOps' | translate }}</p>
          <app-date-range-filter (rangeChange)="onRangeChange($event)" />
        </section>

        <ul class="list history-list">
          @for (group of groupedHistory(); track group.label) {
            <li class="history-group-label">{{ group.label }}</li>
            @for (op of group.items; track op.id) {
              <a
                [routerLink]="['/app/operations/detail', op.id]"
                class="list-item"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                <app-operation-icon [type]="op.type" />
                <div class="list-item-content">
                  <div class="list-item-title" [class.finish-op-title]="isFinishParking(op)">
                    {{ OPERATION_TYPE_LABELS[op.type] | translate }}
                  </div>
                  <div class="list-item-subtitle">{{ op.date }}{{ operationTime(op) ? ' · ' + operationTime(op) : '' }}{{ op.zone ? ' — ' + op.zone : '' }}</div>
                  @if (op.plate) {
                    <div class="operation-meta">
                      {{ op.plate }}
                      @if (isParking(op) && op.durationLabel) {
                        <span> · {{ op.durationLabel }}</span>
                      }
                    </div>
                  }
                </div>
                <span [class]="op.amount > 0 ? 'operation-amount operation-amount-credit' : 'operation-amount operation-amount-debit'">
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
    @if (unparked()) {
      <app-result-modal
        type="unpark"
        title="Aparcamiento finalizado"
        message="La devolución de saldo se ha añadido al monedero."
        primaryText="Aceptar"
        (primaryAction)="unparked.set(false)"
      />
    }
    @if (confirmUnpark()) {
      <app-result-modal
        type="confirmation"
        title="Desaparcar"
        message="Al dejar el aparcamiento recibirás un reembolso de EUR3.70."
        primaryText="Aceptar"
        secondaryText="Cancelar"
        (primaryAction)="confirmUnparkAction()"
        (secondaryAction)="confirmUnpark.set(false)"
      />
    }
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
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0.85rem 0 0.4rem;
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .active-parkings-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.5rem;
        height: 1.5rem;
        padding: 0 0.35rem;
        border-radius: var(--radius-pill);
        background: var(--color-active);
        color: var(--color-primary-dark);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        letter-spacing: normal;
        line-height: 1;
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
      .history-list .operation-meta {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .operation-amount {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 4.25rem;
        padding: 0.28rem 0.55rem;
        border: 1px solid transparent;
        border-radius: var(--radius-pill);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        line-height: 1;
        white-space: nowrap;
      }
      .operation-amount-credit {
        background: #e8f5e9;
        color: var(--color-success);
      }
      .operation-amount-debit {
        border-color: transparent;
        background: var(--color-error-bg);
        color: var(--color-error);
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
      .parking-separator {
        height: 0.5rem;
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
  private readonly parkingSessionService = inject(ParkingSessionService);
  private readonly navigationToCar = inject(NavigationToCarService);
  private readonly operations = this.operationsService.operations;
  private readonly rangeFilter = signal<DateRange>({ from: '', to: '' });
  private readonly unpaidFinesService = inject(UnpaidFinesService);
  readonly unpaidFinesCount = () => this.unpaidFinesService.fines().length;
  readonly OperationType = OperationType;
  readonly OPERATION_TYPE_LABELS = OPERATION_TYPE_LABELS;
  readonly activeParkings = this.parkingSessionService.activeParkings;
  readonly activeParkingsCount = this.parkingSessionService.activeParkingsCount;
  readonly unparked = signal(false);
  readonly confirmUnpark = signal(false);
  private pendingUnparkId = '';
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

  onUnpark(parkingId: string): void {
    this.pendingUnparkId = parkingId;
    this.confirmUnpark.set(true);
  }

  confirmUnparkAction(): void {
    this.confirmUnpark.set(false);
    if (this.parkingSessionService.leaveParking(this.pendingUnparkId)) {
      this.pendingUnparkId = '';
      this.unparked.set(true);
    }
  }

  onExtend(): void {
    this.router.navigate(['/app/parking/time-steps']);
  }

  onGoToCar(parking: ActiveParking): void {
    this.navigationToCar.open({
      latitude: parking.latitude,
      longitude: parking.longitude,
      label: parking.plate,
    });
  }

  isFinishParking(op: Operation): boolean {
    return op.type === OperationType.PARKING_END;
  }

  isParking(op: Operation): boolean {
    return op.type === OperationType.PARKING || op.type === OperationType.PARKING_EXTENSION;
  }

  operationTime(op: Operation): string {
    return op.startTime ?? op.endTime ?? '';
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
