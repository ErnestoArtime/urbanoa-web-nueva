import { RuntimeStyleDirective } from '../../directives/runtime-style.directive';
import { TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, DestroyRef, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { AppIconComponent } from '../../icons/app-icon.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';

export interface DateRange {
  from: string;
  to: string;
}

@Component({
  selector: 'app-date-range-filter',
  imports: [TranslatePipe, TitleCasePipe, AppIconComponent, RuntimeStyleDirective],
  template: `
    <div class="date-filter">
      @if (!simple()) {
        <div class="date-filter-chips">
          @for (preset of presets; track preset.key) {
            <button type="button" class="chip" [class.chip-active]="activePreset() === preset.key" (click)="applyPreset(preset.key)">
              {{ preset.label | translate }}
            </button>
          }
        </div>
      }
      <div class="date-filter-cal-row">
        @if (!simple()) {
          <button type="button" class="date-filter-toggle" (click)="toggleCalendar()">
            <app-icon name="dateRange" [stroke]="false" />
            <span class="cal-label">{{ 'ops.filterDate' | translate }}</span>
          </button>
        }
        @if ((!simple() && showCalendar()) || simple()) {
          <div class="date-filter-inputs">
            <div class="date-picker-field">
              <span class="date-picker-label">{{ 'ops.from' | translate }}</span>
              <button type="button" class="date-display" (click)="openPicker('from', $event)">
                @if (fromDisplay(); as d) {
                  <span>{{ d }}</span>
                } @else {
                  <span class="date-display-placeholder">{{ 'ops.from' | translate }}</span>
                }
              </button>
            </div>
            <div class="date-picker-field">
              <span class="date-picker-label">{{ 'ops.to' | translate }}</span>
              <button type="button" class="date-display" (click)="openPicker('to', $event)">
                @if (toDisplay(); as d) {
                  <span>{{ d }}</span>
                } @else {
                  <span class="date-display-placeholder">{{ 'ops.to' | translate }}</span>
                }
              </button>
            </div>
            @if (from() || to()) {
              <button type="button" class="date-filter-clear" (click)="clear()">{{ 'ops.clear' | translate }}</button>
            }
          </div>
        }
      </div>
      <div #calendarPopup popover="auto" class="calendar-popup" [appRuntimeStyle]="popupPosition()" (toggle)="onPopupToggle($event)">
        <div class="cal-nav">
          <button type="button" (click)="prevMonth()">‹</button>
          <span class="cal-nav-title">{{ monthLabel() | titlecase }} {{ viewYear() }}</span>
          <button type="button" (click)="nextMonth()">›</button>
        </div>
        <div class="cal-weekdays">
          @for (day of dayHeaders(); track day) {
            <span>{{ day }}</span>
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
    </div>
  `,
  styleUrl: './date-range-filter.component.css',
})
export class DateRangeFilterComponent {
  private readonly popup = viewChild.required<ElementRef<HTMLElement>>('calendarPopup');
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly popupPosition = signal({ left: '0px', '--calendar-top': '0px', width: '260px', '--calendar-max-height': 'calc(100dvh - 16px)' });

  constructor() {
    const dismiss = (event: Event) => {
      if (event.type === 'scroll' && this.popup().nativeElement.contains(event.target as Node)) return;
      this.closePicker();
    };
    window.addEventListener('resize', dismiss);
    document.addEventListener('scroll', dismiss, true);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('resize', dismiss);
      document.removeEventListener('scroll', dismiss, true);
    });
  }

  closePicker(): void {
    this.popup().nativeElement.hidePopover();
    this.pickerTarget.set(null);
  }

  onPopupToggle(event: Event): void {
    if ((event as ToggleEvent).newState === 'closed') this.pickerTarget.set(null);
  }

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
  readonly fromDisplay = computed(() => this.displayDate(this.from()));
  readonly toDisplay = computed(() => this.displayDate(this.to()));
  readonly presets = [
    { key: 'today', label: 'ops.today' },
    { key: 'week', label: 'ops.thisWeek' },
    { key: 'month', label: 'ops.thisMonth' },
  ];

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

  toggleCalendar(): void {
    this.showCalendar.update((v) => !v);
    if (!this.showCalendar()) this.closePicker();
  }

  openPicker(target: 'from' | 'to', event: Event): void {
    const anchor = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.pickerTarget.set(target);
    const popup = this.popup().nativeElement;
    popup.showPopover();
    const gap = 8;
    const width = Math.min(280, window.innerWidth - gap * 2);
    this.popupPosition.set({
      left: '0px',
      '--calendar-top': '0px',
      width: `${width}px`,
      '--calendar-max-height': `${window.innerHeight - gap * 2}px`,
    });
    this.changeDetector.detectChanges();
    const height = popup.getBoundingClientRect().height;
    const below = window.innerHeight - anchor.bottom - gap;
    const above = anchor.top - gap;
    const top = below < height && above > below ? anchor.top - height - gap : anchor.bottom + gap;
    this.popupPosition.update((position) => ({
      ...position,
      left: `${Math.max(gap, Math.min(anchor.left, window.innerWidth - width - gap))}px`,
      '--calendar-top': `${Math.max(gap, Math.min(top, window.innerHeight - height - gap))}px`,
    }));
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
    if (target === 'from') this.from.set(formatted);
    if (target === 'to') this.to.set(formatted);
    this.activePreset.set(null);
    this.closePicker();
    this.rangeChange.emit({ from: this.from(), to: this.to() });
  }

  clear(): void {
    this.from.set('');
    this.to.set('');
    this.activePreset.set(null);
    this.rangeChange.emit({ from: '', to: '' });
  }

  isSelected(day: Date): boolean {
    const ds = this.dateToDmy(day);
    return ds === this.from() || ds === this.to();
  }

  private displayDate(value: string): string {
    if (!value) return '';
    const [day, month, year] = value.split('/');
    const d = new Date(+year, +month - 1, +day);
    return new Intl.DateTimeFormat(this.intlLocale(), { day: 'numeric', month: 'short' }).format(d);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  private isoToDmy(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }

  private dateToDmy(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
