import { RuntimeStyleDirective } from '../../../shared/directives/runtime-style.directive';
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
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ParkingTicketCardComponent } from '../../../shared/components/parking-ticket-card/parking-ticket-card.component';
import { ParkingFlowStore } from '../../parking/parking-flow.store';
import { OpsApiClient } from '../../../core/api/ops-api-client.service';
import { OPERATION_PERIODS, operationPeriod } from '../operation-period';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-operations-layout',
  imports: [
    RuntimeStyleDirective,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    DecimalPipe,
    DateRangeFilterComponent,
    OperationIconComponent,
    SplitViewComponent,
    ParkingTicketCardComponent,
    ResultModalComponent,
    LoaderComponent,
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

          <ul class="list history-list" [appRuntimeStyle]="{ '--history-controls-height': historyControlsHeight() + 'px' }">
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
              <li class="list-item history-empty">
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
    <app-loader [visible]="unparkQuerying()" [message]="'common.loading' | translate" />
  `,
  styleUrl: './operations-layout.component.css',
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
  private readonly translations = inject(TranslationService);
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
  readonly unparkQuerying = signal(false);
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
    if (this.unparkQuerying()) return;
    this.unparkQuerying.set(true);
    this.unparkError.set(null);
    try {
      this.pendingUnparkId = parkingId;
      const quote = await this.parkingSessionService.quoteUnparking(parkingId);
      if (!quote.success) {
        this.unparkError.set(this.translations.translate('parking.unparking.quoteError'));
        return;
      }
      this.pendingUnparkQuote = quote;
      this.pendingUnparkAmount.set(quote.refundAmount ?? 0);
      this.confirmUnpark.set(true);
    } finally {
      this.unparkQuerying.set(false);
    }
  }

  async confirmUnparkAction(): Promise<void> {
    if (!this.confirmUnpark() || this.unparking()) return;
    this.unparking.set(true);
    try {
      if (await this.parkingSessionService.leaveParking(this.pendingUnparkId, this.pendingUnparkQuote)) {
        this.unparkedRefundAmount.set(this.pendingUnparkAmount() ?? 0);
        this.unparked.set(true);
      }
    } catch (error) {
      this.unparkError.set(error instanceof Error ? error.message : this.translations.translate('dashboard.unparkError'));
    } finally {
      this.confirmUnpark.set(false);
      this.pendingUnparkId = '';
      this.pendingUnparkQuote = undefined;
      this.pendingUnparkAmount.set(null);
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
