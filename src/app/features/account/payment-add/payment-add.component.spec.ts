import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { MainCard, WalletService } from '../../../core/services/wallet.service';
import { PaymentAddComponent } from './payment-add.component';

describe('PaymentAddComponent card confirmation', () => {
  const card = (id: string): MainCard => ({ id, brand: 'Visa', last4: '1234', expiryDate: '12/30', cardholderName: '' });

  async function setup() {
    const wallet = {
      load: jasmine.createSpy('load').and.resolveTo(),
      loadPaymentMethodForm: jasmine.createSpy('form').and.resolveTo('<html></html>'),
      source: signal<'remote' | 'error'>('remote'),
      cards: signal([card('existing')]),
    };
    TestBed.configureTestingModule({
      imports: [PaymentAddComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: WalletService, useValue: wallet },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
      ],
    });
    TestBed.overrideComponent(PaymentAddComponent, { set: { template: '<iframe #paymentFrame title="Test"></iframe>' } });
    const fixture = TestBed.createComponent(PaymentAddComponent);
    await fixture.whenStable();
    const frame = fixture.nativeElement.querySelector('iframe') as HTMLIFrameElement;
    const message = (origin = window.location.origin, source: Window | null = frame.contentWindow) => {
      window.dispatchEvent(new MessageEvent('message', { data: 'urbanoa-card-added', origin, source }));
    };
    return { wallet, fixture, message };
  }

  it('requires the expected origin and the actual payment iframe as source', async () => {
    const { wallet, fixture, message } = await setup();
    message('https://unexpected.example.invalid');
    message(window.location.origin, window);
    await fixture.whenStable();
    expect(wallet.load).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.success()).toBeFalse();
  });

  it('requires a new card in an authenticated successful catalogue load and retries without repeating the form', async () => {
    const { wallet, fixture, message } = await setup();
    message();
    await fixture.whenStable();
    expect(fixture.componentInstance.success()).toBeFalse();
    expect(fixture.componentInstance.confirmationError()).toBeTrue();
    wallet.load.and.callFake(async () => {
      wallet.cards.set([card('existing'), card('new')]);
    });
    fixture.componentInstance.retry();
    await fixture.whenStable();
    expect(fixture.componentInstance.success()).toBeTrue();
    expect(wallet.loadPaymentMethodForm).toHaveBeenCalledTimes(1);
  });

  it('does not accept a new-looking card when the remote refresh failed', async () => {
    const { wallet, fixture, message } = await setup();
    wallet.load.and.callFake(async () => {
      wallet.source.set('error');
      wallet.cards.set([card('new')]);
    });
    message();
    await fixture.whenStable();
    expect(fixture.componentInstance.success()).toBeFalse();
    expect(fixture.componentInstance.confirmationError()).toBeTrue();
  });

  it('ignores duplicate completion messages while checking the backend and emits one confirmed addition', async () => {
    const { wallet, fixture, message } = await setup();
    let finish!: () => void;
    wallet.load.and.returnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const added = jasmine.createSpy('added');
    fixture.componentInstance.added.subscribe(added);
    message();
    message();
    expect(wallet.load).toHaveBeenCalledTimes(2);
    wallet.cards.set([card('new')]);
    finish();
    await fixture.whenStable();
    expect(added).toHaveBeenCalledTimes(1);
  });
});
