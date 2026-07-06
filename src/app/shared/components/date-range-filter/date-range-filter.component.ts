import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AppIconComponent } from '../../icons/app-icon.component';
import { TranslationService } from '../../../core/services/translation.service';

export interface DateRange {
  from: string;
  to: string;
}

@Component({
  selector: 'app-date-range-filter',
  imports: [TranslatePipe, TitleCasePipe, AppIconComponent],
  template: `
    <div class="date-filter">
      @if (!simple()) {
        <div class="date-filter-chips">
          @for (preset of presets; track preset.key) {
            <span class="chip" [class.chip-active]="activePreset() === preset.key" (click)="applyPreset(preset.key)">
              {{ preset.label | translate }}
            </span>
          }
        </div>
      }
      <div class="date-filter-cal-row">
        @if (!simple()) {
          <button type="button" class="date-filter-toggle" (click)="showCalendar.set(!showCalendar())">
            <app-icon name="dateRange" [stroke]="false" />
            <span class="cal-label">{{ 'ops.filterDate' | translate }}</span>
          </button>
        }
        @if ((!simple() && showCalendar()) || simple()) {
          <div class="date-filter-inputs">
            <div class="date-picker-field">
              <span class="date-picker-label">{{ 'ops.from' | translate }}</span>
              <div class="date-display" (click)="openPicker('from')">
                @if (fromDisplay(); as d) {
                  <span>{{ d }}</span>
                } @else {
                  <span class="date-display-placeholder">{{ 'ops.from' | translate }}</span>
                }
              </div>
            </div>
            <div class="date-picker-field">
              <span class="date-picker-label">{{ 'ops.to' | translate }}</span>
              <div class="date-display" (click)="openPicker('to')">
                @if (toDisplay(); as d) {
                  <span>{{ d }}</span>
                } @else {
                  <span class="date-display-placeholder">{{ 'ops.to' | translate }}</span>
                }
              </div>
            </div>
            @if (from() || to()) {
              <button class="date-filter-clear" (click)="clear()">{{ 'ops.clear' | translate }}</button>
            }
          </div>
        }
      </div>
      @if (pickerTarget()) {
        <div class="calendar-backdrop" (click)="pickerTarget.set(null)"></div>
        <div class="calendar-popup">
          <div class="cal-nav">
            <button type="button" (click)="prevMonth()">‹</button>
            <span class="cal-nav-title">{{ monthLabel() | titlecase }} {{ viewYear() }}</span>
            <button type="button" (click)="nextMonth()">›</button>
          </div>
          <div class="cal-weekdays">
            @for (d of dayHeaders(); track d) {
              <span>{{ d }}</span>
            }
          </div>
          <div class="cal-days">
            @for (day of calendarDays(); track day.getTime()) {
              <button
                type="button"
                class="cal-day"
                [class.cal-day-other]="day.getMonth() !== viewDate().getMonth()"
                [class.cal-day-selected]="isSelected(day)"
                (click)="selectDate(day)"
              >
                {{ day.getDate() }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .date-filter {
        padding: 0.75rem 0;
        position: relative;
      }
      .date-filter-chips {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .chip {
        padding: 0.3rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.8125rem;
        font-weight: var(--font-medium);
        border: 1px solid var(--color-border, #e5e7eb);
        background: var(--color-surface, #fff);
        color: var(--color-secondary);
        cursor: pointer;
        transition: all 0.15s;
      }
      .chip:hover {
        border-color: var(--color-primary, #006a68);
        color: var(--color-primary, #006a68);
      }
      .chip-active {
        background: var(--color-primary, #006a68);
        color: #fff;
        border-color: var(--color-primary, #006a68);
      }
      .date-filter-cal-row {
        display: flex;
        align-items: start;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .date-filter-toggle {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 6px;
        background: var(--color-surface, #fff);
        cursor: pointer;
        font-size: 0.8125rem;
        color: var(--color-secondary);
        transition: border-color 0.15s;
      }
      .date-filter-toggle:hover {
        border-color: var(--color-primary, #006a68);
        color: var(--color-primary, #006a68);
      }
      .cal-icon {
        display: block;
      }
      .cal-label {
        font-weight: var(--font-medium);
      }
      .date-filter-inputs {
        display: flex;
        gap: 0.75rem;
        align-items: end;
        flex-wrap: wrap;
      }
      .date-picker-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .date-picker-label {
        font-size: var(--text-xs);
        color: var(--color-muted, #9ca3af);
      }
      .date-display {
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        cursor: pointer;
        min-width: 7rem;
        background: var(--color-surface, #fff);
        transition: border-color 0.15s;
      }
      .date-display:hover {
        border-color: var(--color-primary, #006a68);
      }
      .date-display-placeholder {
        color: var(--color-muted, #9ca3af);
      }
      .date-filter-clear {
        border: none;
        background: none;
        color: var(--color-primary, #006a68);
        font-size: 0.8125rem;
        font-weight: var(--font-medium);
        cursor: pointer;
        padding: 0.25rem 0.5rem;
      }
      .calendar-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9;
      }
      .calendar-popup {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 10;
        background: var(--color-surface, #fff);
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        padding: 0.75rem;
        width: 260px;
        margin-top: 0.25rem;
      }
      .cal-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }
      .cal-nav button {
        border: none;
        background: none;
        font-size: var(--text-xl);
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        color: var(--color-secondary);
        line-height: var(--line-tight);
      }
      .cal-nav button:hover {
        color: var(--color-primary, #006a68);
      }
      .cal-nav-title {
        font-weight: var(--font-medium);
        font-size: 0.875rem;
      }
      .cal-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        font-size: var(--text-2xs);
        font-weight: var(--font-medium);
        color: var(--color-muted, #9ca3af);
        margin-bottom: 0.25rem;
      }
      .cal-days {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
      }
      .cal-day {
        border: none;
        background: none;
        padding: 0.35rem 0;
        font-size: 0.8125rem;
        cursor: pointer;
        border-radius: 4px;
        text-align: center;
        color: var(--color-text, #111);
      }
      .cal-day:hover {
        background: var(--color-primary, #006a68);
        color: #fff;
      }
      .cal-day-other {
        color: var(--color-muted, #ccc);
      }
      .cal-day-selected {
        background: var(--color-primary, #006a68);
        color: #fff;
        font-weight: var(--font-medium);
      }
    `,
  ],
})
export class DateRangeFilterComponent {
  private readonly translationService = inject(TranslationService);

