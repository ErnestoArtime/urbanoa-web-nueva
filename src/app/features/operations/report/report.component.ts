import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { OperationType } from '../../../shared/models/operation-type';
import { OperationsService } from '../../../core/services/operations.service';
import { DateRangeFilterComponent, type DateRange } from '../../../shared/components/date-range-filter/date-range-filter.component';
import type { Operation } from '../../../shared/models/operation';
import { OpsApiClient } from '../../../core/api/ops-api-client.service';
import { OpsSessionService } from '../../../core/api/ops-session.service';
import { OPS_ENDPOINTS } from '../../../core/api/ops-endpoints';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { formatOpsDate, formatOpsCalendarDate, parseOpsDate } from '../../../core/utils/ops-date';
import { ReportArtifactService } from '../../../core/services/report-artifact.service';

type ReportRange = 'last7' | 'last14' | 'last30' | 'last6m' | 'last12m' | 'last5y';
type ReportFilterKey = 'parkingOperations' | 'recharges' | 'balanceRefunds' | 'fines';

interface ReportFilterItem {
  key: ReportFilterKey;
  labelKey: string;
  descKey: string;
  types: readonly OperationType[];
}

interface ReportRangeItem {
  key: ReportRange;
  labelKey: string;
  days?: number;
  months?: number;
  years?: number;
}

@Component({
  selector: 'app-report',
  imports: [ReactiveFormsModule, TranslatePipe, DateRangeFilterComponent, LoaderComponent],
  template: `
    <app-loader [visible]="isGenerating()" [message]="'common.loading' | translate" />
    <div class="report-page has-sticky-actions" [formGroup]="form">
      <div class="report-scroll">
        <h1 class="page-title">{{ 'ops.report' | translate }}</h1>
        <p class="page-subtitle">{{ 'ops.report.subtitle' | translate }}</p>

        <section class="report-section">
          <p class="section-label">{{ 'ops.report.rangeTitle' | translate }}</p>

          <label class="toggle-row">
            <div>
              <strong>{{ 'ops.report.customDates' | translate }}</strong>
              <span>{{ 'ops.report.customDatesDesc' | translate }}</span>
            </div>
            <input type="checkbox" formControlName="customDates" />
            <span class="switch"></span>
          </label>

          @if (!customDatesEnabled()) {
            <button type="button" class="range-row" (click)="rangePickerOpen = !rangePickerOpen">
              <span>{{ currentRangeLabel() }}</span>
              <span class="chevron">›</span>
            </button>

            @if (rangePickerOpen) {
              <div class="range-grid card">
                @for (item of ranges; track item.key) {
                  <button type="button" class="range-chip" [class.active]="selectedRange === item.key" (click)="setRange(item.key)">
                    {{ item.labelKey | translate }}
                  </button>
                }
              </div>
            }
          } @else {
            <app-date-range-filter [simple]="true" (rangeChange)="onDateRangeChange($event)" />
            @if (dateRangeError(); as err) {
              <p class="form-error">{{ err | translate }}</p>
            }
          }
        </section>

        <section class="report-section">
          <p class="section-label">{{ 'ops.report.dataTitle' | translate }}</p>

          @for (item of filters; track item.key) {
            <label class="filter-row card">
              <div class="filter-copy">
                <strong>{{ item.labelKey | translate }}</strong>
                <span>{{ item.descKey | translate }}</span>
              </div>
              <input type="checkbox" [formControlName]="item.key" />
              <span class="switch"></span>
            </label>
          }
        </section>
      </div>

      <div class="sticky-actions">
        <button
          type="button"
          class="btn btn-primary btn-block report-submit"
          (click)="generateReport()"
          [disabled]="isGenerating() || !!dateRangeError()"
        >
          {{ isGenerating() ? ('ops.report.generating' | translate) : ('ops.report.generateButton' | translate) }}
        </button>
        @if (reportError()) {
          <p class="form-error" role="alert">{{ 'ops.report.pdfError' | translate }}</p>
        }
      </div>
    </div>
  `,
  styleUrl: './report.component.css',
})
export class ReportComponent {
  private readonly router = inject(Router);
  private readonly operationsService = inject(OperationsService);
  private readonly translationService = inject(TranslationService);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly reportArtifact = inject(ReportArtifactService);

