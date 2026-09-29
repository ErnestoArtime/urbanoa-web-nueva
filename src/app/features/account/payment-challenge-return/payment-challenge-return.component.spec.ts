import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { OperationsService } from '../../../core/services/operations.service';
import { PaymentChallengeService } from '../../../core/services/payment-challenge.service';
import { WalletService } from '../../../core/services/wallet.service';
import { PaymentChallengeReturnComponent } from './payment-challenge-return.component';

describe('PaymentChallengeReturnComponent', () => {
  async function create(outcome: 'ok' | 'ko') {
    const router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    const wallet = jasmine.createSpyObj<WalletService>('WalletService', ['load']);
    const operations = jasmine.createSpyObj<OperationsService>('OperationsService', ['load']);
    const challenge = jasmine.createSpyObj<PaymentChallengeService>('PaymentChallengeService', ['getPending', 'clear']);
    wallet.load.and.resolveTo();
    operations.load.and.resolveTo();
    challenge.getPending.and.returnValue({
      kind: 'fine',
      returnUrl: '/app/operations/unpaid-fines/42',
      startedAt: Date.now(),
      amount: 20,
    });

    await TestBed.configureTestingModule({
      imports: [PaymentChallengeReturnComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { outcome } } } },
        { provide: Router, useValue: router },
        { provide: WalletService, useValue: wallet },
        { provide: OperationsService, useValue: operations },
        { provide: PaymentChallengeService, useValue: challenge },
      ],
    })
      .overrideComponent(PaymentChallengeReturnComponent, { set: { template: '', imports: [] } })
      .compileComponents();

    const fixture: ComponentFixture<PaymentChallengeReturnComponent> = TestBed.createComponent(PaymentChallengeReturnComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component: fixture.componentInstance, router, wallet, operations, challenge };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('treats /ok as pending verification, refreshes server-backed data and resumes the originating flow', async () => {
    const { component, router, wallet, operations, challenge } = await create('ok');

    expect(component.outcome()).toBe('ok');
    expect(component.completed()).toBeTrue();
    expect(wallet.load).toHaveBeenCalled();
    expect(operations.load).toHaveBeenCalled();

    component.finish();

    expect(challenge.clear).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/operations/unpaid-fines/42');
  });

  it('shows a failed result for /ko without refreshing or silently reporting success', async () => {
    const { component, wallet, operations, challenge } = await create('ko');

    expect(component.outcome()).toBe('ko');
    expect(component.completed()).toBeTrue();
    expect(wallet.load).not.toHaveBeenCalled();
    expect(operations.load).not.toHaveBeenCalled();

    component.finish();
    expect(challenge.clear).toHaveBeenCalled();
  });
});
