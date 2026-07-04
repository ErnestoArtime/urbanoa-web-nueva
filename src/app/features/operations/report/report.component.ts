import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { OperationType, OPERATION_TYPE_LABELS } from '../../../shared/models/operation-type';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { OperationsService } from '../../../core/services/operations.service';
import { DateRangeFilterComponent, type DateRange } from '../../../shared/components/date-range-filter/date-range-filter.component';
import type { Operation } from '../../../shared/models/operation';

type ReportRange = 'last7' | 'last14' | 'last30' | 'last6m' | 'last12m' | 'last5y';
type ReportFilterKey = 'parks' | 'extends' | 'refunds' | 'recharges' | 'balanceRefunds' | 'fines';

interface ReportFilterItem {
  key: ReportFilterKey;
  labelKey: string;
  descKey: string;
  type: OperationType;
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
  imports: [FormsModule, TranslatePipe, DateRangeFilterComponent],
  template: `
    <div class="report-page has-sticky-actions">
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
            <input type="checkbox" [(ngModel)]="customDates" />
            <span class="switch"></span>
          </label>

          @if (!customDates) {
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
              <input type="checkbox" [ngModel]="isFilterEnabled(item.key)" (ngModelChange)="setFilter(item.key, $event)" />
              <span class="switch"></span>
            </label>
          }
        </section>
      </div>

      <div class="sticky-actions">
        <button type="button" class="btn btn-primary btn-block report-submit" (click)="generateReport()" [disabled]="isGenerating()">
          {{ isGenerating() ? ('ops.report.generating' | translate) : ('ops.report.generateButton' | translate) }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .report-page { display:flex; flex-direction:column; height:100%; padding:0.9rem 1rem 1.25rem; }
    .report-scroll { flex:1; overflow-y:auto; padding:0 0 .5rem; }
    .report-submit { flex-shrink:0; margin-top:1.1rem; }
    .page-subtitle { color: var(--color-text-muted); margin-bottom: 1rem; }
    .report-section { margin-top: 1rem; }
    .section-label { margin:0 0 .55rem; color:var(--color-text); font-size: var(--text-xs); font-weight: var(--font-extra); text-transform:uppercase; letter-spacing:.06em; }
    .toggle-row, .filter-row, .range-row {
      display:grid;
      grid-template-columns:1fr auto auto;
      align-items:center;
      gap:.8rem;
      width:100%;
      border:1px solid var(--color-border);
      border-radius:18px;
      background:var(--color-surface);
      padding:.9rem 1rem;
      box-shadow:var(--shadow-sm);
    }
    .toggle-row, .filter-row { margin-bottom:.75rem; position:relative; overflow:hidden; }
    .toggle-row strong, .filter-copy strong { display:block; font-size: var(--text-base) }
    .toggle-row span, .filter-copy span { display:block; margin-top:.2rem; color:var(--color-text-muted); font-size: var(--text-sm); line-height: var(--line-normal); }
    .filter-copy { padding-right:.5rem; }
    .toggle-row input, .filter-row input { position:absolute; inset:auto 1rem auto auto; opacity:0; pointer-events:none; }
    .switch {
      width:3.1rem; height:1.85rem; border-radius:999px; background:#cbbfd0;
      border:2px solid rgba(77,67,89,.35); position:relative; flex:none; transition:background .2s ease;
    }
    .switch::after {
      content:''; position:absolute; top:50%; left:.18rem; width:1.18rem; height:1.18rem;
      border-radius:50%; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,.25);
      transform:translateY(-50%); transition:transform .2s ease, background .2s ease;
    }
    .toggle-row input:checked + .switch, .filter-row input:checked + .switch { background:var(--color-primary); border-color:var(--color-primary); }
    .toggle-row input:checked + .switch::after, .filter-row input:checked + .switch::after { transform:translate(1.25rem,-50%); }
    .range-row { grid-template-columns:1fr auto; text-align:left; margin-bottom:.75rem; cursor:pointer; }

    .range-grid { display:grid; grid-template-columns:1fr 1fr; gap:.55rem; margin-bottom:.9rem; }
    .range-chip {
      padding:.7rem .8rem; border-radius:14px; border:1px solid var(--color-border);
      background:var(--color-background); color:var(--color-text); text-align:left; font-weight: var(--font-bold);
    }
    .range-chip.active { background:rgba(93,154,150,.16); border-color:var(--color-primary); color:var(--color-primary-dark); }
    .chevron { color:var(--color-text-muted); font-size: var(--text-lg); }
  `],
})
export class ReportComponent {
  private readonly router = inject(Router);
  private readonly operationsService = inject(OperationsService);
  private readonly translationService = inject(TranslationService);

  customDates = false;
  rangePickerOpen = false;
  selectedRange: ReportRange = 'last30';
  fromDate = '';
  toDate = '';
  readonly ranges: ReportRangeItem[] = [
    { key: 'last7', labelKey: 'ops.report.last7Days', days: 7 },
    { key: 'last14', labelKey: 'ops.report.last14Days', days: 14 },
    { key: 'last30', labelKey: 'ops.report.last30Days', days: 30 },
    { key: 'last6m', labelKey: 'ops.report.last6Months', months: 6 },
    { key: 'last12m', labelKey: 'ops.report.last12Months', months: 12 },
    { key: 'last5y', labelKey: 'ops.report.last5Years', years: 5 },
  ];
  readonly filters: ReportFilterItem[] = [
    { key: 'parks', labelKey: 'ops.report.parking', descKey: 'ops.report.parkingDesc', type: OperationType.PARKING },
    { key: 'extends', labelKey: 'ops.report.extension', descKey: 'ops.report.extensionDesc', type: OperationType.PARKING_EXTENSION },
    { key: 'refunds', labelKey: 'ops.report.refunds', descKey: 'ops.report.refundsDesc', type: OperationType.REFUND },
    { key: 'recharges', labelKey: 'ops.report.topUps', descKey: 'ops.report.topUpsDesc', type: OperationType.TOP_UP },
    { key: 'balanceRefunds', labelKey: 'ops.report.balanceRefunds', descKey: 'ops.report.balanceRefundsDesc', type: OperationType.BALANCE_REFUND },
    { key: 'fines', labelKey: 'ops.report.fines', descKey: 'ops.report.finesDesc', type: OperationType.FINE_PAYMENT },
  ];
  private readonly filterState: Record<ReportFilterKey, boolean> = {
    parks: true,
    extends: true,
    refunds: true,
    recharges: true,
    balanceRefunds: true,
    fines: true,
  };
  readonly isGenerating = signal(false);
  readonly reportHtml = signal<string | null>(null);

