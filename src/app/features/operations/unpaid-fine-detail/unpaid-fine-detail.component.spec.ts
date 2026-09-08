import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { UnpaidFineDetailComponent } from './unpaid-fine-detail.component';
import { OperationsService } from '../../../core/services/operations.service';
import { UnpaidFinesService, UnpaidFine, FineStatus } from '../../../core/services/unpaid-fines.service';
import { WalletService } from '../../../core/services/wallet.service';
import { TranslationService } from '../../../core/services/translation.service';

describe('UnpaidFineDetailComponent navigation', () => {
  it('updates the selection and amounts when the route or loaded data changes', async () => {
    const params = new BehaviorSubject(convertToParamMap({ id: 'first' }));
    const fines = signal<UnpaidFine[]>([]);
    const loadDetail = jasmine.createSpy('loadDetail').and.resolveTo(undefined);
    await TestBed.configureTestingModule({
      imports: [UnpaidFineDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        { provide: OperationsService, useValue: { loadDetail } },
        { provide: UnpaidFinesService, useValue: { getFine: (id: string) => fines().find((fine) => fine.id === id) } },
        { provide: WalletService, useValue: { defaultCardId: () => '', balance: signal(50), cards: signal([]) } },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(UnpaidFineDetailComponent);
    await fixture.whenStable();
    const fine: UnpaidFine = {
      id: 'first',
      fineNumber: 'first',
      plate: '1234ABC',
      date: '08/09/2026',
      amount: '30,00 €',
      amountValue: 30,
      status: FineStatus.PAYABLE,
      location: 'Zone',
      contractId: 1,
    };
    fines.set([fine, { ...fine, id: 'second', plate: '5678DEF', amountValue: 60 }]);
    await fixture.whenStable();
    expect(fixture.componentInstance.numericAmount()).toBe(30);
    expect(fixture.nativeElement.textContent).toContain('1234ABC');
    params.next(convertToParamMap({ id: 'second' }));
    await fixture.whenStable();
    expect(fixture.componentInstance.numericAmount()).toBe(60);
    expect(fixture.nativeElement.textContent).toContain('5678DEF');
    expect(fixture.nativeElement.textContent).not.toContain('1234ABC');
    expect(fixture.nativeElement.querySelector('app-location-map')).toBeNull();
    expect(loadDetail.calls.allArgs()).toEqual([['first'], ['second']]);
  });
});
