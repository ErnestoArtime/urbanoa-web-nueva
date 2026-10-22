import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DateRangeFilterComponent } from './date-range-filter.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('DateRangeFilterComponent popup placement', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DateRangeFilterComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: TranslationService, useValue: { currentLang$: signal('es'), translate: (key: string) => key } },
      ],
    });
  });

  for (const side of ['above', 'below'] as const) {
    it(`keeps the calendar adjacent to the field ${side}, through the runtime stylesheet`, () => {
      const fixture = TestBed.createComponent(DateRangeFilterComponent);
      fixture.componentRef.setInput('simple', true);
      fixture.detectChanges();
      const field = fixture.nativeElement.querySelector('.date-display') as HTMLElement;
      const top = side === 'above' ? window.innerHeight - 70 : 20;
      const anchor = new DOMRect(120, top, 100, 34);
      spyOn(field, 'getBoundingClientRect').and.returnValue(anchor);
      field.click();
      fixture.detectChanges();
      const popup = fixture.nativeElement.querySelector('.calendar-popup') as HTMLElement;
      const rect = popup.getBoundingClientRect();
      expect(popup.matches(':popover-open')).toBeTrue();
      expect(rect.left).toBeCloseTo(anchor.left, 0);
      if (side === 'above') expect(rect.bottom).toBeCloseTo(anchor.top - 8, 0);
      else expect(rect.top).toBeCloseTo(anchor.bottom + 8, 0);
      expect(rect.top).toBeGreaterThanOrEqual(8);
      expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight - 8);
      fixture.componentInstance.closePicker();
      fixture.destroy();
    });
  }
});