  readonly form = this.fb.nonNullable.group({
    customDates: [false],
    parkingOperations: [true],
    recharges: [true],
    balanceRefunds: [true],
    fines: [true],
  });
  rangePickerOpen = false;
  selectedRange: ReportRange = 'last30';
  fromDate = '';
  toDate = '';
  readonly dateRangeError = signal<string | null>(null);
  readonly ranges: ReportRangeItem[] = [
    { key: 'last7', labelKey: 'ops.report.last7Days', days: 7 },
    { key: 'last14', labelKey: 'ops.report.last14Days', days: 14 },
    { key: 'last30', labelKey: 'ops.report.last30Days', days: 30 },
    { key: 'last6m', labelKey: 'ops.report.last6Months', months: 6 },
    { key: 'last12m', labelKey: 'ops.report.last12Months', months: 12 },
    { key: 'last5y', labelKey: 'ops.report.last5Years', years: 5 },
  ];
  readonly filters: ReportFilterItem[] = [
    {
      key: 'parkingOperations',
      labelKey: 'ops.report.parkingOperations',
      descKey: 'ops.report.parkingOperationsDesc',
      types: [OperationType.PARKING, OperationType.PARKING_EXTENSION, OperationType.REFUND],
    },
    { key: 'recharges', labelKey: 'ops.report.topUps', descKey: 'ops.report.topUpsDesc', types: [OperationType.TOP_UP] },
    {
      key: 'balanceRefunds',
      labelKey: 'ops.report.balanceRefunds',
      descKey: 'ops.report.balanceRefundsDesc',
      types: [OperationType.BALANCE_REFUND],
    },
    { key: 'fines', labelKey: 'ops.report.fines', descKey: 'ops.report.finesDesc', types: [OperationType.FINE_PAYMENT] },
  ];
  readonly isGenerating = signal(false);
  readonly reportError = signal(false);

  readonly reportOperations = () => this.buildFilteredOperations();

  currentRangeLabel(): string {
    const selected = this.ranges.find((item) => item.key === this.selectedRange);
    return this.translationService.translate(selected?.labelKey ?? 'ops.report.last30Days');
  }

  customDatesEnabled(): boolean {
    return this.form.controls.customDates.value;
  }

  isFilterEnabled(key: ReportFilterKey): boolean {
    return this.form.controls[key].value;
  }

  setRange(key: ReportRange): void {
    this.selectedRange = key;
    this.rangePickerOpen = false;
  }

  onDateRangeChange(range: DateRange): void {
    this.fromDate = range.from;
    this.toDate = range.to;
    if (range.from && range.to) {
      const [d, m, y] = range.from.split('/').map(Number);
      const [d2, m2, y2] = range.to.split('/').map(Number);
      const from = new Date(y, m - 1, d);
      const to = new Date(y2, m2 - 1, d2);
      this.dateRangeError.set(from > to ? 'ops.report.dateRangeInvalid' : null);
    } else {
      this.dateRangeError.set(null);
    }
  }

