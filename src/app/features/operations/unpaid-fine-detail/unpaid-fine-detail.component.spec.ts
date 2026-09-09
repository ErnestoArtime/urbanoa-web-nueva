import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { OpsApiError } from '../../../core/api/ops-api.types';
import { FineStatus, UnpaidFine, UnpaidFinesService } from '../../../core/services/unpaid-fines.service';
import { TranslationService } from '../../../core/services/translation.service';
import { WalletService } from '../../../core/services/wallet.service';
import { UnpaidFineDetailComponent } from './unpaid-fine-detail.component';

describe('UnpaidFineDetailComponent', () => {
  let fixture: ComponentFixture<UnpaidFineDetailComponent>;
  let translate: jasmine.Spy;

  const payableFine: UnpaidFine = {
    id: 'fine-1',
    fineNumber: 'FN-2026-001',
    plate: '1234 ABC',
    date: '02/09/2026',
    amount: '30,00 €',
    amountValue: 30,
    status: FineStatus.PAYABLE,
    location: 'ZONA 1 · Z1 ALTA ROTACION',
    contractId: 7,
  };

  const expiredFine: UnpaidFine = {
    ...payableFine,
    status: FineStatus.EXPIRED,
  };

  function configure(fine: UnpaidFine, service: Partial<UnpaidFinesService>) {
    const wallet = {
      balance: () => 100,
      cards: () => [] as { id: string }[],
      defaultCardId: () => '',
    };
    translate = jasmine.createSpy('translate').and.callFake((key: string, params?: Record<string, string>) => {
      if (params && 'message' in params) return `${key}: ${String(params['message'])}`;
      return key;
    });

    TestBed.configureTestingModule({
      imports: [UnpaidFineDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (key: string) => (key === 'id' ? fine.id : null) } } },
        },
        {
          provide: UnpaidFinesService,
          useValue: { getFine: () => fine, payFine: service.payFine, acknowledgeExpired: service.acknowledgeExpired },
        },
        { provide: WalletService, useValue: wallet },
        { provide: TranslationService, useValue: { translate } },
      ],
    });

    fixture = TestBed.createComponent(UnpaidFineDetailComponent);
    fixture.detectChanges();
  }

  it('shows the pay error message including the localized backend error', async () => {
    const backendError = new OpsApiError('backend', 'OPSWebServicesAPI/ConfirmPaymentAPI', 'La tarjeta ha sido rechazada', 200, {
      code: -21,
      type: 2,
      message_ES: 'La tarjeta ha sido rechazada',
    });
    configure(payableFine, { payFine: jasmine.createSpy('payFine').and.resolveTo({ success: false, error: backendError }) });
    await fixture.componentInstance.pay();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('ops.fineDetail.payFailed: La tarjeta ha sido rechazada');
  });

  it('shows a generic message when the pay error has no backend payload', async () => {
    const transportError = new OpsApiError('transport', 'OPSWebServicesAPI/ConfirmPaymentAPI', 'connection lost');
    configure(payableFine, { payFine: jasmine.createSpy('payFine').and.resolveTo({ success: false, error: transportError }) });
    await fixture.componentInstance.pay();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('ops.fineDetail.payFailed: errors.network');
  });

  it('shows the failure modal when acknowledging an expired fine fails', async () => {
    const backendError = new OpsApiError('backend', 'OPSWebServicesAPI/UpdateFineStatusAPI', 'No se pudo archivar', 200, {
      code: -21,
      type: 2,
      message_ES: 'No se pudo archivar',
    });
    configure(expiredFine, {
      acknowledgeExpired: jasmine.createSpy('acknowledgeExpired').and.resolveTo({ success: false, error: backendError }),
    });
    await fixture.componentInstance.acknowledgeExpired();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('ops.fineDetail.actionFailed: No se pudo archivar');
  });

  it('shows the acknowledged success modal when the fine is moved to history', async () => {
    configure(expiredFine, { acknowledgeExpired: jasmine.createSpy('acknowledgeExpired').and.resolveTo({ success: true }) });
    await fixture.componentInstance.acknowledgeExpired();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('ops.fineDetail.acknowledgedTitle');
  });

  it('dismisses the error modal when the close action is triggered', async () => {
    const backendError = new OpsApiError('backend', 'OPSWebServicesAPI/UpdateFineStatusAPI', 'No se pudo archivar', 200, {
      code: -21,
      type: 2,
      message_ES: 'No se pudo archivar',
    });
    configure(expiredFine, {
      acknowledgeExpired: jasmine.createSpy('acknowledgeExpired').and.resolveTo({ success: false, error: backendError }),
    });
    await fixture.componentInstance.acknowledgeExpired();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).not.toBeNull();

    const closeButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'common.close',
    ) as HTMLButtonElement | undefined;
    closeButton?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toBeNull();
  });
});
