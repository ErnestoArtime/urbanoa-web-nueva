import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppApiClient } from '../api/app-api-client.service';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { UnpaidFinesService } from './unpaid-fines.service';
import { WalletService } from './wallet.service';

describe('UnpaidFinesService stored data migration', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: WalletService, useValue: {} },
        { provide: OpsApiClient, useValue: {} },
        { provide: OpsSessionService, useValue: {} },
        { provide: AppApiClient, useValue: {} },
      ],
    });
  });

  it('does not hydrate sanctions from legacy local storage', () => {
    localStorage.setItem(
      'urbanoa.unpaid-fines',
      JSON.stringify([
        { id: 'legacy-fine', plate: '1234 ABC', date: '05/06/2026', amount: '35,00 €', amountValue: 35, location: 'Nagusia Kalea' },
      ]),
    );

    const service = TestBed.inject(UnpaidFinesService);
    expect(service.getFine('legacy-fine')).toBeUndefined();
  });
});
