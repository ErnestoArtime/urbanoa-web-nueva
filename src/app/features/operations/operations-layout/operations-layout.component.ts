import { AfterViewInit, Component, computed, DestroyRef, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DateRangeFilterComponent, type DateRange } from '../../../shared/components/date-range-filter/date-range-filter.component';
import { OperationType, OPERATION_TYPE_LABELS } from '../../../shared/models/operation-type';
import { UnpaidFinesService, isHistoricalUnpaidFine } from '../../../core/services/unpaid-fines.service';
import { OperationsService, type ActiveParking } from '../../../core/services/operations.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import type { UnparkingQuoteResult } from '../../../core/services/parking-api.service';
import { NavigationToCarService } from '../../../core/services/navigation-to-car.service';
import type { Operation } from '../../../shared/models/operation';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { ParkingTicketCardComponent } from '../../../shared/components/parking-ticket-card/parking-ticket-card.component';
import { ParkingFlowStore } from '../../parking/parking-flow.store';
import { OpsApiClient } from '../../../core/api/ops-api-client.service';
import { OPERATION_PERIODS, operationPeriod } from '../operation-period';

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
    <app-split-view [hideList]="isDetailRoute()" [hideDetail]="!isDetailRoute()" [showOutlet]="isDetailRoute()" emptyMessageKey="ops.empty">
      <div splitList class="page">
        <h1 class="page-title">{{ 'ops.title' | translate }}</h1>
        @if (initialLoading()) {
          <div class="operations-skeleton" role="status" aria-live="polite" [attr.aria-label]="'common.loading' | translate">
            <span class="sr-only">{{ 'common.loading' | translate }}</span>
            <div class="skeleton-line skeleton-label"></div>
            <div class="skeleton-card skeleton-card-current"></div>
            <div class="skeleton-card skeleton-card-action"></div>
            <div class="skeleton-panel">
              <div class="skeleton-line skeleton-heading"></div>
              <div class="skeleton-chips"><span></span><span></span><span></span></div>
              <div class="skeleton-filter"></div>
            </div>
            <div class="skeleton-list-row"></div>
            <div class="skeleton-list-row"></div>
            <div class="skeleton-list-row"></div>
          </div>
        }

        <div [class.operations-content-hidden]="initialLoading()">
          @if (unpaidFinesCount() > 0) {
            <section class="sanctions-alert">
              <a
                routerLink="/app/operations/unpaid-fines"
                [class.active]="isUnpaidFinesRoute()"
                [attr.aria-current]="isUnpaidFinesRoute() ? 'page' : null"
                class="sanctions-alert-link"
              >
                <div class="sanctions-alert-copy">
                  <strong>{{ 'ops.unpaidFines.bannerTitle' | translate }}</strong>
                  <span>{{ 'ops.unpaidFines.bannerCount' | translate: { count: unpaidFinesCount() } }} &gt;</span>
                </div>
                <app-operation-icon [type]="OperationType.UNPAID_FINES" />
              </a>
            </section>
          }

          <section class="current-section">
            @if (activeParkingStatusLoading()) {
              <p class="section-label">{{ 'ops.inProgress' | translate }}</p>
              <div
                class="skeleton-card skeleton-card-current active-parking-skeleton"
                role="status"
                aria-live="polite"
                [attr.aria-label]="'common.loading' | translate"
              >
                <span class="sr-only">{{ 'common.loading' | translate }}</span>
              </div>
            } @else if (activeParkings().length === 1) {
              <p class="section-label">{{ 'ops.inProgress' | translate }}</p>
              <app-parking-ticket-card
                [parking]="activeParkings()[0]"
                variant="operations-current"
                (leaveParking)="onUnpark($event.id)"
                (extendTime)="onExtend($event)"
                (goToCar)="onGoToCar($event)"
              />
            } @else if (activeParkings().length > 1) {
              <details class="active-parkings-section" open>
                <summary class="active-parkings-summary">
                  <span class="section-label">{{ 'ops.inProgress' | translate }}</span>
                  <span class="active-parkings-count" aria-hidden="true">{{ activeParkings().length }}</span>
                  <span class="sr-only">{{ 'dashboard.activeParkingsCount' | translate: { count: activeParkings().length } }}</span>
                </summary>
                @for (parking of activeParkings(); track parking.id) {
                  <app-parking-ticket-card
                    [parking]="parking"
                    variant="operations-current"
                    (leaveParking)="onUnpark($event.id)"
                    (extendTime)="onExtend($event)"
                    (goToCar)="onGoToCar($event)"
                  />
                  @if (!$last) {
                    <div class="parking-separator"></div>
                  }
                }
              </details>
            } @else {
              <p class="section-label">{{ 'ops.inProgress' | translate }}</p>
              <article class="active-operation empty-active-operation">
                <p>{{ 'ops.noActive' | translate }}</p>
              </article>
            }
          </section>

          <div #historyControls class="history-controls-sticky">
            <section class="actions-section">
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
          </div>

          <ul class="list history-list" [style.--history-controls-height]="historyControlsHeight() + 'px'">
            @for (group of groupedHistory(); track group.label) {
              <details class="history-group" open>
                <summary class="history-group-label">{{ group.label | translate }}</summary>
                <ul class="history-group-items">
                  @for (op of group.items; track op.id) {
                    <li>
                      <a
                        [routerLink]="['/app/operations/detail', op.id]"
                        class="list-item"
                        [class.historic-fine-item]="isHistoricFine(op)"
                        routerLinkActive="active"
                        [routerLinkActiveOptions]="{ exact: true }"
                      >
                        <app-operation-icon [type]="op.type" />
                        <div class="list-item-content">
                          <div class="list-item-title" [class.finish-op-title]="isFinishParking(op)">
                            {{ operationLabel(op) | translate }}
                            @if (isHistoricFine(op)) {
                              <span class="historic-fine-badge">{{ 'ops.fineDetail.historic' | translate }}</span>
                            }
                            @if (op.timePeriod === 2) {
                              <span class="badge badge-warning">{{ 'ops.active' | translate }}</span>
                            }
                          </div>
                          <div class="list-item-subtitle">
                            {{ op.zone }}{{ op.cityName ? ' · ' + op.cityName : '' }}{{ op.ticketName ? ' · ' + op.ticketName : '' }}
                            @if (isFreeParking(op)) {
                              <span> · {{ 'parking.tickets.free' | translate }}</span>
                            }
                          </div>
                          @if (op.plate) {
                            <div class="operation-meta">
                              {{ op.plate }}
                              @if (isParking(op) && op.durationLabel) {
                                <span> · {{ op.durationLabel }}</span>
                              }
                            </div>
                          }
                          @if (op.type === OperationType.TOP_UP && op.cardLabel) {
                            <div class="operation-meta">{{ op.cardLabel }}</div>
                          }
                        </div>
                        <div class="operation-price-date">
                          <span class="operation-date">{{ op.date }}</span>
                          @if (operationTime(op)) {
                            <span class="operation-time">{{ operationTime(op) }}</span>
                          }
                          <span
                            [class]="op.amount > 0 ? 'operation-amount operation-amount-credit' : 'operation-amount operation-amount-debit'"
                          >
                            {{ op.amount > 0 ? '+' : '' }}{{ op.amount | number: '1.2-2' }} €
                          </span>
                        </div>
                      </a>
                    </li>
                  }
                </ul>
              </details>
            }
            @if (groupedHistory().length === 0) {
              <li class="list-item" style="justify-content:center;color:var(--color-muted)">
                @if (operationsSource() === 'error') {
                  <div class="operations-error">
                    <span>{{ 'ops.loadError' | translate }}</span>
                    <button type="button" class="btn btn-secondary" (click)="retryOperations()">{{ 'common.retry' | translate }}</button>
                  </div>
                } @else {
                  {{ 'ops.empty' | translate }}
                }
              </li>
            }
          </ul>
        </div>
      </div>
    </app-split-view>
    @if (unparked()) {
      <app-result-modal
        type="unpark"
        [title]="'parking.ended' | translate"
        [message]="unparkedRefundAmount() > 0 ? ('dashboard.unparkSuccessDetail' | translate) : undefined"
        [primaryText]="'common.accept' | translate"
        (primaryAction)="dismissUnparked()"
      />
    }
    @if (unparkError(); as error) {
      <app-result-modal
        type="error"
        [title]="'dashboard.unparkError' | translate"
        [message]="error"
        [primaryText]="'common.accept' | translate"
        (primaryAction)="unparkError.set(null)"
      />
    }
    @if (confirmUnpark()) {
      <app-result-modal
        type="confirmation"
        [title]="'dashboard.unpark' | translate"
        [message]="
          (pendingUnparkAmount() ?? 0) > 0
            ? ('dashboard.unparkConfirmDetail' | translate: { amount: 'EUR' + pendingUnparkAmount()!.toFixed(2) })
            : ('dashboard.unparkNoRefund' | translate)
        "
        [primaryText]="'common.accept' | translate"
        [secondaryText]="'common.cancel' | translate"
        (primaryAction)="confirmUnparkAction()"
        (secondaryAction)="!unparking() && confirmUnpark.set(false)"
        [busy]="unparking()"
      />
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 0;
      }
      .list-item.active {
        background: rgba(93, 154, 150, 0.16);
        color: var(--color-primary-dark);
        box-shadow: inset 4px 0 0 var(--color-primary);
      }
      .historic-fine-item {
        border-left: 4px solid var(--color-error);
        background: var(--color-surface);
      }
      .historic-fine-badge {
        display: inline-flex;
        margin-left: 0.45rem;
        padding: 0.12rem 0.4rem;
        border-radius: 999px;
        background: var(--color-error-bg);
        color: var(--color-error);
        font-size: var(--text-xs);
        font-weight: var(--font-bold);
      }
      .operations-content-hidden {
        display: none;
      }
      .operations-skeleton {
        display: grid;
        gap: 0.75rem;
        padding-top: 0.75rem;
      }
      .operations-skeleton > div,
      .active-parking-skeleton,
      .skeleton-chips span {
        position: relative;
        overflow: hidden;
        border-radius: var(--radius-md);
        background: #e7ebe2;
      }
      .operations-skeleton > div::after,
      .active-parking-skeleton::after,
      .skeleton-chips span::after {
        position: absolute;
        inset: 0;
        content: '';
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
        animation: operations-shimmer 1.25s ease-in-out infinite;
      }
      .skeleton-line {
        height: 0.75rem;
      }
      .skeleton-label {
        width: 30%;
      }
      .skeleton-heading {
        width: 42%;
      }
      .skeleton-card-current {
        height: 5.5rem;
      }
      .active-parking-skeleton {
        margin-bottom: 0.1rem;
      }
      .skeleton-card-action {
        height: 4.25rem;
        margin-top: 0.25rem;
      }
      .skeleton-panel {
        display: grid;
        gap: 0.7rem;
        padding: 0.8rem;
        background: transparent !important;
        border: 1px solid var(--color-border);
      }
      .skeleton-panel::after {
        display: none;
      }
      .skeleton-chips {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.45rem;
      }
      .skeleton-chips span {
        height: 1.9rem;
        border-radius: var(--radius-pill);
      }
      .skeleton-filter {
        height: 2.6rem;
      }
      .skeleton-list-row {
        height: 4.4rem;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      @keyframes operations-shimmer {
        to {
          transform: translateX(100%);
        }
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
      .active-parkings-summary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 2.75rem;
        padding: 0.35rem 0.15rem;
        cursor: pointer;
        list-style: none;
      }
      .active-parkings-summary::-webkit-details-marker {
        display: none;
      }
      .active-parkings-summary::after {
        width: 0.55rem;
        height: 0.55rem;
        margin-right: 0.35rem;
        margin-left: auto;
        border-right: 2px solid var(--color-primary);
        border-bottom: 2px solid var(--color-primary);
        content: '';
        transform: rotate(45deg) translateY(-0.15rem);
      }
      .active-parkings-section[open] .active-parkings-summary::after {
        transform: rotate(225deg) translateY(-0.15rem);
      }
      .active-parkings-count {
        display: inline-grid;
        place-items: center;
        min-width: 1.5rem;
        height: 1.5rem;
        padding: 0 0.35rem;
        border-radius: var(--radius-pill);
        background: var(--color-primary);
        color: #fff;
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        line-height: 1;
      }
      .history-controls-sticky {
        position: sticky;
        top: 0;
        z-index: 4;
        padding-top: 1rem;
        background: var(--color-surface);
      }
      .history-controls-sticky .actions-section {
        margin-top: 0;
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
        overflow: visible;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      .history-group {
        display: flex;
        flex-direction: column;
        border-bottom: 1px solid var(--color-border);
      }
      .history-group:last-child {
        border-bottom: none;
      }
      .history-group-label {
        position: sticky;
        top: var(--history-controls-height, 0px);
        z-index: 3;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        padding: 0.65rem 0.8rem;
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        letter-spacing: 0.05em;
        cursor: pointer;
        list-style: none;
        background: var(--color-background);
        user-select: none;
      }
      .history-group-label::-webkit-details-marker {
        display: none;
      }
      .history-group-label::after {
        content: '';
        width: 0.55rem;
        height: 0.55rem;
        margin-left: auto;
        border-right: 2px solid var(--color-primary);
        border-bottom: 2px solid var(--color-primary);
        transform: rotate(45deg) translateY(-0.15rem);
        transition: transform 180ms ease;
      }
      .history-group[open] .history-group-label::after {
        transform: rotate(225deg) translateY(-0.15rem);
      }
      .history-group-label:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: -2px;
      }
      .history-group-items {
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      .history-group-items > li {
        list-style: none;
      }
      .operation-price-date {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;
        flex-shrink: 0;
      }
      .operation-date,
      .operation-time {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        white-space: nowrap;
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
      .sanctions-alert {
        margin-top: 0.85rem;
      }
      .sanctions-alert-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-height: 76px;
        padding: 0.85rem 1rem;
        border: 1px solid #d97770;
        border-radius: var(--radius-md);
        background: #fbd5d0;
        color: #813832;
        text-decoration: none;
        transition:
          background 0.18s ease,
          box-shadow 0.18s ease;
      }
      .sanctions-alert-link:hover,
      .sanctions-alert-link.active {
        background: #f8cbc5;
        box-shadow: var(--shadow-sm);
        text-decoration: none;
      }
      .sanctions-alert-copy {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 0.2rem;
      }
      .sanctions-alert-copy strong {
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
      }
      .sanctions-alert-copy span {
        font-size: var(--text-xs);
      }
      :host ::ng-deep .sanctions-alert .operation-icon {
        flex-basis: 42px;
        width: 42px;
        height: 42px;
        background: transparent;
        color: #93433d;
      }
      :host ::ng-deep .sanctions-alert .operation-icon svg {
        width: 28px;
        height: 28px;
      }
      .action-item {
        background: transparent;
        border-radius: var(--radius-sm);
        margin: 0 -0.75rem;
        min-height: 3rem;
        padding: 0.65rem 0.75rem;
        border-bottom: 1px solid var(--color-border);
      }
      .action-item .list-item-title {
        color: var(--color-text);
        font-size: var(--text-sm);
        font-weight: var(--font-extra);
      }
      .action-item:last-child {
        border-bottom: none;
      }
      .action-item:hover {
        background: var(--color-background);
      }
      .action-item:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }
      .action-item.active {
        position: relative;
        background: var(--color-active);
        color: var(--color-primary-dark);
        box-shadow: inset 4px 0 0 var(--color-primary);
      }
      .action-item.active .list-item-title {
        color: var(--color-primary-dark);
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
export class OperationsLayoutComponent implements OnInit, AfterViewInit {
  @ViewChild('historyControls') private historyControls?: ElementRef<HTMLElement>;
  private readonly api = inject(OpsApiClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly operationsService = inject(OperationsService);
  private readonly parkingSessionService = inject(ParkingSessionService);
  private readonly navigationToCar = inject(NavigationToCarService);
  private readonly parkingFlowStore = inject(ParkingFlowStore);
  private readonly vehicleService = inject(VehicleService);
  private readonly operations = this.operationsService.operations;
  private readonly rangeFilter = signal<DateRange>({ from: '', to: '' });
  readonly historyControlsHeight = signal(0);
  private readonly unpaidFinesService = inject(UnpaidFinesService);
  readonly unpaidFinesCount = () => this.unpaidFinesService.fines().length;
  readonly OperationType = OperationType;
  readonly OPERATION_TYPE_LABELS = OPERATION_TYPE_LABELS;
  readonly activeParkings = this.parkingSessionService.activeParkings;
  readonly unparkError = this.parkingSessionService.unparkError;
  readonly operationsSource = this.operationsService.source;
  readonly activeParkingStatusLoading = computed(() => this.operationsService.activeSource() === 'idle');
  readonly unparked = signal(false);
  readonly unparkedRefundAmount = signal(0);
  readonly confirmUnpark = signal(false);
  readonly unparking = signal(false);
  readonly pendingUnparkAmount = signal<number | null>(null);
  private pendingUnparkId = '';
  private pendingUnparkQuote: UnparkingQuoteResult | undefined;
  readonly filteredOps = computed(() => this.applyFilter(this.operations()));
  readonly groupedHistory = computed(() => this.groupByPeriod(this.filteredOps()));
  readonly initialLoading = computed(
    () => this.operationsService.source() === 'idle' || (this.operationsService.loading() && this.operations().length === 0),
  );

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  ngOnInit(): void {
    void this.reload();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (event.urlAfterRedirects.split('?')[0].replace(/\/$/, '') === '/app/operations') {
          this.reload();
        }
      });
  }

  ngAfterViewInit(): void {
    const controls = this.historyControls?.nativeElement;
    if (!controls) return;

    const updateHeight = () => this.historyControlsHeight.set(controls.getBoundingClientRect().height);
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(controls);
    this.destroyRef.onDestroy(() => resizeObserver.disconnect());
  }

  private async reload(): Promise<void> {
    await Promise.all([this.operationsService.load(), this.vehicleService.load()]);
    await this.operationsService.loadDashboardParkingStatuses(this.vehicleService.vehicles());
  }

  retryOperations(): void {
    void this.operationsService.load();
  }

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

  async onUnpark(parkingId: string): Promise<void> {
    this.pendingUnparkId = parkingId;
    const quote = await this.parkingSessionService.quoteUnparking(parkingId);
    if (!quote.success) {
      this.unparkError.set(quote.error instanceof Error ? quote.error.message : 'No se pudo calcular el desaparcar.');
      return;
    }
    this.pendingUnparkQuote = quote;
    this.pendingUnparkAmount.set(quote.refundAmount ?? 0);
    this.confirmUnpark.set(true);
  }

  async confirmUnparkAction(): Promise<void> {
    if (this.unparking()) return;
    this.unparking.set(true);
    try {
      if (await this.parkingSessionService.leaveParking(this.pendingUnparkId, this.pendingUnparkQuote)) {
        this.unparkedRefundAmount.set(this.pendingUnparkAmount() ?? 0);
        this.confirmUnpark.set(false);
        this.pendingUnparkId = '';
        this.pendingUnparkQuote = undefined;
        this.pendingUnparkAmount.set(null);
        this.unparked.set(true);
      }
    } finally {
      this.unparking.set(false);
    }
  }

  dismissUnparked(): void {
    this.unparked.set(false);
    this.unparkedRefundAmount.set(0);
  }

  onExtend(parking: ActiveParking): void {
    if (parking.extension !== 2) return;
    if (!this.parkingFlowStore.startExtension(parking)) return;
    void this.router.navigate(['/app/parking/time-steps']);
  }

  onGoToCar(parking: ActiveParking): void {
    this.navigationToCar.open({
      latitude: parking.latitude,
      longitude: parking.longitude,
      label: parking.plate,
    });
  }

  isFinishParking(op: Operation): boolean {
    return op.type === OperationType.REFUND;
  }

  operationLabel(op: Operation): string {
    if (op.type === OperationType.UNPAID_FINES) return isHistoricalUnpaidFine(op) ? 'ops.fineDetail.sanction' : 'ops.type.sanciones';
    return OPERATION_TYPE_LABELS[op.type];
  }

  isHistoricFine(op: Operation): boolean {
    return isHistoricalUnpaidFine(op);
  }

  isParking(op: Operation): boolean {
    return op.type === OperationType.PARKING || op.type === OperationType.PARKING_EXTENSION;
  }

  isFreeParking(op: Operation): boolean {
    return this.isParking(op) && Math.abs(op.amount) < 0.005;
  }

  operationTime(op: Operation): string {
    return op.operationTime ?? op.startTime ?? op.endTime ?? '';
  }

  private applyFilter(list: Operation[]): Operation[] {
    const { from, to } = this.rangeFilter();
    const history = list.filter((op) => op.type !== OperationType.UNPAID_FINES || isHistoricalUnpaidFine(op));
    const sorted = [...history].sort((a, b) => {
      const diff = this.toDateValue(b.date) - this.toDateValue(a.date);
      if (diff !== 0) return diff;
      const aTime = this.operationTime(a);
      const bTime = this.operationTime(b);
      return bTime.localeCompare(aTime);
    });

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
    const now = this.api.serverNow();
    const groups = new Map<string, Operation[]>(OPERATION_PERIODS.map((label) => [label, []]));
    for (const op of list) {
      groups.get(operationPeriod(op.date, now))!.push(op);
    }
    return [...groups.entries()].filter(([, items]) => items.length > 0).map(([label, items]) => ({ label, items }));
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
