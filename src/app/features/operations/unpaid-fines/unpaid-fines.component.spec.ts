import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FineStatus, UnpaidFine, UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { TranslationService } from '../../../core/services/translation.service';
import { UnpaidFinesComponent } from './unpaid-fines.component';

describe('UnpaidFinesComponent', () => {
  let fixture: ComponentFixture<UnpaidFinesComponent>;

  beforeEach(async () => {
    const fine: UnpaidFine = {
      id: '1234567',
      fineNumber: '1234567',
      plate: '1234 ABC',
      date: '02/09/2026',
      amount: '30,00 €',
      amountValue: 30,
      status: FineStatus.PAYABLE,
      location: 'ZONA 1 · Z1 ALTA ROTACION',
      contractId: 1,
    };

    await TestBed.configureTestingModule({
      imports: [UnpaidFinesComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: UnpaidFinesService, useValue: { fines: signal([fine]) } },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnpaidFinesComponent);
    fixture.detectChanges();
  });

  it('shows the fine date without exposing a numeric translation key', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('02/09/2026');
    expect(text).not.toContain('ops.fineDetail.status.1');
  });
});