  readonly simple = input(false);
  readonly from = signal('');
  readonly to = signal('');
  readonly showCalendar = signal(false);
  readonly rangeChange = output<DateRange>();
  readonly activePreset = signal<string | null>(null);

  readonly pickerTarget = signal<'from' | 'to' | null>(null);
  readonly viewDate = signal(new Date());

  private readonly intlLocale = computed(() => {
    const lang = this.translationService.currentLang$();
    const map: Record<string, string> = { es: 'es-ES', eu: 'eu', fr: 'fr-FR', uk: 'en-GB' };
    return map[lang] ?? 'es-ES';
  });

  readonly dayHeaders = computed(() => {
    const f = new Intl.DateTimeFormat(this.intlLocale(), { weekday: 'short' });
    const sun = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sun);
      d.setDate(sun.getDate() + i);
      return f.format(d);
    });
  });

  readonly monthLabel = computed(() => new Intl.DateTimeFormat(this.intlLocale(), { month: 'long' }).format(this.viewDate()));

  readonly viewYear = computed(() => this.viewDate().getFullYear());

  readonly calendarDays = computed(() => {
    const d = new Date(this.viewDate().getFullYear(), this.viewDate().getMonth(), 1);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(d);
      day.setDate(d.getDate() + i);
      return day;
    });
  });

  readonly fromDisplay = computed(() => {
    const v = this.from();
    if (!v) return '';
    const [day, month, year] = v.split('/');
    const d = new Date(+year, +month - 1, +day);
    return new Intl.DateTimeFormat(this.intlLocale(), { day: 'numeric', month: 'short' }).format(d);
  });

  readonly toDisplay = computed(() => {
    const v = this.to();
    if (!v) return '';
    const [day, month, year] = v.split('/');
    const d = new Date(+year, +month - 1, +day);
    return new Intl.DateTimeFormat(this.intlLocale(), { day: 'numeric', month: 'short' }).format(d);
  });

  readonly presets = [
    { key: 'today', label: 'ops.today' },
    { key: 'week', label: 'ops.thisWeek' },
    { key: 'month', label: 'ops.thisMonth' },
  ];

  private readonly today = () => new Date().toISOString().slice(0, 10);
  private readonly daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };

  applyPreset(key: string): void {
    if (this.activePreset() === key) {
      this.activePreset.set(null);
      this.from.set('');
      this.to.set('');
      this.rangeChange.emit({ from: '', to: '' });
      return;
    }
    this.activePreset.set(key);
    const today = this.today();
    let isoFrom = '';
    let isoTo = '';
    switch (key) {
      case 'today':
        isoFrom = today;
        isoTo = today;
        break;
      case 'week':
        isoFrom = this.daysAgo(6);
        isoTo = today;
        break;
      case 'month':
        isoFrom = this.daysAgo(29);
        isoTo = today;
        break;
    }
    this.from.set(this.isoToDmy(isoFrom));
    this.to.set(this.isoToDmy(isoTo));
    this.rangeChange.emit({ from: this.from(), to: this.to() });
  }

  private readonly isoToDmy = (iso: string): string => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  };

  toggleCalendar(): void {
    this.showCalendar.update((v) => !v);
    if (!this.showCalendar()) {
      this.pickerTarget.set(null);
    }
  }

  openPicker(target: 'from' | 'to'): void {
    this.pickerTarget.set(target);
  }

  prevMonth(): void {
    this.viewDate.update((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    this.viewDate.update((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  selectDate(d: Date): void {
    const formatted = this.dateToDmy(d);
    const target = this.pickerTarget();
    if (target === 'from') {
      this.from.set(formatted);
    } else if (target === 'to') {
      this.to.set(formatted);
    }
    this.activePreset.set(null);
    this.pickerTarget.set(null);
    this.rangeChange.emit({ from: this.from(), to: this.to() });
  }

  isSelected(day: Date): boolean {
    const ds = this.dateToDmy(day);
    return ds === this.from() || ds === this.to();
  }

  private readonly dateToDmy = (d: Date): string => {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  clear(): void {
    this.from.set('');
    this.to.set('');
    this.activePreset.set(null);
    this.pickerTarget.set(null);
    this.rangeChange.emit({ from: '', to: '' });
  }
}
