import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { OperationsService } from '../../../core/services/operations.service';
import { OperationType } from '../../../shared/models/operation-type';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { LocationMap } from '../../../shared/components/location-map/location-map';

@Component({
  selector: 'app-operations-detail',
  imports: [DecimalPipe, OperationIconComponent, AppIconComponent, TranslatePipe, DetailPanelHeaderComponent, LocationMap],
  template: `
    <div class="page operation-detail-page">
      <app-detail-panel-header [title]="detailTitle() | translate" backRoute="/app/operations" />
      @if (op(); as operation) {
        @if (operation.type === types.FINE_PAYMENT) {
          <section class="fine-payment-detail">
            <div class="fine-payment-kind">
              <app-operation-icon [type]="operation.type" />
              <strong>{{ 'ops.fineDetail.sanction' | translate }}</strong>
            </div>

            <strong class="fine-payment-amount">{{ formatFineAmount(absoluteAmount()) }} €</strong>

            <div class="fine-payment-method">
              <span>{{ 'ops.detail.paymentMethod' | translate }}</span>
              <strong>{{ finePaymentMethodLabel() }}</strong>
              @if (walletPaymentAmount() > 0) {
                <span>{{ 'ops.detail.wallet' | translate }}</span>
                <strong>−{{ formatFineAmount(walletPaymentAmount()) }} €</strong>
              }
              @if (cardPaymentAmount() > 0) {
                <span>{{ cardPaymentLabel() }}</span>
                <strong>−{{ formatFineAmount(cardPaymentAmount()) }} €</strong>
              }
            </div>

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
          </section>
        } @else {
          <header class="detail-heading">
            <app-operation-icon [type]="operation.type" />
            <div>
              <span>{{ 'ops.detail.title' | translate: { id: id() } }}</span>
              <h1>{{ detailTitle() | translate }}</h1>
            </div>
          </header>
          @if (isTicketOperation()) {
            <div class="ticket-shell">
              <article class="ticket-card">
                <div class="ticket-accent"></div>
                <div class="ticket-header">
                  <app-operation-icon [type]="operation.type" />
                  <div>
                    <strong>{{ operation.plate }}</strong
                    ><span>{{ operation.zone }}</span>
                  </div>
                  <div class="ticket-date">
                    <small>{{ 'ops.detail.date' | translate }}</small
                    ><strong>{{ operation.date }}</strong>
                  </div>
                </div>
                <div class="ticket-timeline">
                  <div>
                    <small>{{ 'ops.detail.start' | translate }}</small
                    ><strong>{{ startTime() }}</strong
                    ><span>{{ operation.date }}</span>
                  </div>
                  <i></i><b>{{ duration() }}</b
                  ><i></i>
                  <div>
                    <small>{{ 'ops.detail.end' | translate }}</small
                    ><strong>{{ endTime() }}</strong
                    ><span>{{ operation.date }}</span>
                  </div>
                </div>
                <div class="ticket-cut"></div>
                <div class="ticket-total">
                  <div>
                    <span>{{ 'ops.detail.total' | translate }}</span
                    ><small>{{ 'ops.detail.paymentMethod' | translate }}</small>
                  </div>
                  <div>
                    <strong>{{ absoluteAmount() | number: '1.2-2' }} €</strong><span>{{ paymentMethodLabel() }}</span>
                  </div>
                </div>
                @if (hasPaymentBreakdown()) {
                  <div class="ticket-payment-breakdown">
                    @if (walletPaymentAmount() > 0) {
                      <p>
                        <span>{{ 'ops.detail.wallet' | translate }}</span
                        ><strong>{{ walletPaymentAmount() | number: '1.2-2' }} €</strong>
                      </p>
                    }
                    @if (cardPaymentAmount() > 0) {
                      <p>
                        <span>{{ cardPaymentLabel() }}</span
                        ><strong>{{ cardPaymentAmount() | number: '1.2-2' }} €</strong>
                      </p>
                    }
                  </div>
                }
              </article>
            </div>
          } @else {
            <article class="info-detail card">
              <div class="transaction">
                <span>{{ 'ops.detail.transactionId' | translate }}</span
                ><strong>{{ transactionId() }}</strong>
              </div>
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
  styles: [
    `
      .operation-detail-page {
        max-width: 760px;
        margin: 0 auto;
        padding: 1.4rem;
      }
      .fine-payment-detail {
        max-width: 560px;
        margin: 0 auto;
        padding: 0.5rem 0 1.5rem;
      }
      .fine-payment-kind {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0.4rem 0 1rem;
      }
      .fine-payment-kind strong {
        font-size: var(--text-base);
      }
      .fine-payment-amount {
        display: block;
        margin-bottom: 0.2rem;
        color: #813832;
        font-size: clamp(1.65rem, 5vw, 2.15rem);
        line-height: 1.1;
      }
      .fine-payment-method {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.2rem 1rem;
        margin-bottom: 1.15rem;
        font-size: var(--text-sm);
      }
      .fine-payment-method strong {
        text-align: right;
        font-weight: var(--font-medium);
      }
      .fine-payment-info {
        display: grid;
        gap: 0.2rem;
      }
      .fine-payment-row {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        align-items: start;
        gap: 0.75rem;
        min-height: 64px;
        padding: 0.65rem 0;
      }
      .fine-payment-row-icon {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        color: var(--color-text);
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
      }
      .fine-payment-row > div {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 0.12rem;
      }
      .fine-payment-row span {
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }
      .fine-payment-row strong {
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
      }
      .fine-payment-location {
        min-height: 72px;
      }
      .fine-payment-location strong {
        text-transform: uppercase;
      }
      .fine-payment-detail app-location-map {
        margin-top: 0.25rem;
      }
      @media (max-width: 600px) {
        .operation-detail-page {
          padding: 0.75rem 1rem 1.5rem;
        }
        .fine-payment-detail {
          padding-top: 0;
        }
      }
      .detail-heading {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 1.2rem;
      }
      .detail-heading > div {
        display: flex;
        flex-direction: column;
      }
      .detail-heading span {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .detail-heading h1 {
        font-size: var(--text-xl);
      }
      .ticket-shell {
        border-radius: 16px;
        filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.14));
      }
      .ticket-card {
        --ticket-notch-r: 10px;
        --ticket-cut-y: 190px;
        position: relative;
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: 16px;
        background: var(--color-surface);
        box-shadow: none;
        -webkit-mask:
          radial-gradient(circle at 0 var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px)) left
            top / 51% 100% no-repeat,
          radial-gradient(circle at 100% var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px))
            right top / 51% 100% no-repeat;
        mask:
          radial-gradient(circle at 0 var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px)) left
            top / 51% 100% no-repeat,
          radial-gradient(circle at 100% var(--ticket-cut-y), transparent 0 var(--ticket-notch-r), #000 calc(var(--ticket-notch-r) + 1px))
            right top / 51% 100% no-repeat;
      }
      .ticket-accent {
        height: 14px;
        border-radius: 16px 16px 0 0;
        background: #248cda;
      }
      .ticket-header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.8rem;
        padding: 1.2rem;
      }
      .ticket-header > div {
        display: flex;
        flex-direction: column;
      }
      .ticket-header > div > strong {
        font-size: var(--text-lg);
      }
      .ticket-header span {
        color: var(--color-text-muted);
      }
      .ticket-date {
        text-align: right;
      }
      .ticket-date small {
        color: var(--color-text-muted);
      }
      .ticket-timeline {
        display: grid;
        grid-template-columns: auto 1fr auto 1fr auto;
        align-items: center;
        gap: 0.7rem;
        padding: 1rem 1.2rem;
        text-align: center;
      }
      .ticket-timeline > div {
        display: flex;
        flex-direction: column;
      }
      .ticket-timeline small,
      .ticket-timeline span {
        color: var(--color-text-muted);
      }
      .ticket-timeline > div strong {
        font-size: var(--text-lg);
      }
      .ticket-timeline i {
        height: 1px;
        background: var(--color-border);
      }
      .ticket-timeline b {
        padding: 0.55rem 0.75rem;
        border: 1px solid var(--color-border);
        border-radius: 10px;
      }
      .ticket-cut {
        position: relative;
        height: 20px;
        display: flex;
        align-items: center;
        margin: 0 calc(var(--ticket-notch-r) + 5px);
        background-image: linear-gradient(to right, rgba(149, 156, 146, 0.62) 50%, transparent 0);
        background-position: center;
        background-repeat: repeat-x;
        background-size: 8px 3px;
      }
      .ticket-total {
        display: flex;
        justify-content: space-between;
        padding: 1rem 1.2rem;
      }
      .ticket-payment-breakdown {
        display: grid;
        gap: 0.35rem;
        padding: 0 1.2rem 1rem;
      }
      .ticket-payment-breakdown p {
        display: flex;
        justify-content: space-between;
        margin: 0;
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }
      .ticket-payment-breakdown strong {
        color: var(--color-text);
      }
      .ticket-total > div {
        display: flex;
        flex-direction: column;
      }
      .ticket-total > div:last-child {
        text-align: right;
      }
      .ticket-total span {
        font-size: var(--text-base);
      }
      .ticket-total strong {
        font-size: var(--text-xl);
      }
      .ticket-total small {
        margin-top: 0.25rem;
        color: var(--color-text-muted);
      }
      .info-detail {
        padding: 1.2rem 1.4rem;
      }
      .transaction {
        display: flex;
        flex-direction: column;
        padding-bottom: 1.1rem;
        border-bottom: 1px solid var(--color-border);
      }
      .transaction span {
        font-size: var(--text-base);
      }
      .transaction strong {
        font-weight: var(--font-medium);
      }
      .info-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 0;
        border-bottom: 1px solid var(--color-border);
      }
      .info-row:last-child {
        border: 0;
      }
      .info-row > div {
        display: flex;
        flex: 1;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
      }
      .info-row span {
        color: var(--color-text-muted);
      }
      .info-row strong {
        text-align: right;
        font-weight: var(--font-bold);
      }
      .info-row strong.positive {
        color: var(--color-primary);
      }
      .row-icon {
        width: 20px;
        height: 20px;
        flex: none;
      }
    `,
  ],
})
export class OperationsDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OperationsService);
  private readonly translationService = inject(TranslationService);
  readonly types = OperationType;
  readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '1')), { initialValue: '1' });
  constructor() {
    void this.service.loadDetail(this.id());
    void this.service.loadReceipt(this.id());
  }
  readonly op = computed(() => {
    this.service.operations();
    return this.service.getOperationById(this.id());
  });
  readonly opType = computed(() => this.op()?.type ?? OperationType.PARKING);
  readonly detailTitle = computed(() => {
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
  readonly startTime = () => this.op()?.startTime ?? (this.opType() === OperationType.PARKING ? '18:36' : '19:40');
  readonly endTime = () => this.op()?.endTime ?? (this.opType() === OperationType.PARKING ? '19:40' : '20:10');
  readonly duration = () => this.op()?.durationLabel ?? (this.opType() === OperationType.PARKING ? '1 h 4 min' : '30 min');
  readonly transactionId = computed(() => `8430${String(370 + Number(this.id()))}`);
  readonly absoluteAmount = computed(() => Math.abs(this.op()?.amount ?? 0));
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
    return this.translationService.translate('ops.detail.wallet');
  });
  readonly finePaymentMethodLabel = computed(() => {
    if (this.walletPaymentAmount() > 0 && this.cardPaymentAmount() > 0) return this.translationService.translate('payment.mixed');
    if (this.cardPaymentAmount() > 0) return this.cardPaymentLabel();
    return this.translationService.translate('ops.detail.wallet');
  });
  readonly fineLocationTitle = computed(() => this.op()?.zoneName || this.op()?.zone || '—');
  readonly fineLocationSubtitle = computed(() => {
    const operation = this.op();
    if (!operation) return '';
    return [operation.sectorName, operation.cityName].filter(Boolean).join(' · ');
  });
  readonly fineCoordinates = computed(() => {
    const operation = this.op();
    if (Number.isFinite(operation?.latitude) && Number.isFinite(operation?.longitude)) {
      return { latitude: operation!.latitude!, longitude: operation!.longitude! };
    }
    return null;
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
        { label: 'ops.detail.plate', value: o.plate ?? '5678 DEF', icon: car, positive: undefined },
        { label: 'ops.detail.datetime', value: this.dateTime(o), icon: calendar, positive: undefined },
        { label: 'ops.detail.totalTime', value: o.durationLabel ?? '5 h 45 min', icon: clock, positive: undefined },
        { label: 'ops.detail.refund', value: `+${this.absoluteAmount().toFixed(2).replace('.', ',')} €`, icon: money, positive: true },
      ];
    if (o.type === OperationType.TOP_UP)
      return [
        { label: 'ops.detail.datetime', value: this.dateTime(o), icon: calendar, positive: undefined },
        { label: 'ops.detail.paymentMethod', value: 'Visa •••• 1234', icon: money, positive: undefined },
        { label: 'ops.detail.recharge', value: `+${this.absoluteAmount().toFixed(2).replace('.', ',')} €`, icon: money, positive: true },
      ];
    if (o.type === OperationType.FINE_PAYMENT)
      return [
        ...(o.fineNumber ? [{ label: 'ops.fineDetail.fineNumber', value: o.fineNumber, icon: calendar, positive: undefined }] : []),
        { label: 'ops.detail.plate', value: o.plate ?? '', icon: car, positive: undefined },
        { label: 'ops.detail.datetime', value: this.dateTime(o), icon: calendar, positive: undefined },
        { label: 'ops.detail.location', value: o.zone ?? '', icon: calendar, positive: undefined },
        { label: 'ops.detail.paymentMethod', value: this.paymentMethodLabel(), icon: money, positive: undefined },
        ...this.paymentRows(money, false),
        { label: 'ops.detail.total', value: `${this.absoluteAmount().toFixed(2).replace('.', ',')} €`, icon: money, positive: undefined },
      ];
    return [
      { label: 'ops.detail.datetime', value: o.date, icon: calendar, positive: undefined },
      ...(o.cardLabel ? [{ label: 'ops.detail.paymentMethod', value: o.cardLabel, icon: money, positive: undefined }] : []),
      {
        label: 'ops.detail.balanceRefund',
        value: `${this.signedAmountPrefix()}${this.absoluteAmount().toFixed(2).replace('.', ',')} €`,
        icon: money,
        positive: o.amount > 0,
      },
    ];
  });

  private paymentRows(icon: 'wallet', positive: boolean | undefined) {
    if (!this.hasPaymentBreakdown()) return [];
    const rows: { label: string; value: string; icon: 'wallet'; positive: boolean | undefined }[] = [];
    if (this.walletPaymentAmount() > 0) {
      rows.push({ label: 'ops.detail.wallet', value: `${this.walletPaymentAmount().toFixed(2).replace('.', ',')} €`, icon, positive });
    }
    if (this.cardPaymentAmount() > 0) {
      rows.push({ label: this.cardPaymentLabel(), value: `${this.cardPaymentAmount().toFixed(2).replace('.', ',')} €`, icon, positive });
    }
    return rows;
  }

  private signedAmountPrefix(): string {
    const amount = this.op()?.amount ?? 0;
    return amount > 0 ? '+' : amount < 0 ? '-' : '';
  }

  dateTime(operation: { date: string; startTime?: string; endTime?: string }): string {
    const time = operation.endTime ?? operation.startTime;
    return time ? `${operation.date} · ${time}` : operation.date;
  }

  formatFineAmount(amount: number): string {
    return Math.abs(amount).toFixed(2).replace('.', ',');
  }
}
