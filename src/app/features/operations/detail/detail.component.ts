import { ApiErrorPipe } from '../../../shared/pipes/api-error.pipe';
import { formatEuro } from '../../../core/utils/euro-format';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { RuntimeStyleDirective } from '../../../shared/directives/runtime-style.directive';
import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { OperationsService } from '../../../core/services/operations.service';
import { isHistoricalUnpaidFine } from '../../../core/services/unpaid-fines.service';
import { OperationType } from '../../../shared/models/operation-type';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { LocationMap } from '../../../shared/components/location-map/location-map';
import { normalizeSectorColor } from '../../../shared/utils/sector-color';
import { CitiesService } from '../../../core/services/cities.service';
import { TicketCutAlignDirective } from '../../../shared/directives/ticket-cut-align.directive';

@Component({
  selector: 'app-operations-detail',
  imports: [
    ApiErrorPipe,
    EuroPipe,
    RuntimeStyleDirective,
    OperationIconComponent,
    AppIconComponent,
    TranslatePipe,
    DetailPanelHeaderComponent,
    LocationMap,
    TicketCutAlignDirective,
  ],
  template: `
    <div class="page operation-detail-page">
      <app-detail-panel-header [title]="detailTitle() | translate" backRoute="/app/operations" />
      @if (operationError(); as error) {
        <p class="data-notice" role="alert">{{ error | apiError: 'ops.loadError' }}</p>
      }
      @if (op(); as operation) {
        @if (isFinePaymentDetail()) {
          <section class="fine-payment-detail">
            <article class="fine-payment-card card">
              <div class="fine-payment-kind">
                <app-operation-icon [type]="operation.type" />
                <strong>{{ 'ops.fineDetail.sanction' | translate }}</strong>
              </div>

              <strong class="fine-payment-amount">{{ formatFineAmount(absoluteAmount()) }}</strong>

              @if (isAcknowledgedFineDetail()) {
                @if (operation.fineStatus === 2 && operation.fineValidDate) {
                  <div class="fine-payment-status">
                    <span class="fine-payment-row-icon"><app-icon name="schedule" [stroke]="false" /></span>
                    <div>
                      <span>{{ 'ops.fineDetail.earlyPaymentEnd' | translate }}</span>
                      <strong>{{ operation.fineValidDate }}</strong>
                    </div>
                  </div>
                }
                @if (operation.fineStatus === 2 || operation.fineStatus === 3) {
                  <div class="fine-payment-status-message">
                    <span class="fine-payment-row-icon"><app-icon name="warning" [stroke]="false" /></span>
                    <p>{{ 'ops.fineDetail.statusMessage.' + operation.fineStatus | translate }}</p>
                  </div>
                }
              }

              @if (!isAcknowledgedFineDetail()) {
                <div class="fine-payment-method">
                  <span>{{ 'ops.detail.paymentMethod' | translate }}</span>
                  <strong>{{ finePaymentMethodLabel() }}</strong>
                  @if (walletPaymentAmount() > 0 && cardPaymentAmount() > 0) {
                    <span>{{ 'ops.detail.wallet' | translate }}</span>
                    <strong>−{{ formatFineAmount(walletPaymentAmount()) }}</strong>
                    <span>{{ cardPaymentLabel() }}</span>
                    <strong>−{{ formatFineAmount(cardPaymentAmount()) }}</strong>
                  }
                </div>
              }

              <div class="fine-payment-info">
                <div class="fine-payment-row">
                  <span class="fine-payment-row-icon">#</span>
                  <div>
                    <span>{{ 'ops.fineDetail.fineNumber' | translate }}</span
                    ><strong>{{ operation.fineNumber ?? operation.id }}</strong>
                  </div>
                </div>
                <div class="fine-payment-row">
                  <span class="fine-payment-row-icon"><app-icon name="vehicle" [stroke]="false" /></span>
                  <div>
                    <span>{{ 'ops.detail.plate' | translate }}</span
                    ><strong>{{ operation.plate }}</strong>
                  </div>
                </div>
                <div class="fine-payment-row">
                  <span class="fine-payment-row-icon"><app-icon name="dateRange" [stroke]="false" /></span>
                  <div>
                    <span>{{ 'ops.detail.datetime' | translate }}</span
                    ><strong>{{ dateTime(operation) }}</strong>
                  </div>
                </div>
                <div class="fine-payment-row fine-payment-location">
                  <span class="fine-payment-row-icon"><app-icon name="location" [stroke]="false" /></span>
                  <div>
                    <strong>{{ fineLocationTitle() }}</strong>
                    @if (fineLocationSubtitle()) {
                      <span>{{ fineLocationSubtitle() }}</span>
                    }
                  </div>
                </div>
              </div>

              @if (fineCoordinates(); as coordinates) {
                <app-location-map
                  [latitude]="coordinates.latitude"
                  [longitude]="coordinates.longitude"
                  [label]="'ops.detail.fineMapAria' | translate"
                />
              }
            </article>
          </section>
        } @else {
          <header class="detail-heading">
            <app-operation-icon [type]="operation.type" />
            <div>
              <span>{{ 'ops.detail.title' | translate: { id: id() } }}</span>
              <h1>{{ detailTitle() | translate }}</h1>
            </div>
          </header>
          @if (isTopUpOperation()) {
            <article class="top-up-detail card">
              <div class="top-up-row top-up-operation-id">
                <span class="top-up-row-icon">#</span>
                <div>
                  <span>{{ 'ops.detail.operationId' | translate }}</span>
                  <strong>{{ transactionId() || operation.id }}</strong>
                </div>
              </div>
              <div class="top-up-row">
                <span class="top-up-row-icon"><app-icon name="card" [stroke]="false" /></span>
                <div>
                  <span>{{ 'ops.detail.paymentMethod' | translate }}</span>
                  <strong>{{ topUpPaymentMethod() }}</strong>
                </div>
              </div>
              <div class="top-up-row">
                <span class="top-up-row-icon"><app-icon name="dateRange" [stroke]="false" /></span>
                <div>
                  <span>{{ 'ops.detail.datetime' | translate }}</span>
                  <strong>{{ dateTime(operation) }}</strong>
                </div>
              </div>
              <div class="top-up-row">
                <span class="top-up-row-icon"><app-icon name="coins" [stroke]="false" /></span>
                <div>
                  <span>{{ 'ops.detail.amount' | translate }}</span>
                  <strong class="positive">+{{ formatFineAmount(absoluteAmount()) }}</strong>
                </div>
              </div>
              <div class="top-up-row">
                <span class="top-up-row-icon"><app-icon name="wallet" [stroke]="false" /></span>
                <div>
                  <span>{{ 'ops.detail.balanceAfterTopUp' | translate }}</span>
                  <strong>{{ balanceAfterTopUp() }}</strong>
                </div>
              </div>
            </article>
          } @else if (isTicketStyleOperation()) {
            <div class="ticket-shell">
              <article appTicketCutAlign class="ticket-card" [appRuntimeStyle]="{ '--ticket-header-color': ticketHeaderColor() }">
                <div class="ticket-accent"></div>
                <div class="ticket-header">
                  <app-operation-icon [type]="operation.type" />
                  <div>
                    <strong>{{ operation.plate }}</strong
                    ><span>{{ operation.zone }}{{ operation.cityName ? ' · ' + operation.cityName : '' }}</span>
                    @if (operation.ticketName) {
                      <small class="ticket-context">{{ operation.ticketName }}</small>
                    }
                  </div>
                  <div class="ticket-date">
                    @if (isRefundOperation() && transactionId()) {
                      <small># {{ transactionId() }}</small>
                    } @else {
                      <small>{{ 'ops.detail.date' | translate }}</small>
                    }
                    <strong>{{ operation.date }}</strong>
                  </div>
                </div>
                <div class="ticket-timeline">
                  <div>
                    <small>{{ 'ops.detail.start' | translate }}</small
                    ><strong>{{ startTime() }}</strong
                    ><span>{{ operation.startDate ?? operation.date }}</span>
                  </div>
                  <i></i><b>{{ duration() }}</b
                  ><i></i>
                  <div>
                    <small>{{ 'ops.detail.end' | translate }}</small
                    ><strong>{{ endTime() }}</strong
                    ><span>{{ operation.endDate ?? operation.date }}</span>
                  </div>
                </div>
                <div class="ticket-cut" data-ticket-cut></div>
                <div class="ticket-total">
                  <div>
                    <span>{{ 'ops.detail.total' | translate }}</span
                    ><small>{{ 'ops.detail.paymentMethod' | translate }}</small>
                  </div>
                  <div>
                    <strong>{{ isFreeTicket() ? ('parking.tickets.free' | translate) : (absoluteAmount() | euro) }}</strong
                    ><span>{{ paymentMethodLabel() }}</span>
                  </div>
                </div>
                @if (hasPaymentBreakdown()) {
                  <div class="ticket-payment-breakdown">
                    @if (walletPaymentAmount() > 0) {
                      <p>
                        <span>{{ 'ops.detail.wallet' | translate }}</span
                        ><strong>{{ walletPaymentAmount() | euro }}</strong>
                      </p>
                    }
                    @if (cardPaymentAmount() > 0) {
                      <p>
                        <span>{{ cardPaymentLabel() }}</span
                        ><strong>{{ cardPaymentAmount() | euro }}</strong>
                      </p>
                    }
                  </div>
                }
              </article>
            </div>
          } @else {
            <article
              class="info-detail card"
              [class.refund-detail]="isRefundOperation()"
              [appRuntimeStyle]="{ '--ticket-header-color': ticketHeaderColor() }"
            >
              @if (transactionId()) {
                <div class="transaction">
                  <span>{{ 'ops.detail.transactionId' | translate }}</span
                  ><strong>{{ transactionId() }}</strong>
                </div>
              }
              @for (row of detailRows(); track row.label) {
                <div class="info-row">
                  <span class="row-icon"><app-icon [name]="row.icon" [stroke]="false" /> </span>
                  <div>
                    <span>{{ row.label | translate }}</span
                    ><strong [class.positive]="row.positive">{{ row.value }}</strong>
                  </div>
                </div>
              }
            </article>
          }
        }
      }
    </div>
  `,
  styleUrl: './detail.component.css',
})
export class OperationsDetailComponent {
  operationError(): unknown {
    return this.service.responseError?.();
  }

  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OperationsService);
  private readonly translationService = inject(TranslationService);
  private readonly citiesService = inject(CitiesService);
  readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });
  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((id) => {
        if (id) void this.service.loadDetail(id);
      });
    void this.citiesService.getCities().catch(() => undefined);
  }
  readonly op = computed(() => {
    this.service.operations();
    return this.service.getOperationById(this.id());
  });
  readonly opType = computed(() => this.op()?.type ?? OperationType.PARKING);
  readonly isFinePaymentDetail = computed(() => {
    const operation = this.op();
    return (operation?.type === OperationType.FINE_PAYMENT || (operation !== undefined && isHistoricalUnpaidFine(operation))) ?? false;
  });
  readonly ticketHeaderColor = computed(() => normalizeSectorColor(this.op()?.sectorColor));
  readonly detailTitle = computed(() => {
    const operation = this.op();
    if (operation !== undefined && isHistoricalUnpaidFine(operation)) return 'ops.fineDetail.sanction';
    const labels: Partial<Record<OperationType, string>> = {
      [OperationType.PARKING]: 'ops.detail.parkingDetail',
      [OperationType.PARKING_EXTENSION]: 'ops.detail.extension',
      [OperationType.REFUND]: 'ops.detail.parkingEnd',
      [OperationType.FINE_PAYMENT]: 'ops.detail.finePayment',
      [OperationType.TOP_UP]: 'ops.detail.walletRecharge',
      [OperationType.BALANCE_REFUND]: 'ops.detail.balanceRefundLabel',
      [OperationType.UNPAID_FINES]: 'ops.detail.pendingFine',
    };
    return labels[this.opType()] ?? 'ops.detail';
  });
  readonly isTicketOperation = computed(() => [OperationType.PARKING, OperationType.PARKING_EXTENSION].includes(this.opType()));
  readonly isRefundOperation = computed(() => this.opType() === OperationType.REFUND);
  readonly isTicketStyleOperation = computed(() => this.isTicketOperation() || this.isRefundOperation());
  readonly isTopUpOperation = computed(() => this.opType() === OperationType.TOP_UP);
  readonly isAcknowledgedFineDetail = computed(() => {
    const operation = this.op();
    return operation !== undefined && isHistoricalUnpaidFine(operation);
  });
  readonly startTime = () => this.op()?.startTime ?? '--:--';
  readonly endTime = () => this.op()?.endTime ?? '--:--';
  readonly duration = () => this.op()?.durationLabel ?? '—';
  readonly transactionId = computed(() => this.op()?.operationNumber ?? '');
  readonly absoluteAmount = computed(() => Math.abs(this.op()?.amount ?? 0));
  readonly isFreeTicket = computed(() => this.isTicketOperation() && this.absoluteAmount() < 0.005);
  readonly walletPaymentAmount = computed(() => Math.abs(this.op()?.paymentBreakdown?.walletAmount ?? 0));
  readonly cardPaymentAmount = computed(() => Math.abs(this.op()?.paymentBreakdown?.cardAmount ?? 0));
  readonly hasPaymentBreakdown = computed(() => this.walletPaymentAmount() > 0 || this.cardPaymentAmount() > 0);
  readonly cardPaymentLabel = computed(
    () => this.op()?.paymentBreakdown?.cardLabel || this.op()?.cardLabel || this.translationService.translate('ops.detail.card'),
  );
  readonly paymentMethodLabel = computed(() => {
    const wallet = this.walletPaymentAmount();
    const card = this.cardPaymentAmount();
    if (wallet > 0 && card > 0)
      return (
        this.translationService.translate('payment.mixed') +
        ': ' +
        this.translationService.translate('ops.detail.wallet') +
        ' + ' +
        this.cardPaymentLabel()
      );
    if (card > 0) return this.cardPaymentLabel();
    if (wallet > 0) return this.translationService.translate('ops.detail.wallet');
    if (this.op()?.paymentMethod === 8) return this.translationService.translate('ops.detail.wallet');
    if (this.op()?.paymentMethod === 7) return this.cardPaymentLabel();
    if (this.op()?.paymentMethod === 9) return this.translationService.translate('payment.mixed');
    return this.op()?.cardLabel || '—';
  });
  readonly finePaymentMethodLabel = computed(() => {
    if (this.walletPaymentAmount() > 0 && this.cardPaymentAmount() > 0) return this.translationService.translate('payment.mixed');
    if (this.cardPaymentAmount() > 0) return this.cardPaymentLabel();
    if (this.walletPaymentAmount() > 0) return this.translationService.translate('ops.detail.wallet');
    if (this.op()?.paymentMethod === 8) return this.translationService.translate('ops.detail.wallet');
    if (this.op()?.paymentMethod === 7) return this.cardPaymentLabel();
    if (this.op()?.paymentMethod === 9) return this.translationService.translate('payment.mixed');
    return this.op()?.cardLabel || '—';
  });
  readonly topUpPaymentMethod = computed(() => this.op()?.cardLabel || '—');
  readonly balanceAfterTopUp = computed(() => {
    const balance = this.op()?.newBalance;
    return balance == null ? '—' : formatEuro(balance);
  });
  readonly fineLocationTitle = computed(() => this.op()?.zoneName || this.op()?.zone || '—');
  readonly fineLocationSubtitle = computed(() => {
    const operation = this.op();
    if (!operation) return '';
    return [operation.sectorName, this.citiesService.nameFor(operation)].filter(Boolean).join(' · ');
  });
  readonly fineCoordinates = computed(() => {
    const operation = this.op();
    if (!operation || !this.isFinePaymentDetail()) return null;
    const { latitude, longitude } = operation;
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude!) > 90 ||
      Math.abs(longitude!) > 180 ||
      (latitude === 0 && longitude === 0)
    )
      return null;
    return { latitude: latitude!, longitude: longitude! };
  });
  readonly detailRows = computed(() => {
    const o = this.op();
    if (!o) return [];
    const car = 'vehicle' as const;
    const calendar = 'dateRange' as const;
    const clock = 'schedule' as const;
    const money = 'wallet' as const;
    if (o.type === OperationType.REFUND)
      return [
        ...(o.plate ? [{ label: 'ops.detail.plate', value: o.plate, icon: car, positive: undefined }] : []),
        ...(o.cityName ? [{ label: 'ops.detail.municipality', value: o.cityName, icon: calendar, positive: undefined }] : []),
        ...(o.ticketName ? [{ label: 'ops.detail.tariff', value: o.ticketName, icon: calendar, positive: undefined }] : []),
        { label: 'ops.detail.datetime', value: this.dateTime(o), icon: calendar, positive: undefined },
        ...(o.durationLabel ? [{ label: 'ops.detail.totalTime', value: o.durationLabel, icon: clock, positive: undefined }] : []),
        { label: 'ops.detail.refund', value: `+${formatEuro(this.absoluteAmount())}`, icon: money, positive: true },
      ];
    if (o.type === OperationType.TOP_UP)
      return [
        { label: 'ops.detail.datetime', value: this.dateTime(o), icon: calendar, positive: undefined },
        ...(o.cardLabel ? [{ label: 'ops.detail.paymentMethod', value: o.cardLabel, icon: money, positive: undefined }] : []),
        { label: 'ops.detail.recharge', value: `+${formatEuro(this.absoluteAmount())}`, icon: money, positive: true },
      ];
    if (o.type === OperationType.FINE_PAYMENT)
      return [
        ...(o.fineNumber ? [{ label: 'ops.fineDetail.fineNumber', value: o.fineNumber, icon: calendar, positive: undefined }] : []),
        { label: 'ops.detail.plate', value: o.plate ?? '', icon: car, positive: undefined },
        { label: 'ops.detail.datetime', value: this.dateTime(o), icon: calendar, positive: undefined },
        { label: 'ops.detail.location', value: o.zone ?? '', icon: calendar, positive: undefined },
        { label: 'ops.detail.paymentMethod', value: this.paymentMethodLabel(), icon: money, positive: undefined },
        ...this.paymentRows(money, false),
        { label: 'ops.detail.total', value: formatEuro(this.absoluteAmount()), icon: money, positive: undefined },
      ];
    return [
      { label: 'ops.detail.datetime', value: this.dateTime(o), icon: calendar, positive: undefined },
      ...(o.cardLabel ? [{ label: 'ops.detail.paymentMethod', value: o.cardLabel, icon: money, positive: undefined }] : []),
      {
        label: 'ops.detail.balanceRefund',
        value: `${this.signedAmountPrefix()}${formatEuro(this.absoluteAmount())}`,
        icon: money,
        positive: o.amount > 0,
      },
    ];
  });

  private paymentRows(icon: 'wallet', positive: boolean | undefined) {
    if (!this.hasPaymentBreakdown()) return [];
    const rows: { label: string; value: string; icon: 'wallet'; positive: boolean | undefined }[] = [];
    if (this.walletPaymentAmount() > 0) {
      rows.push({ label: 'ops.detail.wallet', value: formatEuro(this.walletPaymentAmount()), icon, positive });
    }
    if (this.cardPaymentAmount() > 0) {
      rows.push({ label: this.cardPaymentLabel(), value: formatEuro(this.cardPaymentAmount()), icon, positive });
    }
    return rows;
  }

  private signedAmountPrefix(): string {
    const amount = this.op()?.amount ?? 0;
    return amount > 0 ? '+' : amount < 0 ? '-' : '';
  }

  dateTime(operation: { date: string; operationTime?: string; startTime?: string; endTime?: string }): string {
    const time = operation.operationTime ?? operation.endTime ?? operation.startTime;
    return time ? `${operation.date} · ${time}` : operation.date;
  }

  formatFineAmount(amount: number): string {
    return formatEuro(Math.abs(amount));
  }
}