  readonly reportOperations = () => this.buildFilteredOperations();

  currentRangeLabel(): string {
    const selected = this.ranges.find((item) => item.key === this.selectedRange);
    return this.translationService.translate(selected?.labelKey ?? 'ops.report.last30Days');
  }

  isFilterEnabled(key: ReportFilterKey): boolean {
    return this.filterState[key];
  }

  setFilter(key: ReportFilterKey, value: boolean): void {
    this.filterState[key] = value;
  }

  setRange(key: ReportRange): void {
    this.selectedRange = key;
    this.rangePickerOpen = false;
  }

  onDateRangeChange(range: DateRange): void {
    this.fromDate = range.from;
    this.toDate = range.to;
  }

  private buildReportHtml(operations: Operation[]): string {
    const rows = operations.map(op => `
      <tr>
        <td>${this.translationService.translate(OPERATION_TYPE_LABELS[op.type])}</td>
        <td>${op.plate ?? '—'}</td>
        <td>${op.date}</td>
        <td style="text-align:right">${op.amount > 0 ? '+' : ''}${op.amount.toFixed(2)} €</td>
      </tr>`).join('');

    const total = operations.reduce((sum, item) => sum + item.amount, 0);
    const title = this.translationService.translate('ops.report');

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 2rem; color: #222; }
  h1 { font-size: var(--text-2xl); margin-bottom: 0.25rem; }
  .sub { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th { text-align: left; padding: 0.5rem; background: #f5f5f5; font-weight: var(--font-medium); }
  td { padding: 0.5rem; border-bottom: 1px solid #eee; }
  .total { margin-top: 1.5rem; font-weight: var(--font-bold); font-size: var(--text-base); text-align: right; }
  .footer { margin-top: 2rem; font-size: var(--text-xs); color: #999; text-align: center; }
</style></head>
<body>
  <h1>${title}</h1>
  <p class="sub">${this.translationService.translate('ops.report.generatedOn')} ${new Date().toLocaleDateString('es-ES')}</p>
  <table>
    <thead><tr><th>${this.translationService.translate('ops.report.operation')}</th><th>${this.translationService.translate('ops.report.plate')}</th><th>${this.translationService.translate('ops.report.date')}</th><th style="text-align:right">${this.translationService.translate('ops.report.amount')}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="total">${this.translationService.translate('ops.report.total')}: ${total > 0 ? '+' : ''}${total.toFixed(2)} €</p>
  <p class="footer">${APP_BRAND.name} — ${this.translationService.translate('ops.report.generatedFromApp')}</p>
</body></html>`;
  }

  generateReport(): void {
    this.isGenerating.set(true);
    const operations = this.buildFilteredOperations();
    const html = this.buildReportHtml(operations);
    this.reportHtml.set(html);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    globalThis.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    this.isGenerating.set(false);
    this.router.navigate(['/app/operations/report-success']);
  }

  private buildFilteredOperations(): Operation[] {
    const operations = this.operationsService.operations().filter((operation) => operation.type !== OperationType.UNPAID_FINES);
    const range = this.resolveRange();
    return operations
      .filter((operation) => this.filterState[this.filterKeyForType(operation.type)])
      .filter((operation) => this.isInRange(operation.date, range.start, range.end))
      .sort((a, b) => this.parseDate(b.date).getTime() - this.parseDate(a.date).getTime());
  }

  private resolveRange(): { start: Date; end: Date } {
    if (this.customDates && this.fromDate && this.toDate) {
      return { start: this.parseDate(this.fromDate), end: this.parseDate(this.toDate) };
    }

    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const start = new Date(end);
    const range = this.ranges.find((item) => item.key === this.selectedRange) ?? this.ranges[2];

    if (range.days) {
      start.setDate(start.getDate() - (range.days - 1));
    } else if (range.months) {
      start.setMonth(start.getMonth() - range.months);
      start.setDate(start.getDate() + 1);
    } else if (range.years) {
      start.setFullYear(start.getFullYear() - range.years);
      start.setDate(start.getDate() + 1);
    }

    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  private isInRange(date: string, start: Date, end: Date): boolean {
    const value = this.parseDate(date);
    return value >= start && value <= end;
  }

  private filterKeyForType(type: OperationType): ReportFilterKey {
    switch (type) {
      case OperationType.PARKING:
        return 'parks';
      case OperationType.PARKING_EXTENSION:
        return 'extends';
      case OperationType.REFUND:
        return 'refunds';
      case OperationType.TOP_UP:
        return 'recharges';
      case OperationType.BALANCE_REFUND:
        return 'balanceRefunds';
      case OperationType.FINE_PAYMENT:
        return 'fines';
      default:
        return 'parks';
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

}
