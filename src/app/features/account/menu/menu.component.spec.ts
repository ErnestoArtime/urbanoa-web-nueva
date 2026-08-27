import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { TranslationService } from '../../../core/services/translation.service';
import { UserService } from '../../../core/services/user.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { WalletService } from '../../../core/services/wallet.service';
import { AccountMenuComponent } from './menu.component';

describe('AccountMenuComponent', () => {
  it('loads the wallet when account is opened directly', async () => {
    const wallet = {
      balance: signal(0),
      source: signal<'idle' | 'remote' | 'error'>('idle'),
      loading: signal(false),
      load: jasmine.createSpy().and.resolveTo(),
    };

    TestBed.configureTestingModule({
      imports: [AccountMenuComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: { url: '/app/account', events: new Subject() } },
        { provide: TranslationService, useValue: { currentLang$: () => 'es', translateLabel: (value: string) => value } },
        { provide: WalletService, useValue: wallet },
        { provide: UserService, useValue: { user: signal({ name: '', surname: '', email: '' }) } },
        { provide: VehicleService, useValue: { vehicles: signal([]) } },
      ],
    });
    TestBed.overrideComponent(AccountMenuComponent, { set: { template: '' } });

    const fixture = TestBed.createComponent(AccountMenuComponent);
    await fixture.whenStable();

    expect(wallet.load).toHaveBeenCalledTimes(1);
  });

  it('does not reload a wallet that is already available', async () => {
    const wallet = {
      balance: signal(298.23),
      source: signal<'idle' | 'remote' | 'error'>('remote'),
      loading: signal(false),
      load: jasmine.createSpy().and.resolveTo(),
    };

    TestBed.configureTestingModule({
      imports: [AccountMenuComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: { url: '/app/account', events: new Subject() } },
        { provide: TranslationService, useValue: { currentLang$: () => 'es', translateLabel: (value: string) => value } },
        { provide: WalletService, useValue: wallet },
        { provide: UserService, useValue: { user: signal({ name: '', surname: '', email: '' }) } },
        { provide: VehicleService, useValue: { vehicles: signal([]) } },
      ],
    });
    TestBed.overrideComponent(AccountMenuComponent, { set: { template: '' } });

    const fixture = TestBed.createComponent(AccountMenuComponent);
    await fixture.whenStable();

    expect(wallet.load).not.toHaveBeenCalled();
  });
});
