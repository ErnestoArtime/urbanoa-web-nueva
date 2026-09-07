import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { OperationsService } from '../../../core/services/operations.service';
import { WalletService } from '../../../core/services/wallet.service';
import { AccountRefundComponent } from './refund.component';

describe('AccountRefundComponent', () => {
  let queryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function mount(): ReturnType<typeof TestBed.createComponent<AccountRefundComponent>> {
    const fixture = TestBed.createComponent(AccountRefundComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    queryParamMap$ = new BehaviorSubject(convertToParamMap({ cardId: 'card-4021' }));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: WalletService,
          useValue: {
            source: signal('remote'),
            balance: signal(2),
            cards: signal([
              { id: 'card-4021', brand: 'VISA', last4: '4021', expiryDate: '2027/05', cardholderName: 'Test' },
              { id: 'card-2403', brand: 'VISA', last4: '2403', expiryDate: '2027/05', cardholderName: 'test2' },
            ]),
            defaultCardId: signal('card-4021'),
            defaultCard: () => ({ id: 'card-4021', brand: 'VISA', last4: '4021', expiryDate: '2027/05', cardholderName: 'Test' }),
          },
        },
        { provide: OperationsService, useValue: { load: jasmine.createSpy().and.resolveTo() } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: queryParamMap$.value }, queryParamMap: queryParamMap$.asObservable() },
        },
      ],
    });
    TestBed.overrideComponent(AccountRefundComponent, { set: { template: '' } });
  });

  it('selects the card from the query and updates when cardId changes on the same route', () => {
    const fixture = mount();

    expect(fixture.componentInstance.selectedCardId()).toBe('card-4021');

    queryParamMap$.next(convertToParamMap({ cardId: 'card-2403' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedCardId()).toBe('card-2403');
  });
});
