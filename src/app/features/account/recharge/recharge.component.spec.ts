import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { OperationsService } from '../../../core/services/operations.service';
import { WalletService } from '../../../core/services/wallet.service';
import { AccountRechargeComponent } from './recharge.component';

describe('AccountRechargeComponent', () => {
  it('rejects a selected expired card even when another card is usable', async () => {
    const wallet = TestBed.inject(WalletService);
    wallet.cards.update(cards => cards.map((card, index) => index === 0 ? { ...card, expiryDate: '01/20' } : card));
    const recharge = jasmine.createSpy().and.resolveTo({ success: false });
    Object.assign(wallet, { recharge });
    const fixture = TestBed.createComponent(AccountRechargeComponent);
    await fixture.whenStable();
    fixture.componentInstance.form.controls.cardId.setValue('card-4021');
    await fixture.componentInstance.confirm();
    expect(recharge).not.toHaveBeenCalled();
  });
  let queryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function mount(): ReturnType<typeof TestBed.createComponent<AccountRechargeComponent>> {
    const fixture = TestBed.createComponent(AccountRechargeComponent);
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
    TestBed.overrideComponent(AccountRechargeComponent, { set: { template: '' } });
  });

  it('selects the card from the query and updates when cardId changes on the same route', () => {
    const fixture = mount();

    expect(fixture.componentInstance.selectedCardId()).toBe('card-4021');

    queryParamMap$.next(convertToParamMap({ cardId: 'card-2403' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedCardId()).toBe('card-2403');
  });

  it('calculates the projected balance using cents and keeps two decimal places', () => {
    const fixture = mount();
    TestBed.inject(WalletService).balance.set(22.989999999999995);

    fixture.componentInstance.form.controls.amount.setValue(40);

    expect(fixture.componentInstance.balanceAfterRecharge()).toBe(62.99);
  });
});
