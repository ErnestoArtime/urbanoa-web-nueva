import { Component, computed, inject, OnInit, DestroyRef, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Operation } from '../../../shared/models/operation';
import { normalizeSectorColor } from '../../../shared/utils/sector-color';
import { parseOpsDate, opsRelativeDayLabel } from '../../../core/utils/ops-date';
import { TranslationService } from '../../../core/services/translation.service';
import { ParkingFlowQuery, readParkingFlowQuery } from '../parking-flow.model';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { OperationType } from '../../../shared/models/operation-type';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { OperationsService } from '../../../core/services/operations.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { WalletService } from '../../../core/services/wallet.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-parking-success',
  imports: [RouterLink, OperationIconComponent, TranslatePipe, AppIconComponent, LoaderComponent],
  template: `
    <app-loader [visible]="loadingReceipt()" [message]="'common.loading' | translate" />
    <div class="page success-page">
      <div class="success-content text-center">
        @if (receipt()) {
          <div class="success-mark"><span>✓</span><app-icon name="parkingSlip" [stroke]="false" /></div>
          <h1 class="page-title">{{ (isExtension() ? 'parking.extension.success.title' : 'parking.success.title') | translate }}</h1>
          <p class="page-subtitle">{{ (isExtension() ? 'parking.extension.success.subtitle' : 'parking.success.subtitle') | translate }}</p>
          <div class="success-ticket-shell">
            <article class="success-ticket">
              <div class="ticket-accent" [style.background]="sectorColor()"></div>
              <div class="ticket-head">
                <app-operation-icon [type]="parkingType()" />
                <div>
                  <strong>{{ query().plate }}</strong
                  ><span>{{ query().zone }} · {{ query().cityName }}</span>
                  @if (query().tariff) {
                    <small>{{ query().tariff }}</small>
                  }
                </div>
              </div>
              <div class="ticket-times">
                <div>
                  <small>{{ 'parking.success.start' | translate }}</small
                  ><strong>{{ startTime() }}</strong
                  ><span>{{ startDayLabel() }}</span>
                </div>
                <i></i
                ><b
                  >{{ query().duration }}<small class="countdown">{{ countdown() }}</small></b
                ><i></i>
                <div>
                  <small>{{ 'parking.success.end' | translate }}</small
                  ><strong>{{ query().endTime }}</strong
                  ><span>{{ endDayLabel() }}</span>
                </div>
              </div>
              <div class="ticket-cut"><div class="ticket-cut-line"></div></div>
              <div class="ticket-total">
                <span>{{ 'parking.success.total' | translate }}</span
                ><strong>{{ isFreeTicket() ? ('parking.tickets.free' | translate) : query().amount }}</strong>
              </div>
            </article>
          </div>
        } @else {
          <h1 class="page-title">{{ 'parking.success.receiptPending' | translate }}</h1>
          <p role="status">{{ 'parking.success.receiptPendingDetail' | translate }}</p>
          <button class="btn btn-secondary" [disabled]="loadingReceipt()" (click)="loadReceipt()">{{ 'common.retry' | translate }}</button>
        }
        <div class="actions">
          <a routerLink="/app/home" class="btn btn-primary btn-block">{{ 'parking.success.goHome' | translate }}</a>
          <a routerLink="/app/parking" [queryParams]="{ city: query().city }" class="btn btn-ghost btn-block">{{
            'parking.success.viewMap' | translate
          }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .success-page {
        width: 100%;
        max-width: none;
        min-height: 100%;
        display: flex;
        justify-content: center;
        padding: 2rem;
      }
      .success-content {
        width: min(100%, 680px);
        margin: 0 auto;
      }
      .flow-step {
        color: var(--color-primary);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .success-mark {
        position: relative;
        width: 82px;
        height: 82px;
        margin: 0 auto 1rem;
        border-radius: 50%;
        background: #a8e9e7;
        display: grid;
        place-items: center;
      }
      .success-mark span {
        position: absolute;
        right: 4px;
        top: -8px;
        color: var(--color-primary);
        font-size: var(--text-display);
        font-weight: var(--font-extra);
      }
      .success-mark svg {
        width: 44px;
        height: 44px;
        fill: none;
        stroke: var(--color-text);
        stroke-width: 1.8;
      }
      .success-ticket-shell {
        width: 100%;
        margin-top: 1.2rem;
        border-radius: 16px;
        filter: drop-shadow(0 3px 8px rgba(28, 44, 39, 0.07));
      }
      .success-ticket {
        --ticket-notch-r: 10px;
        --ticket-cut-y: 176px;
        position: relative;
        overflow: hidden;
        width: 100%;
        border: 1px solid var(--color-border);
        border-radius: 16px;
        background: var(--color-surface);
        box-shadow: none;
        text-align: left;
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
        background: var(--color-primary);
      }
      .ticket-head {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 1rem 1.2rem;
      }
      .ticket-head > div {
        display: flex;
        flex-direction: column;
      }
      .ticket-head strong {
        font-size: var(--text-lg);
      }
      .ticket-head span {
        color: var(--color-text-muted);
      }
      .ticket-times {
        display: grid;
        grid-template-columns: auto 1fr auto 1fr auto;
        align-items: center;
        gap: 0.65rem;
        padding: 0.8rem 1.2rem;
        text-align: center;
      }
      .ticket-times > div {
        display: flex;
        flex-direction: column;
      }
      .ticket-times small,
      .ticket-times span {
        color: var(--color-text-muted);
      }
      .ticket-times strong {
        font-size: var(--text-lg);
      }
      .ticket-times i {
        height: 1px;
        background: var(--color-border);
      }
      .ticket-times b {
        display: grid;
        gap: 0.25rem;
        padding: 0.5rem 0.7rem;
        border: 1px solid var(--color-border);
        border-radius: 10px;
      }
      .ticket-times .countdown {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        font-weight: var(--font-normal);
      }
      .ticket-cut {
        position: relative;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 calc(var(--ticket-notch-r) + 5px);
      }
      .ticket-cut-line {
        flex: 1;
        height: 0;
        border-top: 3px dashed var(--color-border);
      }
      .ticket-total {
        display: flex;
        justify-content: space-between;
        padding: 0.9rem 1.2rem;
        font-size: var(--text-xl);
      }
      .ticket-total strong {
        font-size: var(--text-xl);
      }
      .actions {
        width: min(100%, 500px);
        margin: 1rem auto 0;
        display: grid;
        gap: 0.4rem;
      }
      @media (max-width: 959px) {
        .success-page {
          padding: 1.25rem 1rem;
        }
        .success-content {
          width: 100%;
        }
      }
    `,
  ],
})
export class ParkingSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translations = inject(TranslationService);
  private readonly operations = inject(OperationsService);
  private readonly vehicles = inject(VehicleService);
  private readonly wallet = inject(WalletService);
  private readonly initialQuery = readParkingFlowQuery(this.route);
  readonly receipt = signal<Operation | null>(null);
  readonly loadingReceipt = signal(false);
  readonly now = signal(Date.now());
  readonly sectorColor = computed(() => normalizeSectorColor(this.receipt()?.sectorColor));
  readonly query = computed(() => {
    const receipt = this.receipt();
    return {
      ...this.initialQuery,
      plate: receipt?.plate ?? '',
      zone: receipt?.sectorName || receipt?.zone || '',
      cityName: receipt?.cityName || receipt?.contractName || '',
      tariff: receipt?.ticketName || this.initialQuery.tariff || '',
      startTime: receipt?.startTime || '',
      endTime: receipt?.endTime || '',
      duration: receipt?.durationLabel || '',
      amount: receipt ? new Intl.NumberFormat(this.locale(), { style: 'currency', currency: 'EUR' }).format(Math.abs(receipt.amount)) : '',
    } as ParkingFlowQuery;
  });
  readonly isExtension = computed(() => this.query().mode === 'extension');
  readonly parkingType = computed(() => (this.isExtension() ? OperationType.PARKING_EXTENSION : OperationType.PARKING));
  readonly isFreeTicket = computed(() => !!this.receipt() && Math.abs(this.receipt()!.amount) < 0.005);

  async ngOnInit(): Promise<void> {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
    await this.loadReceipt();
  }

  async loadReceipt(): Promise<void> {
    if (this.loadingReceipt()) return;
    this.loadingReceipt.set(true);
    try {
      const retryDelaysMs = [0, 500, 1_500, 3_000];
      for (const delayMs of retryDelaysMs) {
        if (delayMs) await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
        await Promise.all([this.operations.load(), this.wallet.load()]);
        const id = this.initialQuery['operationId'];
        const matches = this.operations
          .operations()
          .filter(
            (operation) =>
              !!id &&
              (operation.id === id || operation.operationNumber === id) &&
              operation.type === this.parkingType() &&
              (!this.initialQuery.cityId || operation.contractId === Number(this.initialQuery.cityId)),
          );
        if (this.operations.source() === 'remote' && matches.length === 1) {
          this.receipt.set(matches[0]);
          this.operations.syncActiveParkingsFromOperations(this.vehicles.vehicles());
          return;
        }
      }
      this.receipt.set(null);
      this.operations.syncActiveParkingsFromOperations(this.vehicles.vehicles());
    } catch {
      this.receipt.set(null);
    } finally {
      this.loadingReceipt.set(false);
    }
  }

  startTime(): string {
    return this.receipt()?.startTime || '';
  }

  startDayLabel(): string {
    return this.dayLabel(this.parkingDate('start'));
  }

  endDayLabel(): string {
    return this.dayLabel(this.parkingDate('end'));
  }

  readonly countdown = computed(() => {
    const start = this.parkingDate('start');
    const end = this.parkingDate('end');
    if (!start || !end) return '';
    const countdownFrom = Math.max(this.now(), start.getTime());
    const remaining = Math.max(0, Math.ceil((end.getTime() - countdownFrom) / 1000));
    return [Math.floor(remaining / 3600), Math.floor((remaining % 3600) / 60), remaining % 60]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  });

  private parkingDate(part: 'start' | 'end'): Date | null {
    const receipt = this.receipt();
    const day = part === 'start' ? receipt?.startDate : receipt?.endDate;
    const time = part === 'start' ? receipt?.startTime : receipt?.endTime;
    if (!day || !time) return null;
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(day);
    const date = match ? parseOpsDate(`${time.replace(':', '')}00${match[1]}${match[2]}${match[3].slice(-2)}`) : parseOpsDate(day);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  private dayLabel(date: Date | null): string {
    if (!date) return '';
    const label = opsRelativeDayLabel(date, new Date(this.now()));
    return label.startsWith('ops.')
      ? this.translations.translate(label)
      : new Intl.DateTimeFormat(this.locale(), { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  private locale(): string {
    return this.translations.currentLang$() === 'uk' ? 'en-GB' : this.translations.currentLang$();
  }
}