  async generateReport(): Promise<void> {
    if (this.dateRangeError() || this.isGenerating()) return;
    if (this.customDatesEnabled() && (!this.fromDate || !this.toDate)) {
      this.dateRangeError.set('validation.required');
      return;
    }
    this.isGenerating.set(true);
    this.reportError.set(false);
    const viewer = globalThis.open('', '_blank');
    let completed = false;
    try {
      const token = this.session.token();
      if (!token) throw new Error('No hay una sesión OPS activa');
      const range = this.resolveRange();
      const email = this.authService.user().email.trim() || (await this.userService.load()).email.trim();
      if (this.session.token() !== token) throw new Error('Session changed while generating report');
      if (!email) throw new Error('El correo del usuario está vacío');
      const content = await this.api.post<string>(
        OPS_ENDPOINTS.user.report,
        {
          contractId: 0,
          dateStart: this.toBackendDate(range.start),
          dateEnd: this.toBackendDate(range.end),
          operationTypeList: this.filters.filter((filter) => this.isFilterEnabled(filter.key)).flatMap((filter) => filter.types),
          mail: email,
          reportFormat: 1,
        },
        { token },
      );
      if (this.session.token() !== token) throw new Error('Session changed while generating report');
      const pdf = this.base64Pdf(content);
      const url = this.reportArtifact.set(pdf);
      if (viewer) viewer.location.href = url;
      else globalThis.open(url, '_blank');
      completed = true;
    } catch {
      viewer?.close();
      this.reportError.set(true);
    } finally {
      this.isGenerating.set(false);
    }
    if (completed) void this.router.navigate(['/app/operations/report-success']);
  }

  private buildFilteredOperations(): Operation[] {
    const operations = this.operationsService.operations().filter((operation) => operation.type !== OperationType.UNPAID_FINES);
    const range = this.resolveRange();
    return operations
      .filter((operation) => this.isFilterEnabled(this.filterKeyForType(operation.type)))
      .filter((operation) => this.isInRange(operation.date, range.start, range.end))
      .sort((a, b) => this.parseDate(b.date).getTime() - this.parseDate(a.date).getTime());
  }

  private resolveRange(): { start: Date; end: Date } {
    if (this.customDatesEnabled() && this.fromDate && this.toDate) {
      return { start: this.dayBoundary(this.fromDate, false), end: this.dayBoundary(this.toDate, true) };
    }

    const now = this.api.serverNow?.() ?? new Date();
    const [day, month, year] = formatOpsCalendarDate(now).split('/').map(Number);
    const end = new Date(Date.UTC(year, month - 1, day, 12));
    const start = new Date(end);
    const range = this.ranges.find((item) => item.key === this.selectedRange) ?? this.ranges[2];

    if (range.days) {
      start.setUTCDate(start.getUTCDate() - range.days);
    } else {
      // Kotlin LocalDate.minus clamps month/year subtraction to the last valid day.
      const originalDay = start.getUTCDate();
      start.setUTCDate(1);
      start.setUTCMonth(start.getUTCMonth() - (range.months ?? (range.years ?? 0) * 12));
      const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
      start.setUTCDate(Math.min(originalDay, lastDay));
    }

    const calendarDate = (date: Date) =>
      `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
    return { start: this.dayBoundary(calendarDate(start), false), end: this.dayBoundary(calendarDate(end), true) };
  }

  private dayBoundary(value: string, endOfDay: boolean): Date {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) throw new Error('Invalid report calendar date');
    const date = parseOpsDate(`${endOfDay ? '235959' : '000000'}${match[1]}${match[2]}${match[3].slice(-2)}`);
    if (formatOpsCalendarDate(date) !== value) throw new Error('Invalid report calendar date');
    return date;
  }

  private isInRange(date: string, start: Date, end: Date): boolean {
    const value = this.parseDate(date);
    return value >= start && value <= end;
  }

  private filterKeyForType(type: OperationType): ReportFilterKey {
    switch (type) {
      case OperationType.PARKING:
      case OperationType.PARKING_EXTENSION:
      case OperationType.REFUND:
        return 'parkingOperations';
      case OperationType.TOP_UP:
        return 'recharges';
      case OperationType.BALANCE_REFUND:
        return 'balanceRefunds';
      case OperationType.FINE_PAYMENT:
        return 'fines';
      default:
        return 'parkingOperations';
    }
  }

  private parseDate(value: string): Date {
    if (value.includes('-')) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0, 0);
    }
    const [day, month, year] = value.split('/').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  private toBackendDate(value: Date): string {
    return formatOpsDate(value);
  }

  private base64Pdf(content: string): Blob {
    const normalized = content.replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '');
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new Blob([bytes], { type: 'application/pdf' });
  }
}
