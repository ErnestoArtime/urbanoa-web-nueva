import { provideZonelessChangeDetection, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { OperationsService } from '../../../core/services/operations.service';
import { WalletService } from '../../../core/services/wallet.service';
import { AccountRechargeComponent } from './recharge.component';
import { OpsApiError } from '../../../core/api/ops-api.types';
import { PaymentChallengeService } from '../../../core/services/payment-challenge.service';

describe('AccountRechargeComponent', () => {
  beforeEach(() => sessionStorage.clear());
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { preparePaymentRedirect: jasmine.createSpy('preparePaymentRedirect') } }],
    }),
  );
  it('rejects a selected expired card even when another card is usable', async () => {
    const wallet = TestBed.inject(WalletService);
    wallet.cards.update((cards) => cards.map((card, index) => (index === 0 ? { ...card, expiryDate: '01/20' } : card)));
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

  it('releases loading but blocks repeat charges after timeout, including a new instance of the form', async () => {
    const recharge = jasmine.createSpy().and.resolveTo({ success: false, error: new OpsApiError('timeout', 'recharge', 'timeout') });
    Object.assign(TestBed.inject(WalletService), { recharge });
    const component = mount().componentInstance;
    await component.confirm();
    expect(component.saving()).toBeFalse();
    expect(component.paymentUncertain()).toBeTrue();
    await component.confirm();
    await mount().componentInstance.confirm();
    expect(recharge).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(PaymentChallengeService).hasUncertainPayment()).toBeTrue();
  });

  it('allows a corrected attempt after a definitive business rejection', async () => {
    const recharge = jasmine
      .createSpy()
      .and.resolveTo({ success: false, error: new OpsApiError('backend', 'recharge', 'rejected', 200, { code: -21, type: 1 }) });
    Object.assign(TestBed.inject(WalletService), { recharge });
    const component = mount().componentInstance;
    await component.confirm();
    expect(component.paymentUncertain()).toBeFalse();
    expect(TestBed.inject(PaymentChallengeService).hasPendingPayment()).toBeFalse();
    await component.confirm();
    expect(recharge).toHaveBeenCalledTimes(2);
  });
});
